import os
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.database import JobRepository, ResumeRepository
from app.parsers.interview_agent import InterviewAgent
from app.parsers.jd_parser import JobDescriptionParser
from app.schemas.interview import CandidateInterviewGuideResponse, InterviewQuestion

router = APIRouter(prefix="", tags=["Interview Question Agent"])

@router.get("/resumes/{resume_id}/interview-questions", response_model=CandidateInterviewGuideResponse)
async def get_candidate_interview_questions(
    resume_id: str,
    job_id: Optional[str] = Query(None)
):
    """
    Generates personalized interview questions across 5 categories:
    1. Technical questions (deep dive on strong evidence)
    2. Project questions (architecture, decisions, bottlenecks)
    3. Experience verification questions (scale, team role, duration)
    4. Skill verification questions (targeting weak evidence or list-only skills)
    5. Clarification questions (missing requirements, uncertain claims, JD language copy)
    """
    resume = ResumeRepository.get(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail=f"Resume with ID '{resume_id}' not found.")

    target_job_id = job_id or resume.get("job_id")
    job = None
    if target_job_id:
        job = JobRepository.get(target_job_id)

    if not job:
        all_jobs = JobRepository.list_all()
        if all_jobs:
            job = all_jobs[0]
        else:
            sample_jd_path = os.path.join(os.path.dirname(__file__), "..", "..", "sample_data", "sample_jd.txt")
            if os.path.exists(sample_jd_path):
                with open(sample_jd_path, "r", encoding="utf-8") as f:
                    jd_text = f.read()
            else:
                jd_text = "Senior Python Engineer with FastAPI, PostgreSQL, Docker, AWS experience."
            parsed_jd = JobDescriptionParser.parse(jd_text, "Software Engineering Position")
            job = {
                "id": "default-job",
                "title": "Software Engineering Position",
                "raw_description": jd_text,
                "parsed_data": parsed_jd
            }

    guide = InterviewAgent.generate_interview_guide(resume, job)
    return guide

@router.get("/jobs/{job_id}/candidates/{resume_id}/interview-questions", response_model=CandidateInterviewGuideResponse)
async def get_job_candidate_interview_questions(
    job_id: str,
    resume_id: str
):
    """
    Generates tailored interview questions for a candidate linked to a specific job pipeline.
    """
    job = JobRepository.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job with ID '{job_id}' not found.")

    resume = ResumeRepository.get(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail=f"Resume with ID '{resume_id}' not found.")

    guide = InterviewAgent.generate_interview_guide(resume, job)
    return guide
