from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
import json
import re
from app.core.config import settings
from app.utils.logger import logger
from app.services.ai.prompts.extract_prompt import extract_prompt


class ExtractAgent:
    """知识抽取Agent"""
    
    def __init__(self):
        # 根据配置选择LLM
        if settings.OPENAI_API_KEY:
            self.llm = ChatOpenAI(
                openai_api_key=settings.OPENAI_API_KEY,
                openai_api_base=settings.OPENAI_BASE_URL,
                model=settings.OPENAI_MODEL,
                temperature=0.1
            )
        else:
            self.llm = ChatOllama(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_LLM_MODEL,
                temperature=0.1
            )
        
        # 使用独立管理的 Prompt 模板
        self.prompt = extract_prompt
        self.chain = self.prompt | self.llm
    
    async def extract(self, text: str) -> dict:
        """从文本中抽取实体和关系"""
        try:
            result = await self.chain.ainvoke({"text": text})
            content = result.content
            
            # 清理可能的markdown代码块标记
            content = re.sub(r'```json\s*', '', content)
            content = re.sub(r'```\s*', '', content)
            content = content.strip()
            
            # 解析JSON
            extracted_data = json.loads(content)
            
            logger.info(f"抽取完成: {len(extracted_data.get('entities', []))}个实体, {len(extracted_data.get('relations', []))}个关系")
            return extracted_data
        except Exception as e:
            logger.error(f"知识抽取失败: {e}")
            return {"entities": [], "relations": []}


# 全局实例
extract_agent = ExtractAgent()
