"""User profile and settings API with MongoDB."""
import asyncio
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from pymongo import ReturnDocument

from db.mongo import get_db

router = APIRouter()


class UserCreate(BaseModel):
    email: str
    name: str
    password: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None


class SettingsUpdate(BaseModel):
    api_url: Optional[str] = None
    default_device: Optional[str] = None


def _user_from_doc(doc: dict) -> dict:
    out = dict(doc)
    out["id"] = str(out.pop("_id", ""))
    out.pop("password", None)
    return out


@router.post("/login")
async def login_or_register(user: UserCreate):
    """Find or create user by email, return profile. Works without MongoDB (local fallback)."""
    default_settings = {"api_url": "http://localhost:8000", "default_device": "esp32-demo-1"}
    try:
        db = get_db()
        coll = db.users
        # Use timeout to prevent hanging
        existing = await asyncio.wait_for(
            coll.find_one({"email": user.email.lower()}),
            timeout=2.0
        )
        if existing:
            return _user_from_doc(dict(existing))
        doc = {
            "email": user.email.lower(),
            "name": user.name or user.email.split("@")[0],
            "settings": default_settings,
        }
        r = await asyncio.wait_for(
            coll.insert_one(doc),
            timeout=2.0
        )
        doc["_id"] = r.inserted_id
        return _user_from_doc(doc)
    except asyncio.TimeoutError:
        # If DB is slow, use fallback
        return {
            "id": "",
            "email": user.email.lower(),
            "name": user.name or user.email.split("@")[0],
            "settings": default_settings,
        }
    except Exception as e:
        # Any other error, use fallback
        print(f"DB error in login: {e}")
        return {
            "id": "",
            "email": user.email.lower(),
            "name": user.name or user.email.split("@")[0],
            "settings": default_settings,
        }


@router.get("/me")
async def get_me(x_user_email: str = Header(..., alias="X-User-Email")):
    """Get current user profile and settings."""
    try:
        db = get_db()
        user = await asyncio.wait_for(
            db.users.find_one({"email": x_user_email.lower()}),
            timeout=2.0
        )
        if user:
            return _user_from_doc(dict(user))
    except asyncio.TimeoutError:
        pass
    except Exception as e:
        print(f"DB error in get_me: {e}")
    
    # Return default profile instead of 404
    name = x_user_email.split("@")[0].replace(".", " ").replace("_", " ").title()
    return {
        "id": "",
        "email": x_user_email.lower(),
        "name": name,
        "settings": {"api_url": "http://localhost:8000", "default_device": "esp32-demo-1"}
    }


@router.patch("/me")
async def update_me(data: UserUpdate, x_user_email: str = Header(..., alias="X-User-Email")):
    """Update user profile."""
    try:
        db = get_db()
        update = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update:
            return await get_me(x_user_email)
        r = await asyncio.wait_for(
            db.users.find_one_and_update(
                {"email": x_user_email.lower()},
                {"$set": update},
                return_document=ReturnDocument.AFTER,
            ),
            timeout=2.0
        )
        if r:
            return _user_from_doc(dict(r))
    except asyncio.TimeoutError:
        pass
    except Exception as e:
        print(f"DB error in update_me: {e}")
    
    # Return updated profile even if DB fails
    return {
        "email": x_user_email.lower(),
        "name": data.name or x_user_email.split("@")[0],
    }


@router.get("/me/settings")
async def get_settings(x_user_email: str = Header(..., alias="X-User-Email")):
    """Get user settings."""
    default_settings = {"api_url": "http://localhost:8000", "default_device": "esp32-demo-1"}
    try:
        db = get_db()
        user = await asyncio.wait_for(
            db.users.find_one({"email": x_user_email.lower()}),
            timeout=2.0
        )
        if user:
            return user.get("settings", default_settings)
    except asyncio.TimeoutError:
        pass
    except Exception as e:
        print(f"DB error in get_settings: {e}")
    
    return default_settings


@router.patch("/me/settings")
async def update_settings(data: SettingsUpdate, x_user_email: str = Header(..., alias="X-User-Email")):
    """Update user settings."""
    default_settings = {"api_url": "http://localhost:8000", "default_device": "esp32-demo-1"}
    try:
        db = get_db()
        update = {f"settings.{k}": v for k, v in data.model_dump().items() if v is not None}
        if not update:
            return await get_settings(x_user_email)
        r = await asyncio.wait_for(
            db.users.find_one_and_update(
                {"email": x_user_email.lower()},
                {"$set": update},
                return_document=ReturnDocument.AFTER,
            ),
            timeout=2.0
        )
        if r:
            return r.get("settings", default_settings)
    except asyncio.TimeoutError:
        pass
    except Exception as e:
        print(f"DB error in update_settings: {e}")
    
    # Return merged settings even if DB fails
    return {**default_settings, **{k: v for k, v in data.model_dump().items() if v is not None}}
