from pydantic import BaseModel
from typing import Optional


class KnowledgeNodeResponse(BaseModel):
    id: int
    title: str
    content: str
    source_file: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
