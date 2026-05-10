import asyncio
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.knowledge_node import KnowledgeNode
from app.services.vector.store import vector_store
from app.services.graph.builder import graph_builder
from app.services.learning.scheduler import learning_scheduler
from app.utils.file_handler import parse_file, split_text_by_type
from app.utils.logger import logger

router = APIRouter(prefix="/document", tags=["文档管理"])


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """上传并处理文档"""
    # 1. 验证文件类型
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in {".pdf", ".md", ".txt"}:
        raise HTTPException(status_code=400, detail="不支持的文件类型")

    # 2. 保存文件到本地
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    unique_filename = f"{current_user.id}_{uuid.uuid4().hex}{file_ext}"
    file_path = upload_dir / unique_filename

    try:
        content = await file.read()
        # 校验文件大小
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(status_code=413, detail=f"文件过大，最大允许 {settings.MAX_FILE_SIZE_MB}MB")
        file_path.write_bytes(content)
        logger.info(f"文件已保存: {file_path}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"文件保存失败: {e}")
        raise HTTPException(status_code=500, detail="文件上传失败")

    # 3. 解析文件内容
    try:
        text = await asyncio.to_thread(parse_file, str(file_path))
    except Exception as e:
        logger.error(f"文件解析失败: {e}")
        raise HTTPException(status_code=400, detail=f"文件解析失败: {str(e)}")

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="文件内容为空")

    # 4. 按文档类型智能分块
    doc_type = file_ext[1:]  # 去掉点号
    chunks = await asyncio.to_thread(split_text_by_type, text, doc_type)
    logger.info(f"文档分为 {len(chunks)} 个块")

    # 5. 逐块处理：向量存储 → 知识节点 → 学习状态
    knowledge_nodes = []

    for i, chunk in enumerate(chunks):
        if not chunk.strip():
            continue

        # 5a. 准备元数据
        metadata = {
            "user_id": current_user.id,
            "title": f"{file.filename} - Part {i + 1}",
            "source_file": str(file_path),
            "chunk_index": i,
        }

        # 5b. 存入向量库（失败不中断）
        try:
            ids = await vector_store.add_documents([chunk], [metadata])
            chroma_id = ids[0] if ids else None
        except Exception as e:
            logger.error(f"向量存储失败（块{i + 1}）: {e}")
            chroma_id = None

        # 5c. 创建知识节点
        knowledge_node = KnowledgeNode(
            user_id=current_user.id,
            title=metadata["title"],
            content=chunk,
            source_file=str(file_path),
            chroma_id=chroma_id,
        )
        db.add(knowledge_node)
        await db.flush()  # 获取自增 ID
        knowledge_nodes.append(knowledge_node)

        # 5d. 创建初始学习状态（失败不中断）
        try:
            await learning_scheduler.create_initial_state(
                current_user.id,
                knowledge_node.id,
                db
            )
        except Exception as e:
            logger.error(f"创建学习状态失败（块{i + 1}）: {e}")

    # 6. 构建知识图谱（失败不中断）
    try:
        await graph_builder.build_from_text(text, str(file_path))
    except Exception as e:
        logger.error(f"图谱构建失败: {e}")

    # 7. 返回结果
    return {
        "message": "文档处理成功",
        "filename": file.filename,
        "chunks_count": len(knowledge_nodes),
        "knowledge_node_ids": [node.id for node in knowledge_nodes],
    }