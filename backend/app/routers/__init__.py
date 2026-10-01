from app.routers.jobs import router as jobs_router
from app.routers.resumes import router as resumes_router
from app.routers.stats import router as stats_router
from app.routers.evidence import router as evidence_router

__all__ = ["jobs_router", "resumes_router", "stats_router", "evidence_router"]
