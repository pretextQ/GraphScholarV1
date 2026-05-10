# GraphScholar

基于 **知识图谱 + 向量检索 + FSRS 间隔复习** 的智能学习系统。

上传文档 → 自动构建知识图谱 → AI 智能问答 → 间隔复习巩固记忆。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | FastAPI + SQLAlchemy + Alembic |
| 前端 | React + Vite + Tailwind CSS |
| 图数据库 | Neo4j |
| 关系数据库 | PostgreSQL |
| 向量数据库 | ChromaDB |
| AI | LangChain + Ollama / OpenAI-compatible API |
| 记忆算法 | FSRS (Free Spaced Repetition Scheduler) |
| 部署 | Docker Compose |

## 功能

- **文档管理** — 上传 PDF / Markdown，自动解析和向量化
- **知识图谱** — 从文档中提取实体关系，构建可视化知识网络
- **智能问答** — 基于 GraphRAG 的上下文感知问答
- **间隔复习** — FSRS 算法驱动的自适应复习计划
- **学习仪表盘** — 学习进度、知识掌握度可视化

## 快速开始

### 环境要求

- Python >= 3.14
- Node.js >= 18
- [uv](https://docs.astral.sh/uv/) (Python 包管理器)
- Ollama (本地 LLM) 或 OpenAI-compatible API Key

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/pretextQ/GraphScholarV1.git
cd GraphScholarV1

# 2. 后端
uv sync
cp .env.example .env   # 编辑 .env 填入你的配置
uv run uvicorn app.main:app --reload --port 8080

# 3. 前端
cd frontend
npm install
npm run dev
```

### Docker 部署

```bash
cp .env.example .env   # 编辑 .env 填入你的配置
docker compose up -d
```

访问 `http://localhost` 即可。

## 项目结构

```
GraphScholarV1/
├── app/
│   ├── api/v1/endpoints/   # API 路由
│   ├── core/               # 配置、安全、常量
│   ├── db/                 # 数据库连接
│   ├── models/             # SQLAlchemy 模型
│   ├── schemas/            # Pydantic 请求/响应模型
│   ├── services/
│   │   ├── ai/             # LangChain Agent & Chains
│   │   ├── graph/          # Neo4j 知识图谱操作
│   │   ├── learning/       # FSRS 复习引擎
│   │   └── vector/         # ChromaDB 向量检索
│   └── utils/              # 工具函数
├── frontend/
│   └── src/
│       ├── pages/          # 页面组件
│       ├── components/     # 通用组件
│       ├── context/        # React Context
│       └── api/            # API 客户端
├── alembic/                # 数据库迁移
├── docker-compose.yml
└── pyproject.toml
```

## API 文档

启动后端后访问：
- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

## License

MIT
