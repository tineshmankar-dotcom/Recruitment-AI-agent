from fastapi import APIRouter
from app.database import StatsRepository

router = APIRouter(prefix="/stats", tags=["Dashboard"])

@router.get("/dashboard")
async def get_dashboard_metrics():
    return StatsRepository.get_dashboard_metrics()
