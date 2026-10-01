from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class RequirementItem(BaseModel):
    skill: str
    importance: Literal["mandatory", "preferred", "optional"]
    minimum_experience: Optional[int] = Field(default=None, description="Minimum years of experience required if specified")
    category: Optional[str] = Field(default="Technical", description="Technical, Soft Skill, Domain, Education, etc.")

class ParsedJDData(BaseModel):
    job_title: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    required_experience: Optional[str] = None
    min_years_experience: Optional[int] = 0
    education: List[str] = []
    certifications: List[str] = []
    responsibilities: List[str] = []
    technical_requirements: List[str] = []
    domain_requirements: List[str] = []
    soft_skills: List[str] = []
    classified_requirements: List[RequirementItem] = []

class JobCreate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = "Engineering"
    location: Optional[str] = "Remote"
    experience_level: Optional[str] = "Mid-Senior"
    raw_description: str

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    raw_description: Optional[str] = None
    status: Optional[str] = None

class JobResponse(BaseModel):
    id: str
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    raw_description: str
    status: str
    parsed_data: Optional[ParsedJDData] = None
    created_at: datetime
    updated_at: datetime
    total_resumes: Optional[int] = 0
    processed_resumes: Optional[int] = 0

    class Config:
        from_attributes = True

class AnalyzeJDRequest(BaseModel):
    raw_description: str
    title: Optional[str] = None

class AnalyzeJDResponse(BaseModel):
    parsed_data: ParsedJDData
