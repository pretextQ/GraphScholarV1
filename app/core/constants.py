# FSRS算法参数
FSRS_PARAMETERS = {
    "request_retention": 0.9,  # 期望保留率
    "maximum_interval": 36500,  # 最大间隔天数
    "w": [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],  # FSRS权重
}

# 评分映射
RATING_MAP = {
    "again": 1,
    "hard": 2,
    "good": 3,
    "easy": 4,
}

# 图谱节点类型
ENTITY_TYPES = ["concept", "term", "person", "organization", "technology"]

# 关系类型
RELATION_TYPES = ["related_to", "part_of", "depends_on", "similar_to", "opposite_of"]

# 文档分块配置
CHUNK_SIZE = 1000  # 每块字符数（约 2-3 段完整知识点）
CHUNK_OVERLAP = 150  # 重叠字符数（保证上下文衔接）

# 向量检索配置
VECTOR_SEARCH_K = 5  # 返回最相似的K个文档

# 图谱查询配置
GRAPH_QUERY_DEPTH = 2  # 子图查询深度

# 支持的文件类型
SUPPORTED_FILE_TYPES = {".pdf", ".md", ".txt"}
