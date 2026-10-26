"""FastAPI Main Application Entry Point.

B.Tech Computer Science Project:
Design and Performance Analysis of Wireless Channels Under Fading and Mobility
Using Machine Learning and Cloud Computing
"""

import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.api import api_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Web-based wireless communication simulation platform evaluating AWGN, Rayleigh fading, "
        "distance-based path loss, and receiver mobility with supporting Machine Learning channel "
        "assessment and Google Cloud Firestore persistence."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend Vite development server and production builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for strict production origins if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include central API routes
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/", tags=["Health"])
def root():
    """Root health and discovery endpoint."""
    return {
        "project": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "documentation": "/docs",
        "api_prefix": settings.API_PREFIX,
        "environment": settings.ENVIRONMENT,
    }


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Pass-through for standard HTTP exceptions with their correct status codes."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Validation exception handler returning detailed field violations."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global structured fallback error handler."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": f"Internal Server Error: {str(exc)}",
            "error": "InternalServerError",
            "message": str(exc),
            "path": request.url.path,
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
