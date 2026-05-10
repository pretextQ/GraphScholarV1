from datetime import datetime, timedelta,timezone
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.models.learning_state import LearningState
from app.models.knowledge_node import KnowledgeNode
from app.services.learning.fsrs_engine import fsrs_engine
from app.utils.logger import logger


class LearningScheduler:
    """学习调度器"""
    
    async def create_initial_state(self, user_id: int, knowledge_node_id: int, db: AsyncSession) -> LearningState:
        """为知识节点创建初始学习状态"""
        # 检查是否已存在
        result = await db.execute(
            select(LearningState).where(
                LearningState.user_id == user_id,
                LearningState.knowledge_node_id == knowledge_node_id
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            return existing
        
        # 初始化状态
        init_state = fsrs_engine.init_state()
        
        learning_state = LearningState(
            user_id=user_id,
            knowledge_node_id=knowledge_node_id,
            stability=init_state["stability"],
            difficulty=init_state["difficulty"],
            scheduled_days=init_state["scheduled_days"],
            state="new",
            due=datetime.now(timezone.utc),  # 立即可复习
        )
        
        db.add(learning_state)
        await db.flush()
        
        logger.info(f"为用户 {user_id} 的节点 {knowledge_node_id} 创建初始学习状态")
        return learning_state
    
    async def process_feedback(self, learning_state_id: int, rating: int, user_id: int, db: AsyncSession) -> LearningState:
        """
        处理学习反馈
        
        Args:
            learning_state_id: 学习状态ID
            rating: 评分 (1-4)
            user_id: 用户ID（用于验证）
            db: 数据库会话
        
        Returns:
            更新后的学习状态
        """
        # 查询学习状态
        result = await db.execute(
            select(LearningState)
            .where(LearningState.id == learning_state_id, LearningState.user_id == user_id)
            .options(joinedload(LearningState.knowledge_node))
        )
        learning_state = result.scalar_one_or_none()
        
        if not learning_state:
            raise ValueError(f"学习状态 {learning_state_id} 不存在或无权访问")
        
        # 计算已过去天数
        if learning_state.last_review:
            elapsed_days = (datetime.now(timezone.utc) - learning_state.last_review).days
        else:
            elapsed_days = learning_state.elapsed_days
        
        # 使用FSRS计算新状态
        new_state = fsrs_engine.process_review(
            stability=learning_state.stability,
            difficulty=learning_state.difficulty,
            rating=rating,
            elapsed_days=elapsed_days
        )
        
        # 更新学习状态
        learning_state.stability = new_state["stability"]
        learning_state.difficulty = new_state["difficulty"]
        learning_state.scheduled_days = new_state["scheduled_days"]
        learning_state.elapsed_days = 0
        learning_state.reps += 1
        now_utc = datetime.now(timezone.utc)
        learning_state.last_review = now_utc
        learning_state.due = now_utc + timedelta(days=new_state["scheduled_days"])
        
        # 更新状态类型
        if rating == 1:
            learning_state.lapses += 1
            learning_state.state = "relearning"
        elif learning_state.reps >= 3:
            learning_state.state = "review"
        else:
            learning_state.state = "learning"
        
        await db.flush()
        
        logger.info(f"处理学习反馈: state_id={learning_state_id}, rating={rating}")
        return learning_state
    
    async def get_due_tasks(self, user_id: int, limit: int = 20, db: AsyncSession = None) -> List[Dict[str, Any]]:
        """获取到期的学习任务"""
        now = datetime.now(timezone.utc)
        
        result = await db.execute(
            select(LearningState, KnowledgeNode)
            .join(KnowledgeNode, LearningState.knowledge_node_id == KnowledgeNode.id)
            .where(
                LearningState.user_id == user_id,
                LearningState.due <= now
            )
            .order_by(LearningState.due)
            .limit(limit)
        )
        
        tasks = []
        for learning_state, knowledge_node in result.all():
            tasks.append({
                "id": learning_state.id,
                "knowledge_node_id": learning_state.knowledge_node_id,
                "title": knowledge_node.title,
                "content": knowledge_node.content[:200] + "..." if len(knowledge_node.content) > 200 else knowledge_node.content,
                "stability": learning_state.stability,
                "difficulty": learning_state.difficulty,
                "due": learning_state.due,
                "state": learning_state.state,
            })
        
        logger.info(f"获取用户 {user_id} 的 {len(tasks)} 个到期任务")
        return tasks


# 全局实例
learning_scheduler = LearningScheduler()
