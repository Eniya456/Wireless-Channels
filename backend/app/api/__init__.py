"""API Router assembly package."""

from fastapi import APIRouter
from .routes_simulation import router as simulation_router
from .routes_ml import router as ml_router
from .routes_experiments import router as experiments_router
from .routes_system import router as system_router

api_router = APIRouter()
api_router.include_router(simulation_router)
api_router.include_router(ml_router)
api_router.include_router(experiments_router)
api_router.include_router(system_router)

__all__ = ["api_router"]
