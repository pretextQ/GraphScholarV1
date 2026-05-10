from fastapi import APIRouter
from app.api.v1.endpoints import auth, document, graph, learn, chat, dashboard

api_router = APIRouter()

# 注册各模块路由
api_router.include_router(auth.router)
api_router.include_router(document.router)
api_router.include_router(graph.router)
api_router.include_router(learn.router)
api_router.include_router(chat.router)
api_router.include_router(dashboard.router)
