from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    jobs_router,
    resumes_router,
    stats_router,
    evidence_router,
    matching_router,
    interview_router
)

app = FastAPI(
    title="RecruitIQ Backend API",
    description="Intelligent Recruitment Agent API - Evidence-Based Matching, Noise Detection & Interview Agent",
    version="1.5.0"
)

# CORS Middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under root and /api prefixes
app.include_router(jobs_router, prefix=settings.API_V1_STR)
app.include_router(resumes_router, prefix=settings.API_V1_STR)
app.include_router(stats_router, prefix=settings.API_V1_STR)
app.include_router(evidence_router, prefix=settings.API_V1_STR)
app.include_router(matching_router, prefix=settings.API_V1_STR)
app.include_router(interview_router, prefix=settings.API_V1_STR)

# Direct root exposure
app.include_router(jobs_router)
app.include_router(resumes_router)
app.include_router(stats_router)
app.include_router(evidence_router)
app.include_router(matching_router)
app.include_router(interview_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "RecruitIQ Recruitment Intelligence Platform",
        "version": "1.5.0",
        "features": [
            "JD Structuring",
            "Resume Parsing",
            "Skill Normalization",
            "Evidence Extraction",
            "Noise Detection",
            "Evidence-Based Matching",
            "Explainable Shortlist",
            "Interview Agent & Question Generation"
        ],
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
