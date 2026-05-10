from pydantic import BaseModel


class ChatMessageRequest(BaseModel):
    question: str
