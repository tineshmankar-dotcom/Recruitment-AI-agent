import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, index=True)
    department = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    experience_level = Column(String(100), nullable=True)
    raw_description = Column(Text, nullable=False)
    status = Column(String(50), default="active", index=True)  # active, closed, draft
    
    # Structured parsed JD JSON storing requirements, classifications, skills, etc.
    parsed_data = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to resumes
    resumes = relationship("Resume", back_populates="job", cascade="all, delete-orphan")
