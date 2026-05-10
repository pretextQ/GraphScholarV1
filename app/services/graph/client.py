from neo4j import AsyncGraphDatabase
from app.core.config import settings
from app.utils.logger import logger


class Neo4jClient:
    """Neo4j驱动封装"""
    
    def __init__(self):
        self.driver = None
    
    async def initialize(self):
        """初始化Neo4j连接"""
        try:
            self.driver = AsyncGraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
            # 测试连接
            async with self.driver.session() as session:
                await session.run("RETURN 1")
            logger.info("Neo4j连接成功")
            
            # 创建约束
            await self.create_constraints()
        except Exception as e:
            logger.error(f"Neo4j连接失败: {e}")
            raise
    
    async def close(self):
        """关闭Neo4j连接"""
        if self.driver:
            await self.driver.close()
            logger.info("Neo4j连接已关闭")
    
    async def create_constraints(self):
        """创建唯一性约束"""
        constraints = [
            "CREATE CONSTRAINT entity_name_unique IF NOT EXISTS FOR (e:Entity) REQUIRE e.name IS UNIQUE",
        ]
        
        async with self.driver.session() as session:
            for constraint in constraints:
                try:
                    await session.run(constraint)
                except Exception as e:
                    logger.warning(f"创建约束失败: {e}")
    
    async def execute_query(self, query: str, parameters: dict = None):
        """执行Cypher查询"""
        try:
            async with self.driver.session() as session:
                result = await session.run(query, parameters or {})
                return await result.data()
        except Exception as e:
            logger.error(f"执行Cypher查询失败: {e}")
            raise


# 全局实例
neo4j_client = Neo4jClient()
