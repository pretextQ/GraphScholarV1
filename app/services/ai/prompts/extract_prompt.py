from langchain_core.prompts import ChatPromptTemplate

# 知识图谱实体关系抽取 Prompt
EXTRACT_PROMPT_TEMPLATE = """你是一个专业的知识图谱构建助手。你的任务是从给定的文本中提取关键实体（Entities）和它们之间的关系（Relations）。

请遵循以下规则：
1. 实体类型限制为：concept（概念）, term（术语）, person（人物）, organization（组织）, technology（技术）。
2. 关系类型限制为：related_to（相关）, part_of（属于）, depends_on（依赖）, similar_to（相似）, opposite_of（相反）。
3. 输出必须是严格的 JSON 格式，包含 "entities" 和 "relations" 两个数组。
4. 如果文本中没有明显的实体或关系，返回空数组。

输出示例：
{{
  "entities": [
    {{"name": "FastAPI", "type": "technology"}},
    {{"name": "Python", "type": "technology"}}
  ],
  "relations": [
    {{"source": "FastAPI", "target": "Python", "type": "depends_on"}}
  ]
}}

待处理文本：
{text}
"""

extract_prompt = ChatPromptTemplate.from_messages([
    ("system", EXTRACT_PROMPT_TEMPLATE),
    ("user", "请抽取上述文本中的实体和关系。")
])
