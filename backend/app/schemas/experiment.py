"""Pydantic Request and Response Schemas for Experiments."""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ExperimentCreateRequest(BaseModel):
    title: str = Field(default="Wireless Simulation Run", max_length=150)
    description: Optional[str] = Field(default="", max_length=500)
    configuration: Dict[str, Any]
    metrics: Dict[str, Any]
    ml_prediction: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class ExperimentResponse(BaseModel):
    id: str
    timestamp: str
    title: str
    description: Optional[str] = ""
    configuration: Dict[str, Any]
    metrics: Dict[str, Any]
    ml_prediction: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = []


class CompareExperimentsRequest(BaseModel):
    experiment_ids: List[str] = Field(..., min_length=2, max_length=10)
