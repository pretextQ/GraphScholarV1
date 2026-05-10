from pydantic import BaseModel
from typing import List, Optional, Dict


class RetrievalScore(BaseModel):
    title: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []
    graph_context: Optional[str] = None
    retrieval_scores: List[RetrievalScore] = []
