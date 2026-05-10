from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.request.chat_message import ChatMessageRequest
from app.schemas.response.chat_response import ChatResponse
from app.services.ai.chains.graph_rag_chain import graph_rag_chain
from app.utils.logger import logger

router = APIRouter(prefix="/chat", tags=["智能问答"])


@router.post("/", response_model=ChatResponse)
async def chat(
    message: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
):
    """Graph-RAG 智能问答：结合向量检索 + 知识图谱上下文回答用户问题"""
    if not message.question.strip():
        raise HTTPException(status_code=400, detail="问题不能为空")

    try:
        result = await graph_rag_chain.query(message.question.strip())
        return ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            graph_context=result.get("graph_context"),
            retrieval_scores=result.get("retrieval_scores", []),
        )
    except Exception as e:
        logger.error(f"聊天请求处理失败 (user={current_user.id}): {e}")
        raise HTTPException(status_code=500, detail="问答处理失败，请稍后重试")
