from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class InterviewQuestion(BaseModel):
    id: str
    category: str  # Technical, Project, Experience Verification, Skill Verification, Clarification
    target_topic: str
    question: str
    context_source: str
    rationale: str
    expected_signals: List[str] = []
    red_flags: List[str] = []
    difficulty: str = "In-Depth"

class CandidateInterviewGuideResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    job_id: str
    job_title: str
    match_score: float
    match_grade: str
    total_questions: int
    interviewer_briefing: str
    technical_questions: List[InterviewQuestion] = []
    project_questions: List[InterviewQuestion] = []
    experience_questions: List[InterviewQuestion] = []
    skill_verification_questions: List[InterviewQuestion] = []
    clarification_questions: List[InterviewQuestion] = []
