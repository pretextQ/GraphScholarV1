import json

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # PostgreSQL配置
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "123456"
    POSTGRES_DB: str = "test"

    # Neo4j配置
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "12345678"

    # 调试模式
    DEBUG: bool = False

    # CORS 允许的来源（支持 JSON 数组字符串或逗号分隔）
    CORS_ORIGINS: str | list = '["http://localhost:3000","http://localhost:5173"]'

    # JWT配置
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Ollama配置
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_LLM_MODEL: str = "llama3.2:3b"
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"

    # OpenAI配置（可选）
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "qwen3-max"
    OPENAI_BASE_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"

    # Embedding 提供商：ollama 或 openai
    EMBEDDING_PROVIDER: str = "openai"
    EMBEDDING_BASE_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    EMBEDDING_MODEL: str = "text-embedding-v4"
    
    # 向量数据库配置
    CHROMA_PERSIST_DIR: str = "./data/vector_db"
    
    # 文件上传配置
    UPLOAD_DIR: str = "./data/uploads"
    MAX_FILE_SIZE_MB: int = 50
    
    @property
    def cors_origins_list(self) -> list[str]:
        """解析 CORS_ORIGINS 为列表，支持 JSON 数组或逗号分隔"""
        val = self.CORS_ORIGINS
        if isinstance(val, list):
            return val
        try:
            parsed = json.loads(val)
            if isinstance(parsed, list):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass
        return [s.strip() for s in val.split(",") if s.strip()]

    @property
    def postgres_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    @property
    def sync_postgres_url(self) -> str:
        """Alembic 迁移用同步连接"""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()
