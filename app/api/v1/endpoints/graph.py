from fastapi import APIRouter, Depends, Query, BackgroundTasks

from app.core.security import get_current_user
from app.models.user import User
from app.services.graph.builder import graph_builder
from app.schemas.request.graph_query import GraphBuildRequest
from app.schemas.response.graph_path import GraphPathResponse, GraphBuildResponse

router = APIRouter(prefix="/graph", tags=["知识图谱"])


@router.post("/build", response_model=GraphBuildResponse)
async def build_graph(
        request: GraphBuildRequest,  # 用 Pydantic 校验
        background_tasks: BackgroundTasks,  # 后台任务
        current_user: User = Depends(get_current_user)
):
    """从文本构建知识图谱（后台异步执行）"""
    source_id = f"user_{current_user.id}"
    background_tasks.add_task(graph_builder.build_from_text, request.text, source_id)

    return GraphBuildResponse(
        entities_count=0,
        relations_count=0,
        message="图谱构建任务已提交，正在后台处理"
    )


@router.get("/query", response_model=GraphPathResponse)
async def query_graph(
        entity_name: str = Query(..., description="实体名称，传 'all' 返回全图"),
        depth: int = Query(2, description="查询深度", ge=1, le=5),
        current_user: User = Depends(get_current_user)
):
    """查询实体的子图，entity_name=all 时返回完整图谱"""
    if entity_name.strip().lower() == "all":
        result = await graph_builder.query_all_graph()
    else:
        result = await graph_builder.query_subgraph(entity_name, depth)

    # 安全兜底
    if not isinstance(result, dict):
        result = {}

    return GraphPathResponse(
        nodes=result.get("nodes", []),
        relationships=result.get("relationships", [])
    )