from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime,func
from sqlalchemy.orm import relationship
from app.db.base import Base


class KnowledgeNode(Base):
    __tablename__ = "knowledge_nodes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    source_file = Column(String(500))  # 来源文件路径
    chroma_id = Column(String(100), index=True)  # ChromaDB中的文档ID
    created_at = Column(DateTime(timezone= True), server_default=func.now())
    updated_at = Column(DateTime(timezone= True), server_default=func.now(), onupdate=func.now())

    # 关系
    learning_state = relationship("LearningState", back_populates="knowledge_node", uselist=False)

    def __repr__(self):
        return f"<KnowledgeNode {self.title}>"
