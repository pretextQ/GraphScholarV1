from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class GraphPathResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]


class GraphBuildResponse(BaseModel):
    entities_count: int
    relations_count: int
    message: str
