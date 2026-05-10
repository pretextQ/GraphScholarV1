from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class LearningTaskResponse(BaseModel):
    id: int
    knowledge_node_id: int
    title: str
    content: str
    stability: float
    difficulty: float
    due: Optional[datetime] = None
    state: str

    class Config:
        from_attributes = True


class FeedbackResponse(BaseModel):
    message: str
    next_review: str
    scheduled_days: int
