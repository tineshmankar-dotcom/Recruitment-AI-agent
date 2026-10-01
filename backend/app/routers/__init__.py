from app.routers.jobs import router as jobs_router
from app.routers.resumes import router as resumes_router
from app.routers.stats import router as stats_router
from app.routers.evidence import router as evidence_router
from app.routers.matching import router as matching_router
from app.routers.interview import router as interview_router

__all__ = [
    "jobs_router",
    "resumes_router",
    "stats_router",
    "evidence_router",
    "matching_router",
    "interview_router"
]
