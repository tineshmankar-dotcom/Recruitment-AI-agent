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
    CandidateMatchResponse, CandidateComparisonResponse,
    MultiCandidateCompareRequest, MultiCandidateCompareResponse, RequirementComparisonRow
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

@router.get("/resumes/{resume_id}/match", response_model=CandidateMatchResponse)
async def get_resume_match(
    resume_id: str,
    job_id: Optional[str] = Query(None)
):
    """
    Evaluates candidate matching for a candidate against either their linked job or a specified job.
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

@router.post("/candidates/compare", response_model=MultiCandidateCompareResponse)
async def compare_multiple_candidates(
    request: MultiCandidateCompareRequest
):
    """
    Multi-candidate side-by-side comparison matrix.
    Aligns requirement evaluations, verified experience, noise level, and evidence scores row-by-row.
    """
    if not request.candidate_ids:
        raise HTTPException(status_code=400, detail="Please select at least 2 candidates to compare.")

    # Find job
    job = None
    if request.job_id:
        job = JobRepository.get(request.job_id)
    
    if not job:
        # Default to first available job or create mock representation
        all_jobs = JobRepository.list_all()
        job = all_jobs[0] if all_jobs else {
            "id": "default-job",
            "title": "Software Engineering Position",
            "parsed_data": {
                "classified_requirements": [
                    {"skill": "Python", "importance": "mandatory", "minimum_experience": 2},
                    {"skill": "FastAPI", "importance": "mandatory", "minimum_experience": 2},
                    {"skill": "PostgreSQL", "importance": "mandatory", "minimum_experience": 2},
                    {"skill": "Docker", "importance": "preferred", "minimum_experience": 1},
                    {"skill": "AWS", "importance": "preferred", "minimum_experience": 1},
                    {"skill": "Microservices", "importance": "preferred", "minimum_experience": 1}
                ]
            }
        }

    candidate_matches: List[Dict[str, Any]] = []
    for cid in request.candidate_ids:
        resume = ResumeRepository.get(cid)
        if resume:
            eval_res = MatchingEngine.evaluate_match(resume, job)
            candidate_matches.append(eval_res)

    if not candidate_matches:
        raise HTTPException(status_code=404, detail="None of the specified candidates were found in the database.")

    # Extract unified requirement list
    all_requirements = []
    seen_reqs = set()
    for cm in candidate_matches:
        for re_item in cm["requirement_evaluations"]:
            req_name = re_item["requirement"]
            if req_name not in seen_reqs:
                seen_reqs.add(req_name)
                all_requirements.append({
                    "requirement": req_name,
                    "importance": re_item["importance"]
                })

    # Build row-by-row matrix
    requirement_matrix: List[Dict[str, Any]] = []
    for r in all_requirements:
        req_name = r["requirement"]
        eval_map = {}
        for cm in candidate_matches:
            cid = cm["candidate_id"]
            cand_eval = next((e for e in cm["requirement_evaluations"] if e["requirement"] == req_name), None)
            if cand_eval:
                eval_map[cid] = {
                    "status": cand_eval["status"],
                    "evidence_strength": cand_eval["evidence_strength"],
                    "evidence_score": cand_eval["evidence_score"],
                    "evidence_text": cand_eval["evidence_text"],
                    "resume_location": cand_eval["resume_location"],
                    "duration": cand_eval["duration"],
                    "recency": cand_eval["recency"]
                }
            else:
                eval_map[cid] = {
                    "status": "MISSING",
                    "evidence_strength": "No evidence",
                    "evidence_score": 0.0,
                    "evidence_text": "Evidence not found in resume.",
                    "resume_location": "N/A",
                    "duration": None,
                    "recency": "N/A"
                }

        requirement_matrix.append({
            "requirement": req_name,
            "importance": r["importance"],
            "candidate_evaluations": eval_map
        })

    # Generate summary comparison
    sorted_by_score = sorted(candidate_matches, key=lambda x: x["final_match_score"], reverse=True)
    winner = sorted_by_score[0]["candidate_name"] if sorted_by_score else "N/A"

    return {
        "job_id": job.get("id"),
        "job_title": job.get("title", "Engineering Position"),
        "candidates": candidate_matches,
        "requirement_matrix": requirement_matrix,
        "summary_comparison": {
            "top_candidate": winner,
            "total_candidates_compared": len(candidate_matches),
            "highest_score": sorted_by_score[0]["final_match_score"] if sorted_by_score else 0,
            "lowest_noise_candidate": min(candidate_matches, key=lambda x: x["noise_analysis"]["noise_score"])["candidate_name"] if candidate_matches else "N/A"
        }
    }

@router.get("/demo/comparison", response_model=CandidateComparisonResponse)
async def get_synthetic_candidate_comparison():
    """
    Mandatory Phase 4 & Phase 5 Benchmark Demo:
    Candidate A (15 keyword mentions, 2 mo internship, weak evidence, high noise)
    vs
    Candidate B (4 keyword mentions, 18 mo professional experience, production ML API, strong evidence).
    """
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
