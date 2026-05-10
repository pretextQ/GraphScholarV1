from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.learning.scheduler import learning_scheduler
from app.schemas.request.learning_feedback import LearningFeedbackRequest
from app.schemas.response.learning_task import LearningTaskResponse, FeedbackResponse

router = APIRouter(prefix="/learn", tags=["学习管理"])


@router.get("/tasks", response_model=list[LearningTaskResponse])
async def get_learning_tasks(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取待复习任务列表"""
    tasks = await learning_scheduler.get_due_tasks(current_user.id, limit, db)
    return tasks


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    feedback: LearningFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """提交学习反馈"""
    # 验证评分范围
    if feedback.rating not in [1, 2, 3, 4]:
        raise HTTPException(status_code=400, detail="评分必须在1-4之间")
    
    try:
        updated_state = await learning_scheduler.process_feedback(
            feedback.learning_state_id,
            feedback.rating,
            current_user.id,
            db
        )
        
        return {
            "message": "反馈已记录",
            "next_review": updated_state.due.isoformat(),
            "scheduled_days": updated_state.scheduled_days,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
