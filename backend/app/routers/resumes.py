import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File
from app.database import JobRepository, ResumeRepository
from app.schemas.resume import (
    ResumeResponse, BulkResumeUploadResponse
)
from app.parsers.doc_parser import DocumentParser
from app.parsers.resume_parser import ResumeParser
from app.config import settings

router = APIRouter(prefix="", tags=["Resumes"])

@router.post("/jobs/{job_id}/resumes", response_model=BulkResumeUploadResponse)
async def upload_resumes_for_job(
    job_id: str,
    files: List[UploadFile] = File(...)
):
    """
    Bulk resume upload endpoint for PDF, DOCX, and TXT files.
    - Extracts original raw text
    - Performs SHA-256 duplicate detection
    - Parses candidate information (Name, Contact, Education, Experience, Projects, Skills, Certs, Achievements)
    - Assigns unique Candidate ID
    - Robust error handling for corrupted/failed files
    """
    job = JobRepository.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target Job with ID '{job_id}' not found."
        )

    processed_count = 0
    duplicate_count = 0
    failed_count = 0
    responses: List[ResumeResponse] = []

    for file in files:
        filename = file.filename or "unknown_resume.txt"
        ext = filename.lower().split(".")[-1]
        
        # Validate allowed extension
        if ext not in settings.ALLOWED_EXTENSIONS:
            failed_count += 1
            failed_resume = ResumeRepository.create({
                "id": str(uuid.uuid4()),
                "job_id": job_id,
                "file_name": filename,
                "file_hash": f"unsupported_{uuid.uuid4().hex[:12]}",
                "file_type": ext,
                "status": "failed",
                "error_message": f"Unsupported file format: .{ext}. Supported formats: {', '.join(settings.ALLOWED_EXTENSIONS).upper()}"
            })
            responses.append(failed_resume)
            continue

        try:
            content = await file.read()
            file_size = len(content)
            
            # Check maximum file size (15MB)
            if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                failed_count += 1
                failed_resume = ResumeRepository.create({
                    "id": str(uuid.uuid4()),
                    "job_id": job_id,
                    "file_name": filename,
                    "file_hash": f"oversize_{uuid.uuid4().hex[:12]}",
                    "file_size": file_size,
                    "file_type": ext,
                    "status": "failed",
                    "error_message": f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
                })
                responses.append(failed_resume)
                continue

            # Calculate SHA-256 hash for duplicate detection
            file_hash = DocumentParser.compute_hash(content)
            
            # Check duplicate in this job
            existing = ResumeRepository.find_by_hash(job_id, file_hash)
            if existing:
                duplicate_count += 1
                responses.append(existing)
                continue

            # Save file to disk
            safe_filename = f"{uuid.uuid4().hex[:8]}_{filename.replace(' ', '_')}"
            file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
            with open(file_path, "wb") as f:
                f.write(content)

            # Extract raw text
            raw_text, detected_type = DocumentParser.extract_text(content, filename)
            
            if not raw_text.strip():
                failed_count += 1
                failed_resume = ResumeRepository.create({
                    "id": str(uuid.uuid4()),
                    "job_id": job_id,
                    "file_name": filename,
                    "file_path": file_path,
                    "file_hash": file_hash,
                    "file_size": file_size,
                    "file_type": detected_type,
                    "status": "failed",
                    "error_message": "Document contains no extractable text."
                })
                responses.append(failed_resume)
                continue

            # Parse candidate data
            parsed_data = ResumeParser.parse(raw_text, filename)
            
            candidate_id = str(uuid.uuid4())
            new_resume = ResumeRepository.create({
                "id": candidate_id,
                "job_id": job_id,
                "file_name": filename,
                "file_path": file_path,
                "file_hash": file_hash,
                "file_size": file_size,
                "file_type": detected_type,
                "raw_text": raw_text,
                "candidate_name": parsed_data.get("candidate_name", "Candidate"),
                "email": parsed_data.get("email"),
                "phone": parsed_data.get("phone"),
                "location": parsed_data.get("location"),
                "status": "processed",
                "parsed_data": parsed_data
            })
            
            processed_count += 1
            responses.append(new_resume)

        except Exception as e:
            failed_count += 1
            err_resume = ResumeRepository.create({
                "id": str(uuid.uuid4()),
                "job_id": job_id,
                "file_name": filename,
                "file_hash": f"error_{uuid.uuid4().hex[:12]}",
                "file_type": ext,
                "status": "failed",
                "error_message": str(e)
            })
            responses.append(err_resume)

    return {
        "total_uploaded": len(files),
        "processed": processed_count,
        "duplicates": duplicate_count,
        "failed": failed_count,
        "resumes": responses
    }

@router.get("/jobs/{job_id}/resumes", response_model=List[ResumeResponse])
async def get_resumes_for_job(
    job_id: str,
    status_filter: Optional[str] = None
):
    return ResumeRepository.list_by_job(job_id, status_filter)

@router.get("/resumes/{resume_id}", response_model=ResumeResponse)
async def get_resume_by_id(resume_id: str):
    resume = ResumeRepository.get(resume_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate Resume with ID '{resume_id}' not found."
        )
    return resume

@router.get("/resumes", response_model=List[ResumeResponse])
async def list_all_resumes():
    return ResumeRepository.list_all()

@router.delete("/resumes/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(resume_id: str):
    resume = ResumeRepository.get(resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    
    if resume.get("file_path") and os.path.exists(resume["file_path"]):
        try:
            os.remove(resume["file_path"])
        except OSError:
            pass

    ResumeRepository.delete(resume_id)
    return None
