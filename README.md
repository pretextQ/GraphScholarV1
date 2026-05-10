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
git clone https://gitee.com/qiulongfei4408/graph-scholar-v1.git
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

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                         │
│  Dashboard │ Documents │ KnowledgeGraph │ Learning │ Chat   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (REST API)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Auth    │  │ Document │  │  Graph   │  │  Learning  │  │
│  │  (JWT)   │  │  Upload  │  │  Query   │  │  (FSRS)    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │             │             │              │          │
│  ┌────┴─────────────┴─────────────┴──────────────┴──────┐   │
│  │              LangChain (AI Orchestration)            │   │
│  │         Agent │ Chains │ Prompts │ RAG Pipeline      │   │
│  └──────┬──────────────┬──────────────┬────────────────┘   │
│         │              │              │                     │
└─────────┼──────────────┼──────────────┼─────────────────────┘
          │              │              │
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌──────────────┐
   │ PostgreSQL │ │   Neo4j    │ │   ChromaDB   │
   │ 用户/状态  │ │  知识图谱  │ │  向量索引    │
   └────────────┘ └────────────┘ └──────────────┘
          │
          ▼
   ┌────────────────────────────────────┐
   │         LLM Provider              │
   │  Ollama (本地) / DashScope / OpenAI│
   └────────────────────────────────────┘
```

**核心数据流：**

1. **文档处理流** — 上传文档 → 文本提取 → LLM 实体抽取 → 写入 Neo4j + 向量化存入 ChromaDB
2. **问答流** — 用户提问 → 向量检索相关片段 → 查询知识图谱获取关联实体 → LLM 生成回答
3. **复习流** — FSRS 调度器根据记忆曲线推送复习任务 → 用户作答 → 更新记忆状态

## 环境变量说明

复制 `.env.example` 为 `.env`，按需修改：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| **PostgreSQL** | | |
| `POSTGRES_HOST` | 数据库地址 | `localhost` |
| `POSTGRES_PORT` | 数据库端口 | `5432` |
| `POSTGRES_USER` | 数据库用户名 | `postgres` |
| `POSTGRES_PASSWORD` | 数据库密码 | `postgres` |
| `POSTGRES_DB` | 数据库名 | `graphscholar` |
| **Neo4j** | | |
| `NEO4J_URI` | Neo4j 连接地址 | `bolt://localhost:7687` |
| `NEO4J_USER` | Neo4j 用户名 | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j 密码 | `password` |
| **JWT 认证** | | |
| `SECRET_KEY` | JWT 签名密钥（生产环境必须修改） | `your-secret-key-change-in-production` |
| `ALGORITHM` | JWT 算法 | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token 过期时间（分钟） | `30` |
| **LLM（二选一）** | | |
| `OLLAMA_BASE_URL` | Ollama 服务地址 | `http://localhost:11434` |
| `OLLAMA_LLM_MODEL` | Ollama 对话模型 | `llama3.2:3b` |
| `OLLAMA_EMBEDDING_MODEL` | Ollama 嵌入模型 | `nomic-embed-text` |
| `OPENAI_API_KEY` | OpenAI / DashScope API Key（留空则用 Ollama） | 空 |
| `OPENAI_MODEL` | 对话模型名 | `gpt-3.5-turbo` |
| `OPENAI_BASE_URL` | API 地址（兼容 OpenAI 格式的服务商） | - |
| **Embedding** | | |
| `EMBEDDING_PROVIDER` | 嵌入提供商：`ollama` 或 `openai` | `openai` |
| `EMBEDDING_BASE_URL` | 嵌入 API 地址 | - |
| `EMBEDDING_MODEL` | 嵌入模型名 | `text-embedding-v4` |
| **存储** | | |
| `CHROMA_PERSIST_DIR` | 向量数据库存储路径 | `./data/vector_db` |
| `UPLOAD_DIR` | 文件上传目录 | `./data/uploads` |
| `MAX_FILE_SIZE_MB` | 最大上传文件大小 (MB) | `50` |

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
