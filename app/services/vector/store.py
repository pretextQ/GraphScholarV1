from typing import List, Dict, Any
import asyncio
import chromadb, uuid
from app.core.config import settings
from app.services.vector.embedder import embedder
from app.utils.logger import logger


class VectorStore:
    """ChromaDB向量存储封装"""
    
    def __init__(self):
        # 使用持久化客户端
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR
        )
        
        # 获取或创建集合
        self.collection = self.client.get_or_create_collection(
            name="knowledge_base",
            metadata={"description": "GraphScholar knowledge base"}
        )
        logger.info(f"向量数据库初始化完成，持久化路径: {settings.CHROMA_PERSIST_DIR}")
    
    async def add_documents(self, texts: List[str], metadatas: List[Dict[str, Any]]) -> List[str]:
        """添加文档到向量库"""
        try:
            # 生成embeddings
            embeddings = await embedder.embed_documents(texts)
            
            # 生成IDs
            ids = [str(uuid.uuid4()) for _ in range(len(texts))]
            
            # 添加到ChromaDB（同步调用放到线程池，避免阻塞事件循环）
            await asyncio.to_thread(
                self.collection.add,
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids,
            )
            
            logger.info(f"成功添加 {len(texts)} 个文档到向量库")
            return ids
        except Exception as e:
            logger.error(f"添加文档到向量库失败: {e}")
            raise



    async def similarity_search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """相似度搜索"""
        # 参数校验
        if k < 1:
            k = 1
        elif k > 100:
            logger.warning(f"k值过大({k})，限制为100")
            k = 100

        try:
            # 步骤1：生成查询 embedding
            query_embedding = await embedder.embed_query(query)

            # 步骤2：搜索相似文档（同步调用放到线程池）
            results = await asyncio.to_thread(
                self.collection.query,
                query_embeddings=[query_embedding],
                n_results=k,
                include=["documents", "metadatas", "distances"],
            )

            # 步骤3：格式化结果（zip 拉链式合并）
            formatted_results = []
            docs = results.get('documents', [[]])[0]
            metas = results.get('metadatas', [[]])[0]
            dists = results.get('distances', [[]])[0]

            for doc, meta, dist in zip(docs, metas, dists):
                # 余弦距离转相似度（范围 0~1，越大越相似）
                similarity = max(0.0, min(1.0, 1.0 - dist))
                formatted_results.append({
                    "text": doc,
                    "metadata": meta if meta else {},
                    "distance": dist,  # 原始距离
                    "similarity": round(similarity, 4),  # 可读相似度
                })

            return formatted_results
        except Exception as e:
            logger.error(f"相似度搜索失败: {e}")
            raise


# 全局实例
vector_store = VectorStore()
