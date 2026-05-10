import asyncio
import re
from typing import List, Dict, Any
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from app.core.config import settings
from app.services.vector.store import vector_store
from app.services.graph.builder import graph_builder
from app.utils.logger import logger
from app.services.ai.prompts.tutor_prompt import tutor_prompt

# 停用词（中英文常见无意义词）
_STOP_WORDS = {
    '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
    '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
    '什么', '那', '这', '吗', '怎么', '哪些', '哪个', '如何', '为什么', '请',
    'what', 'is', 'are', 'the', 'a', 'an', 'of', 'to', 'in', 'for', 'on', 'and',
    'how', 'why', 'what', 'which', 'can', 'do', 'does', 'please', 'tell',
}

# 最小关键词长度
_MIN_KEYWORD_LEN = 2


def _extract_keywords(text: str) -> List[str]:
    """从问题中提取关键词（中文按字符组切分，英文按单词切分，去停用词）"""
    # 提取中文词（连续中文字符，长度 >= 2）
    cn_words = re.findall(r'[一-鿿]{2,}', text)
    # 提取英文词（连续字母，长度 >= 2）
    en_words = re.findall(r'[a-zA-Z]{2,}', text)

    keywords = []
    seen = set()
    for word in cn_words + en_words:
        w_lower = word.lower()
        if w_lower not in _STOP_WORDS and len(word) >= _MIN_KEYWORD_LEN and w_lower not in seen:
            seen.add(w_lower)
            keywords.append(word)

    return keywords


_SIMILARITY_THRESHOLD = 0.3  # 低于此相似度的检索结果丢弃


class GraphRAGChain:
    """Graph-RAG问答链"""

    def __init__(self):
        # 初始化LLM
        if settings.OPENAI_API_KEY:
            self.llm = ChatOpenAI(
                openai_api_key=settings.OPENAI_API_KEY,
                openai_api_base=settings.OPENAI_BASE_URL,
                model=settings.OPENAI_MODEL,
                temperature=0.3
            )
        else:
            self.llm = ChatOllama(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_LLM_MODEL,
                temperature=0.3
            )

        # 使用独立管理的 Prompt 模板
        self.prompt = tutor_prompt
        self.chain = self.prompt | self.llm

    async def query(self, question: str) -> Dict[str, Any]:
        """执行Graph-RAG查询"""
        try:
            # 1. 向量检索（带质量过滤）
            raw_results = await vector_store.similarity_search(question, k=5)
            vector_results = [r for r in raw_results if r['similarity'] >= _SIMILARITY_THRESHOLD]

            if not vector_results and raw_results:
                # 全部低于阈值时保留最高分的 1 条，避免完全没上下文
                vector_results = [raw_results[0]]
                logger.info(f"所有检索结果相似度低于{_SIMILARITY_THRESHOLD}，保留最高分1条")

            vector_context = "\n\n".join([r['text'] for r in vector_results])
            sources = [r['metadata'].get('title', '未知来源') for r in vector_results]
            retrieval_scores = [
                {"title": r['metadata'].get('title', '未知来源'), "score": r['similarity']}
                for r in vector_results
            ]

            # 2. 图谱检索（并发查询所有关键词）
            keywords = _extract_keywords(question)
            logger.info(f"提取到关键词: {keywords}")
            graph_context_parts = []

            if keywords:
                async def _query_one(kw: str):
                    try:
                        return kw, await graph_builder.query_subgraph(kw, depth=2)
                    except Exception as e:
                        logger.warning(f"图谱查询关键词 '{kw}' 失败: {e}")
                        return kw, None

                results = await asyncio.gather(*[_query_one(kw) for kw in keywords])
                for keyword, subgraph in results:
                    if not subgraph:
                        continue
                    nodes = subgraph.get('nodes', [])
                    rels = subgraph.get('relationships', [])
                    if nodes:
                        node_names = [n['name'] for n in nodes]
                        rel_lines = [f"  {r['source']} --{r.get('type', 'related_to')}--> {r['target']}" for r in rels]
                        part = f"【{keyword}】关联节点: {', '.join(node_names)}"
                        if rel_lines:
                            part += "\n关系:\n" + "\n".join(rel_lines[:10])
                        graph_context_parts.append(part)

            graph_context = "\n\n".join(graph_context_parts) if graph_context_parts else "未找到相关知识图谱信息"

            # 3. 调用LLM生成答案
            result = await self.chain.ainvoke({
                "question": question,
                "vector_context": vector_context,
                "graph_context": graph_context
            })

            answer = result.content

            logger.info(f"Graph-RAG查询完成，向量召回{len(vector_results)}条，图谱关键词{len(keywords)}个")
            return {
                "answer": answer,
                "sources": sources,
                "graph_context": graph_context,
                "retrieval_scores": retrieval_scores,
            }
        except Exception as e:
            logger.error(f"Graph-RAG查询失败: {e}")
            raise


# 全局实例
graph_rag_chain = GraphRAGChain()
