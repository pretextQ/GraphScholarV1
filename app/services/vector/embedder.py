import asyncio
from typing import List
from openai import OpenAI
from langchain_ollama import OllamaEmbeddings

from app.core.config import settings
from app.utils.logger import logger


class Embedder:
    """Embedding 服务封装，支持 Ollama 和 OpenAI 兼容接口"""

    def __init__(self):
        self.provider = settings.EMBEDDING_PROVIDER

        if self.provider == "openai" and settings.OPENAI_API_KEY:
            self._client = OpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.EMBEDDING_BASE_URL,
            )
            self._model = settings.EMBEDDING_MODEL
            logger.info(f"使用 OpenAI Embeddings ({self._model})")
        else:
            self._ollama = OllamaEmbeddings(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_EMBEDDING_MODEL,
            )
            logger.info(f"使用 Ollama Embeddings ({settings.OLLAMA_EMBEDDING_MODEL})")

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """为多个文档生成 embeddings"""
        try:
            if self.provider == "openai":
                # 大部分 OpenAI 兼容接口只接受单条字符串，逐条调
                embeddings = []
                for text in texts:
                    resp = await asyncio.to_thread(
                        self._client.embeddings.create,
                        model=self._model,
                        input=text,
                    )
                    embeddings.append(resp.data[0].embedding)
                return embeddings
            else:
                return await asyncio.to_thread(
                    self._ollama.embed_documents, texts
                )
        except Exception as e:
            logger.error(f"文档向量化失败，共 {len(texts)} 个文档: {e}")
            raise

    async def embed_query(self, text: str, max_retries: int = 3) -> List[float]:
        """为查询生成 embedding"""
        for attempt in range(max_retries):
            try:
                if self.provider == "openai":
                    resp = await asyncio.to_thread(
                        self._client.embeddings.create,
                        model=self._model,
                        input=text,
                    )
                    return resp.data[0].embedding
                else:
                    return await asyncio.to_thread(
                        self._ollama.embed_query, text
                    )
            except Exception as e:
                logger.error(f"查询向量化失败 (attempt {attempt + 1}): {e}")
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(1)


# 全局实例
embedder = Embedder()
