import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.database import JobRepository
from app.schemas.job import (
    JobCreate, JobUpdate, JobResponse, AnalyzeJDRequest, AnalyzeJDResponse
)
from app.parsers.jd_parser import JobDescriptionParser

router = APIRouter(prefix="", tags=["Jobs"])

@router.post("/analyze-jd", response_model=AnalyzeJDResponse)
async def analyze_job_description(request: AnalyzeJDRequest):
    """
    Analyzes raw job description text and returns structured extraction
    with classifications (MANDATORY, PREFERRED, OPTIONAL).
    """
    if not request.raw_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text cannot be empty."
        )
    parsed = JobDescriptionParser.parse(request.raw_description, request.title)
    return {"parsed_data": parsed}

@router.post("/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(job_in: JobCreate):
    """
    Create a new job posting. Automatically parses and structures the JD.
    """
    if not job_in.raw_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty."
        )

    # Parse and structure the JD
    parsed_dict = JobDescriptionParser.parse(job_in.raw_description, job_in.title)
    final_title = job_in.title or parsed_dict.get("job_title") or "Untitled Position"

    new_job = JobRepository.create({
        "id": str(uuid.uuid4()),
        "title": final_title,
        "department": job_in.department or "Engineering",
        "location": job_in.location or "Remote",
        "experience_level": job_in.experience_level or f"{parsed_dict.get('min_years_experience', 2)}+ Years",
        "raw_description": job_in.raw_description,
        "status": "active",
        "parsed_data": parsed_dict
    })

    return new_job

@router.get("/jobs", response_model=List[JobResponse])
async def list_jobs():
    """
    List all active and archived jobs with resume processing metrics.
    """
    return JobRepository.list_all()

@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """
    Retrieve single job details by ID with parsed data.
    """
    job = JobRepository.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found."
        )
    return job

@router.put("/jobs/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, job_update: JobUpdate):
    job = JobRepository.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    update_data = job_update.dict(exclude_unset=True)
    if "raw_description" in update_data and update_data["raw_description"]:
        parsed_dict = JobDescriptionParser.parse(update_data["raw_description"], update_data.get("title", job["title"]))
        update_data["parsed_data"] = parsed_dict

    updated = JobRepository.update(job_id, update_data)
    return updated

@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: str):
    success = JobRepository.delete(job_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return None
