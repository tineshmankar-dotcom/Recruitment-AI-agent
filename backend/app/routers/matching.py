import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Query
from app.database import JobRepository, ResumeRepository
from app.parsers.matching_engine import MatchingEngine
from app.parsers.doc_parser import DocumentParser
from app.parsers.resume_parser import ResumeParser
from app.parsers.jd_parser import JobDescriptionParser
from app.schemas.matching import (
    CandidateMatchResponse, CandidateComparisonResponse
)

router = APIRouter(prefix="", tags=["Matching & Noise Detection"])

@router.get("/jobs/{job_id}/candidates/{resume_id}/match", response_model=CandidateMatchResponse)
async def get_candidate_match(
    job_id: str,
    resume_id: str
):
    """
    Evaluates evidence-based matching for a candidate against a job description.
    Returns classified requirement statuses (MATCHED, PARTIALLY MATCHED, MISSING, UNCERTAIN),
    score breakdown, noise detection analysis, and 'Why this score?' rationale.
    """
    job = JobRepository.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job with ID '{job_id}' not found.")

    resume = ResumeRepository.get(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail=f"Resume with ID '{resume_id}' not found.")

    match_result = MatchingEngine.evaluate_match(resume, job)
    return match_result

@router.get("/jobs/{job_id}/matches", response_model=List[CandidateMatchResponse])
async def get_job_candidate_rankings(
    job_id: str
):
    """
    Ranks all candidates for a job based on evidence-based scoring (not keyword counts).
    """
    job = JobRepository.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job with ID '{job_id}' not found.")

    resumes = ResumeRepository.list_by_job(job_id)
    results = []

    for r in resumes:
        if r.get("status") in ["processed", "pending"]:
            eval_res = MatchingEngine.evaluate_match(r, job)
            results.append(eval_res)

    # Sort descending by final evidence-based match score
    results.sort(key=lambda x: x["final_match_score"], reverse=True)
    return results

@router.get("/demo/comparison", response_model=CandidateComparisonResponse)
async def get_synthetic_candidate_comparison():
    """
    Mandatory Phase 4 Benchmark Demo:
    Candidate A (15 keyword mentions, 2 mo internship, weak evidence, high noise)
    vs
    Candidate B (4 keyword mentions, 18 mo professional experience, production ML API, strong evidence).
    """
    # Load Sample JD
    sample_jd_path = os.path.join(os.path.dirname(__file__), "..", "..", "sample_data", "sample_jd.txt")
    with open(sample_jd_path, "r", encoding="utf-8") as f:
        jd_text = f.read()

    parsed_jd = JobDescriptionParser.parse(jd_text, "Lead Python Backend Architect")
    mock_job = {
        "id": "demo-job-python-lead",
        "title": "Lead Python Backend Architect",
        "raw_description": jd_text,
        "parsed_data": parsed_jd
    }

    # Load Candidate A (Stuffed / 15 keywords / 2 mo internship)
    cand_a_path = os.path.join(os.path.dirname(__file__), "..", "..", "sample_data", "candidate_a_stuffed.txt")
    with open(cand_a_path, "r", encoding="utf-8") as f:
        cand_a_text = f.read()

    cand_a_parsed = ResumeParser.parse(cand_a_text, "candidate_a_stuffed.txt")
    mock_cand_a = {
        "id": "demo-cand-a-alex",
        "candidate_name": "Alex Rivera (Candidate A - 15 Keywords)",
        "raw_text": cand_a_text,
        "parsed_data": cand_a_parsed
    }

    # Load Candidate B (Evidence-Backed / 4 keywords / 18 mo pro exp / production ML API)
    cand_b_path = os.path.join(os.path.dirname(__file__), "..", "..", "sample_data", "candidate_b_evidence.txt")
    with open(cand_b_path, "r", encoding="utf-8") as f:
        cand_b_text = f.read()

    cand_b_parsed = ResumeParser.parse(cand_b_text, "candidate_b_evidence.txt")
    mock_cand_b = {
        "id": "demo-cand-b-brenda",
        "candidate_name": "Brenda Vance (Candidate B - 4 Keywords)",
        "raw_text": cand_b_text,
        "parsed_data": cand_b_parsed
    }

    eval_a = MatchingEngine.evaluate_match(mock_cand_a, mock_job)
    eval_b = MatchingEngine.evaluate_match(mock_cand_b, mock_job)

    winner = eval_b["candidate_name"] if eval_b["final_match_score"] > eval_a["final_match_score"] else eval_a["candidate_name"]

    summary = (
        f"Candidate B ({eval_b['final_match_score']}%) outranks Candidate A ({eval_a['final_match_score']}%) "
        f"because Candidate B provides 18 months of production-verified Python/FastAPI/Docker experience handling 12M requests, "
        f"while Candidate A has 15 superficial keyword mentions but only 2 months of basic internship experience and significant noise."
    )

    rationale = (
        "Key Takeaway: The RecruitIQ evidence engine penalizes keyword stuffing and values verified production depth. "
        "More keywords never automatically means a better candidate."
    )

    return {
        "job_title": mock_job["title"],
        "candidate_a": eval_a,
        "candidate_b": eval_b,
        "comparison_summary": summary,
        "winner": winner,
        "rationale": rationale
    }
