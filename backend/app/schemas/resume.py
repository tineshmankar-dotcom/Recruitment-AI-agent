from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class EducationItem(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None
    details: Optional[str] = None

class WorkExperienceItem(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    employment_dates: Optional[str] = None
    duration_years: Optional[float] = None
    responsibilities: List[str] = []
    achievements: List[str] = []

class ProjectItem(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = []

class ParsedResumeData(BaseModel):
    candidate_name: Optional[str] = "Unknown Candidate"
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    education: List[EducationItem] = []
    work_experience: List[WorkExperienceItem] = []
    job_titles: List[str] = []
    companies: List[str] = []
    employment_dates: List[str] = []
    projects: List[ProjectItem] = []
    skills: List[str] = []
    normalized_skills: List[Dict[str, Any]] = []
    certifications: List[str] = []
    achievements: List[str] = []
    technologies: List[str] = []

class ResumeResponse(BaseModel):
    id: str
    job_id: Optional[str] = None
    file_name: str
    file_size: Optional[int] = None
    file_type: str
    raw_text: Optional[str] = None
    candidate_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    parsed_data: Optional[ParsedResumeData] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ResumeSummaryResponse(BaseModel):
    id: str
    job_id: Optional[str] = None
    file_name: str
    candidate_name: Optional[str] = None
    email: Optional[str] = None
    status: str
    skills_count: int = 0
    experience_count: int = 0
    created_at: datetime

class BulkResumeUploadResponse(BaseModel):
    total_uploaded: int
    processed: int
    duplicates: int
    failed: int
    resumes: List[ResumeResponse]
