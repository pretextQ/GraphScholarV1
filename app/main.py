from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.utils.logger import logger
from app.api.v1.api import api_router
from app.services.graph.client import neo4j_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动事件
    logger.info("GraphScholar 启动中...")
    
    # 初始化Neo4j连接
    try:
        await neo4j_client.initialize()
        logger.info("Neo4j连接已建立")
    except Exception as e:
        logger.warning(f"Neo4j连接失败（图谱功能将不可用）: {e}")
    
    yield
    
    # 关闭事件
    logger.info("GraphScholar 关闭中...")
    await neo4j_client.close()
    logger.info("服务已关闭")


# 创建FastAPI应用
app = FastAPI(
    title="GraphScholar",
    description="基于知识图谱 + 向量检索 + FSRS 的智能学习系统",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.DEBUG
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册 API v1 路由（含认证、文档、图谱、学习、问答）
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "ok", "service": "GraphScholar"}


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "Welcome to GraphScholar API",
        "docs": "/docs",
        "version": "1.0.0"
    }
