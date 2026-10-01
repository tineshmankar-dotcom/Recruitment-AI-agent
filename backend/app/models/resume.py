import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=True, index=True)
    
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_hash = Column(String(64), nullable=False, index=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(20), nullable=False)  # pdf, docx, txt
    
    # Preserved original full text
    raw_text = Column(Text, nullable=True)
    
    # Parsed candidate summary fields
    candidate_name = Column(String(255), nullable=True, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    
    # Processing status: pending, processing, processed, failed, duplicate
    status = Column(String(50), default="pending", index=True)
    error_message = Column(Text, nullable=True)
    
    # Comprehensive parsed data JSON
    # {
    #   "candidate_name": "...",
    #   "email": "...",
    #   "phone": "...",
    #   "education": [{"degree": "...", "institution": "...", "year": "..."}],
    #   "work_experience": [{"job_title": "...", "company": "...", "employment_dates": "...", "responsibilities": [], "achievements": []}],
    #   "job_titles": ["..."],
    #   "companies": ["..."],
    #   "employment_dates": ["..."],
    #   "projects": [{"name": "...", "description": "...", "technologies": []}],
    #   "skills": ["..."],
    #   "certifications": ["..."],
    #   "achievements": ["..."],
    #   "technologies": ["..."]
    # }
    parsed_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="resumes")
