import sys
from pathlib import Path
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# 添加项目根目录到 sys.path，兼容本地开发和 Docker 部署
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# 导入你的配置和模型
from app.core.config import settings
from app.db.base import Base
# 导入所有模型！！！
from app.models import *

config = context.config
fileConfig(config.config_file_name)

# 核心：指定元数据
target_metadata = Base.metadata

def run_migrations_offline():
    url = settings.sync_postgres_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        url=settings.sync_postgres_url
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()