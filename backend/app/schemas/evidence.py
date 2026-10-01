from pydantic import BaseModel, Field
from typing import List, Optional

class NormalizedSkillItem(BaseModel):
    original_skill: str
    normalized_skill: str
    confidence: float
    category: Optional[str] = "General"

class EvidenceItem(BaseModel):
    requirement: str
    skill: str
    evidence_text: str
    resume_location: str
    project_or_job: str
    duration: Optional[str] = None
    recency: str
    context: str
    evidence_strength: str
    evidence_score: float
    confidence: float

class ExtractEvidenceRequest(BaseModel):
    job_id: Optional[str] = None
    requirements: Optional[List[str]] = None

class EvidenceResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    total_requirements: int
    evidence_found_count: int
    evidence_items: List[EvidenceItem]
