from pydantic import BaseModel


class LearningFeedbackRequest(BaseModel):
    learning_state_id: int
    rating: int  # 1-4: again, hard, good, easy
