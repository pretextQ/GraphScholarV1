from sqlalchemy import Column, Integer, String, Boolean, DateTime,func
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone= True), server_default=func.now())
    updated_at = Column(DateTime(timezone= True), server_default=func.now(), onupdate =func.now())

    def __repr__(self):
        return f"<User {self.username}>"
