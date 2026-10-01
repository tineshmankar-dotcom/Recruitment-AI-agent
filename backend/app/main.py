from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import jobs_router, resumes_router, stats_router, evidence_router

app = FastAPI(
    title="RecruitIQ Backend API",
    description="Intelligent Recruitment Agent API - Job Description Analysis, Resume Processing, Skill Normalization & Evidence Extraction",
    version="1.3.0"
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

# Direct root exposure
app.include_router(jobs_router)
app.include_router(resumes_router)
app.include_router(stats_router)
app.include_router(evidence_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "RecruitIQ Recruitment Intelligence Platform",
        "version": "1.3.0",
        "features": ["JD Analysis", "Resume Bulk Parsing", "Skill Normalization", "Evidence Extraction"],
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
