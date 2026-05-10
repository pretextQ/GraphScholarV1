from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey,func
from sqlalchemy.orm import relationship
from app.db.base import Base


class LearningState(Base):
    __tablename__ = "learning_states"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    knowledge_node_id = Column(Integer, ForeignKey("knowledge_nodes.id"), nullable=False, index=True)
    
    # FSRS参数
    stability = Column(Float, default=0.0)  # 稳定性
    difficulty = Column(Float, default=0.0)  # 难度
    scheduled_days = Column(Integer, default=0)  # 计划间隔天数
    elapsed_days = Column(Integer, default=0)  # 已过去天数
    
    # 统计信息
    reps = Column(Integer, default=0)  # 复习次数
    lapses = Column(Integer, default=0)  # 遗忘次数
    state = Column(String(20), default="new")  # 状态: new, learning, review, relearning
    
    # 时间戳
    last_review = Column(DateTime(timezone=True), nullable=True)  # 上次复习时间
    due = Column(DateTime(timezone=True), nullable=True)  # 下次到期时间
    created_at = Column(DateTime(timezone= True), server_default=func.now())
    updated_at = Column(DateTime(timezone= True), server_default=func.now(), onupdate=func.now())

    # 关系
    knowledge_node = relationship("KnowledgeNode", back_populates="learning_state")

    def __repr__(self):
        return f"<LearningState user_id={self.user_id} node_id={self.knowledge_node_id}>"
