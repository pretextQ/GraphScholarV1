from pydantic import BaseModel, Field

class GraphBuildRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000, description="要构建图谱的文本")