from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RequirementMatchItem(BaseModel):
    requirement: str
    importance: str  # MANDATORY, PREFERRED, OPTIONAL
    status: str      # MATCHED, PARTIALLY MATCHED, MISSING, UNCERTAIN
    status_explanation: str
    evidence_strength: str
    evidence_score: float
    evidence_text: str
    resume_location: str
    project_or_job: str
    duration: Optional[str] = None
    recency: str

class ScoreBreakdown(BaseModel):
    mandatory_requirements: float
    relevant_experience: float
    evidence_strength: float
    skill_depth: float
    recency: float
    preferred_requirements: float
    noise_penalty: float
    uncertainty: float

class NoiseAnalysisResponse(BaseModel):
    noise_level: str  # Low, Moderate, High, Critical
    noise_score: float
    total_keyword_occurrences: int
    total_evidence_backed_occurrences: int
    total_strong_evidence: int
    total_weak_evidence: int
    stuffed_skills: List[str] = []
    skills_only_in_list: List[str] = []
    jd_copy_paste_detected: bool = False
    noise_reasons: List[str] = []
    skill_breakdown: Optional[Dict[str, Any]] = None

class CandidateMatchResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    job_id: str
    job_title: str
    final_match_score: float
    match_grade: str
    score_breakdown: ScoreBreakdown
    experience_details: Optional[Dict[str, Any]] = None
    noise_analysis: NoiseAnalysisResponse
    requirement_evaluations: List[RequirementMatchItem]
    
    # Phase 5 Explainable Shortlist metrics
    mandatory_coverage: float = 0.0
    mandatory_met_count: int = 0
    mandatory_total_count: int = 0
    preferred_coverage: float = 0.0
    preferred_met_count: int = 0
    preferred_total_count: int = 0
    strong_matches: List[str] = []
    partial_matches: List[str] = []
    missing_requirements: List[str] = []
    uncertain_requirements: List[str] = []
    evidence_strength_summary: str = "Moderate"
    
    why_this_score: str

class MultiCandidateCompareRequest(BaseModel):
    candidate_ids: List[str]
    job_id: Optional[str] = None

class RequirementComparisonRow(BaseModel):
    requirement: str
    importance: str
    candidate_evaluations: Dict[str, Dict[str, Any]]  # candidate_id -> { status, strength, snippet, score }

class MultiCandidateCompareResponse(BaseModel):
    job_id: Optional[str] = None
    job_title: str
    candidates: List[CandidateMatchResponse]
    requirement_matrix: List[RequirementComparisonRow]
    summary_comparison: Dict[str, Any]

class CandidateComparisonResponse(BaseModel):
    job_title: str
    candidate_a: CandidateMatchResponse
    candidate_b: CandidateMatchResponse
    comparison_summary: str
    winner: str
    rationale: str
