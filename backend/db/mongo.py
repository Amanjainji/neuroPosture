"""MongoDB connection and utilities."""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    
    class Config:
        env_file = ".env"
        extra = "ignore"


_settings = Settings()
_client: AsyncIOMotorClient | None = None


def get_db():
    """Get MongoDB database. Uses MONGODB_URI from env."""
    global _client
    uri = os.environ.get("MONGODB_URI") or os.getenv("MONGODB_URI") or _settings.mongodb_uri
    if _client is None:
        _client = AsyncIOMotorClient(uri)
    return _client.get_database("neuroposture")


async def close_db():
    global _client
    if _client:
        _client.close()
        _client = None
