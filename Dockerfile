# ---- 构建阶段 ----
FROM python:3.14-slim AS builder

WORKDIR /app

# 安装 uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# 先复制依赖定义文件，利用 Docker 缓存层
COPY pyproject.toml uv.lock ./

# 安装依赖到虚拟环境
RUN uv sync --frozen --no-dev --no-install-project

# ---- 运行阶段 ----
FROM python:3.14-slim

WORKDIR /app

# 从构建阶段复制虚拟环境
COPY --from=builder /app/.venv /app/.venv

# 让后续命令使用虚拟环境
ENV PATH="/app/.venv/bin:$PATH"

# 复制项目代码
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY app/ ./app/
COPY start.py .

# 创建数据目录
RUN mkdir -p data/uploads data/vector_db logs

EXPOSE 8080

# 启动：先跑数据库迁移，再启动 uvicorn
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8080 --workers 2"]
