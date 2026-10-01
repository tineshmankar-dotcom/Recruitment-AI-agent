from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
from app.database import JobRepository, ResumeRepository
from app.parsers.evidence_extractor import EvidenceExtractor
from app.parsers.skill_normalizer import SkillNormalizer
from app.schemas.evidence import (
    EvidenceItem, EvidenceResponse, ExtractEvidenceRequest, NormalizedSkillItem
)

router = APIRouter(prefix="", tags=["Evidence & Skill Normalization"])

@router.post("/skills/normalize", response_model=List[NormalizedSkillItem])
async def normalize_skills(skills: List[str]):
    """
    Normalize arbitrary skill names to canonical representations.
    Returns original skill, normalized skill, confidence, and category.
    """
    return SkillNormalizer.normalize_skills_list(skills)

@router.get("/resumes/{resume_id}/evidence", response_model=EvidenceResponse)
async def get_resume_evidence(
    resume_id: str,
    job_id: Optional[str] = Query(None, description="Optional Job ID to extract specific requirement evidence against")
):
    """
    Extracts verifiable evidence from candidate resume for JD requirements or candidate core skills.
    Never invents evidence. If not found, explicitly states 'Evidence not found in resume.'
    """
    resume = ResumeRepository.get(resume_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with ID '{resume_id}' not found."
        )

    target_job_id = job_id or resume.get("job_id")
    target_requirements: List[str] = []
    job_title = None

    if target_job_id:
        job = JobRepository.get(target_job_id)
        if job:
            job_title = job.get("title")
            parsed_jd = job.get("parsed_data") or {}
            # Extract requirements list from JD
            classified = parsed_jd.get("classified_requirements") or []
            if classified:
                target_requirements = [c["skill"] for c in classified]
            else:
                target_requirements = (parsed_jd.get("required_skills") or []) + (parsed_jd.get("preferred_skills") or [])

    # If no job requirements found, extract evidence for candidate's top extracted skills
    if not target_requirements:
        parsed_res = resume.get("parsed_data") or {}
        target_requirements = (parsed_res.get("skills") or [])[:8]

    if not target_requirements:
        target_requirements = ["Python", "JavaScript", "SQL", "Docker", "REST API", "Communication"]

    evidence_list = EvidenceExtractor.extract_all_evidence(target_requirements, resume)
    found_count = sum(1 for e in evidence_list if e["evidence_strength"] != "No evidence")

    return {
        "candidate_id": resume_id,
        "candidate_name": resume.get("candidate_name") or "Candidate",
        "job_id": target_job_id,
        "job_title": job_title,
        "total_requirements": len(target_requirements),
        "evidence_found_count": found_count,
        "evidence_items": evidence_list
    }

@router.post("/resumes/{resume_id}/evidence", response_model=EvidenceResponse)
async def extract_custom_evidence(
    resume_id: str,
    request: ExtractEvidenceRequest
):
    """
    Extract evidence for a custom list of requirements against a candidate's resume.
    """
    resume = ResumeRepository.get(resume_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with ID '{resume_id}' not found."
        )

    target_requirements = request.requirements or []
    job_title = None

    if request.job_id:
        job = JobRepository.get(request.job_id)
        if job:
            job_title = job.get("title")
            if not target_requirements:
                parsed_jd = job.get("parsed_data") or {}
                classified = parsed_jd.get("classified_requirements") or []
                if classified:
                    target_requirements = [c["skill"] for c in classified]
                else:
                    target_requirements = (parsed_jd.get("required_skills") or []) + (parsed_jd.get("preferred_skills") or [])

    if not target_requirements:
        parsed_res = resume.get("parsed_data") or {}
        target_requirements = (parsed_res.get("skills") or [])[:8]

    evidence_list = EvidenceExtractor.extract_all_evidence(target_requirements, resume)
    found_count = sum(1 for e in evidence_list if e["evidence_strength"] != "No evidence")

    return {
        "candidate_id": resume_id,
        "candidate_name": resume.get("candidate_name") or "Candidate",
        "job_id": request.job_id or resume.get("job_id"),
        "job_title": job_title,
        "total_requirements": len(target_requirements),
        "evidence_found_count": found_count,
        "evidence_items": evidence_list
    }
