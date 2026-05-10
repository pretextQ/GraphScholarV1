from typing import List, Dict, Any
from app.services.graph.client import neo4j_client
from app.services.ai.agents.extract_agent import extract_agent
from app.utils.logger import logger

# 每次送给 LLM 抽取的最大字符数，避免超出上下文窗口
EXTRACT_CHUNK_SIZE = 3000


class GraphBuilder:
    """知识图谱构建器"""

    async def build_from_text(self, text: str, source_id: str) -> Dict[str, int]:
        """从文本构建知识图谱：调用 LLM 抽取实体和关系后写入 Neo4j"""
        try:
            logger.info(f"开始为source_id={source_id}构建图谱，文本长度={len(text)}")

            # 长文本分片抽取，再合并去重
            all_entities: Dict[str, Dict[str, Any]] = {}
            # 用于大小写不敏感匹配的映射: lowercase -> 正式名称
            entity_name_map: Dict[str, str] = {}
            all_relations: List[Dict[str, Any]] = []

            chunks = self._split_text(text, EXTRACT_CHUNK_SIZE)
            logger.info(f"文本分为 {len(chunks)} 段进行抽取")

            for i, chunk in enumerate(chunks):
                if not chunk.strip():
                    continue
                try:
                    result = await extract_agent.extract(chunk)
                    chunk_entities = result.get("entities", [])
                    chunk_relations = result.get("relations", [])
                    logger.info(f"第{i + 1}段: {len(chunk_entities)}个实体, {len(chunk_relations)}个关系")
                    for ent in chunk_entities:
                        name = ent.get("name", "").strip()
                        if name:
                            all_entities[name] = ent
                            entity_name_map[name.lower()] = name
                    all_relations.extend(chunk_relations)
                except Exception as e:
                    logger.warning(f"第{i + 1}段抽取失败，跳过: {e}")

            logger.info(f"抽取完成: {len(all_entities)}个实体, {len(all_relations)}个关系")
            logger.info(f"实体列表: {list(all_entities.keys())}")
            logger.info(f"原始关系数: {len(all_relations)}")

            # 创建实体节点
            entities_count = 0
            for entity in all_entities.values():
                try:
                    await self._create_entity(entity, source_id)
                    entities_count += 1
                except Exception as e:
                    logger.warning(f"实体创建失败 '{entity.get('name')}': {e}")

            # 创建关系（大小写不敏感匹配实体名）
            relations_count = 0
            skipped_relations = []
            for relation in all_relations:
                source_name = relation.get("source", "").strip()
                target_name = relation.get("target", "").strip()
                # 大小写不敏感查找正式实体名
                resolved_source = entity_name_map.get(source_name.lower())
                resolved_target = entity_name_map.get(target_name.lower())
                if not resolved_source or not resolved_target:
                    skipped_relations.append(f"{source_name}->{target_name}")
                    continue
                # 用正式名称替换，确保 Neo4j 里能 MATCH 到
                relation["source"] = resolved_source
                relation["target"] = resolved_target
                try:
                    await self._create_relation(relation)
                    relations_count += 1
                except Exception as e:
                    logger.warning(f"关系创建失败 '{resolved_source}'-'{resolved_target}': {e}")

            if skipped_relations:
                logger.warning(f"跳过{len(skipped_relations)}条关系(实体未找到): {skipped_relations[:10]}")

            logger.info(f"图谱构建完成: {entities_count}个实体, {relations_count}个关系")
            return {
                "entities_count": entities_count,
                "relations_count": relations_count
            }
        except Exception as e:
            logger.error(f"图谱构建失败: {e}")
            raise

    @staticmethod
    def _split_text(text: str, chunk_size: int) -> List[str]:
        """按句子边界拆分文本，避免截断实体名称"""
        if len(text) <= chunk_size:
            return [text]
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            # 尽量在句号、换行处断开
            if end < len(text):
                for sep in ("。", "\n", "；", ".", " "):
                    last = text.rfind(sep, start, end)
                    if last > start + chunk_size // 2:
                        end = last + 1
                        break
            chunks.append(text[start:end])
            start = end
        return chunks
    
    async def _create_entity(self, entity: Dict[str, Any], source_id: str):
        """创建实体节点"""
        query = """
        MERGE (e:Entity {name: $name})
        ON CREATE SET 
            e.type = $type,
            e.source_id = $source_id,
            e.created_at = timestamp()
        ON MATCH SET
            e.source_id = $source_id
        RETURN e
        """
        await neo4j_client.execute_query(query, {
            "name": entity.get("name"),
            "type": entity.get("type", "concept"),
            "source_id": source_id
        })
    
    async def _create_relation(self, relation: Dict[str, Any]):
        """创建关系"""
        query = """
        MATCH (source:Entity {name: $source})
        MATCH (target:Entity {name: $target})
        MERGE (source)-[r:RELATION {type: $rel_type}]->(target)
        ON CREATE SET r.created_at = timestamp()
        RETURN r
        """
        await neo4j_client.execute_query(query, {
            "source": relation.get("source"),
            "target": relation.get("target"),
            "rel_type": relation.get("type", "related_to")
        })
    
    async def query_subgraph(self, entity_name: str, depth: int = 2) -> Dict[str, List]:
        """查询实体的子图，支持多跳（depth 控制跳数）"""
        # 第一步：用可变长度路径找到 depth 跳内的所有节点
        # 注：Cypher 不支持路径长度参数化，depth 由接口层 Query(ge=1, le=5) 校验
        node_query = """
        MATCH (a:Entity)-[r:RELATION*1..""" + str(int(depth)) + """]-(b:Entity)
        WHERE a.name = $entity_name
        RETURN DISTINCT b.name AS name, b.type AS type
        """
        # 第二步：查这些节点之间的直接关系（用于前端画线）
        # 先拿节点名列表，再查关系
        rel_query = """
        MATCH (a:Entity)-[r:RELATION]-(b:Entity)
        WHERE a.name IN $node_names AND b.name IN $node_names
        RETURN DISTINCT a.name AS src, b.name AS dst, r.type AS rel_type
        """

        try:
            # 查多跳节点
            node_result = await neo4j_client.execute_query(node_query, {
                "entity_name": entity_name,
            })

            if not node_result:
                return {"nodes": [], "relationships": []}

            # 收集所有节点名
            node_names = [entity_name]
            nodes = []
            seen_nodes = set()
            seen_nodes.add(entity_name)
            nodes.append({"id": entity_name, "name": entity_name, "type": "concept", "labels": ["Entity"]})

            for record in node_result:
                name = record.get("name", "")
                ntype = record.get("type", "concept")
                if name and name not in seen_nodes:
                    seen_nodes.add(name)
                    node_names.append(name)
                    nodes.append({"id": name, "name": name, "type": ntype, "labels": ["Entity"]})

            # 查节点间关系
            rel_result = await neo4j_client.execute_query(rel_query, {
                "node_names": node_names,
            })

            relationships = []
            seen_rels = set()
            for record in rel_result:
                src = record.get("src", "")
                dst = record.get("dst", "")
                rel_type = record.get("rel_type", "related_to")
                rel_key = (src, dst, rel_type)
                if rel_key not in seen_rels:
                    seen_rels.add(rel_key)
                    relationships.append({
                        "type": rel_type,
                        "source": src,
                        "target": dst,
                    })

            return {"nodes": nodes, "relationships": relationships}
        except Exception as e:
            logger.error(f"查询子图失败: {e}")
            return {"nodes": [], "relationships": []}

    async def query_all_graph(self, limit: int = 200) -> Dict[str, List]:
        """查询完整图谱（无向匹配，与 query_subgraph 行为一致）"""
        query = """
        MATCH (a:Entity)-[r:RELATION]-(b:Entity)
        RETURN DISTINCT a.name AS src, a.type AS src_type,
                        b.name AS dst, b.type AS dst_type,
                        r.type AS rel_type
        LIMIT $limit
        """

        try:
            result = await neo4j_client.execute_query(query, {"limit": limit})

            if not result:
                return {"nodes": [], "relationships": []}

            nodes = []
            relationships = []
            seen_nodes = set()
            seen_rels = set()

            def add_node(name: str, ntype: str = "concept"):
                if name not in seen_nodes:
                    seen_nodes.add(name)
                    nodes.append({"id": name, "name": name, "type": ntype, "labels": ["Entity"]})

            for record in result:
                src = record.get("src", "")
                dst = record.get("dst", "")
                src_type = record.get("src_type", "concept")
                dst_type = record.get("dst_type", "concept")
                rel_type = record.get("rel_type", "related_to")
                add_node(src, src_type)
                add_node(dst, dst_type)
                # 无向匹配会返回 A-B 和 B-A，用 frozenset 去重
                rel_key = (frozenset({src, dst}), rel_type)
                if rel_key not in seen_rels:
                    seen_rels.add(rel_key)
                    relationships.append({
                        "type": rel_type,
                        "source": src,
                        "target": dst,
                    })

            return {"nodes": nodes, "relationships": relationships}
        except Exception as e:
            logger.error(f"查询全图失败: {e}")
            return {"nodes": [], "relationships": []}


# 全局实例
graph_builder = GraphBuilder()
