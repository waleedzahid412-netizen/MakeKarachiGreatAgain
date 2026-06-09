from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MISTRAL_API_KEY: str
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str = "civicalert-faq"
    PINECONE_ENVIRONMENT: str = "gcp-starter"
    AI_MODEL: str = "mistral-small-latest"
    EMBEDDING_MODEL: str = "mistral-embed"
    RATE_LIMIT: str = "20/minute"
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "allow"
