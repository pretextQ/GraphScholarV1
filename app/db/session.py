from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings

# 创建异步引擎
engine = create_async_engine(
    settings.postgres_url,
    echo=False,
    pool_pre_ping=True,  # 每次从池中取出连接前先检测其可用性，避免使用“死连接”
    pool_size = 10,
    max_overflow = 10
)

# 创建会话工厂
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,  # 指定工厂生产的会话类型为异步会话
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db():
    """获取数据库会话的依赖函数"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
