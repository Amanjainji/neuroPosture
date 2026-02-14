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
_db = None


async def connect_db():
    """Initialize MongoDB connection."""
    global _client, _db
    if _client is None:
        uri = os.environ.get("MONGODB_URI") or os.getenv("MONGODB_URI") or _settings.mongodb_uri
        _client = AsyncIOMotorClient(uri, connectTimeoutMS=5000, serverSelectionTimeoutMS=5000)
        _db = _client.get_database("neuroposture")
    return _db


def get_db():
    """Get MongoDB database. Must call connect_db() first."""
    global _db
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _db


async def close_db():
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
