from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct, case, cast, Date

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.knowledge_node import KnowledgeNode
from app.models.learning_state import LearningState
from app.services.graph.builder import graph_builder

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取仪表盘统计数据"""
    uid = current_user.id
    now = datetime.now(timezone.utc)

    # 知识节点总数
    nodes_result = await db.execute(
        select(func.count(KnowledgeNode.id)).where(KnowledgeNode.user_id == uid)
    )
    nodes_count = nodes_result.scalar() or 0

    # 文档数量（去重 source_file）
    docs_result = await db.execute(
        select(func.count(distinct(KnowledgeNode.source_file))).where(
            KnowledgeNode.user_id == uid,
            KnowledgeNode.source_file.isnot(None),
        )
    )
    docs_count = docs_result.scalar() or 0

    # 到期复习统计（一条 SQL 同时算总到期数和未复习数）
    due_stats = await db.execute(
        select(
            func.count(LearningState.id).label("total_due"),
            func.count(case(
                (LearningState.last_review.is_(None), 1),
                else_=None,
            )).label("unreviewed"),
        ).where(
            LearningState.user_id == uid,
            LearningState.due <= now,
        )
    )
    row = due_stats.one()
    total_due = row.total_due or 0
    unreviewed = row.unreviewed or 0
    reviewed_count = total_due - unreviewed

    # 本周趋势：一条 GROUP BY 查询搞定过去 7 天
    week_start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    trend_result = await db.execute(
        select(
            cast(LearningState.last_review, Date).label("day"),
            func.count(LearningState.id).label("cnt"),
        ).where(
            LearningState.user_id == uid,
            LearningState.last_review >= week_start,
        ).group_by(cast(LearningState.last_review, Date))
    )
    trend_map = {str(row.day): row.cnt for row in trend_result.all()}
    week_trend = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).date()
        week_trend.append(trend_map.get(str(day), 0))

    # 图谱节点数（尽力获取，失败返回 0）
    graph_nodes_count = 0
    try:
        graph_data = await graph_builder.query_all_graph(limit=1000)
        graph_nodes_count = len(graph_data.get("nodes", []))
    except Exception:
        pass

    # 完成率
    completion_rate = round(reviewed_count / total_due * 100) if total_due > 0 else 0

    return {
        "nodes": nodes_count,
        "docs": docs_count,
        "graphNodes": graph_nodes_count,
        "due": total_due,
        "todayReview": total_due,
        "reviewed": reviewed_count,
        "weekTrend": week_trend,
        "completionRate": completion_rate,
    }
