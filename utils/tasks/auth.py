import jwt
import datetime
import bcrypt
import json
import base64
from utils.db import users_collection, ALLOWED_USER_TYPES, SECRET_KEY
from utils.redis import async_redis
from utils.tasks.task import (
    update_user_to_meilisearch,
    async_update_user_to_meilisearch,
)


async def register_user(email, name, password, user_type):
    if not email or not name or not password or not user_type:
        return {"error": "Email, username, password and account type are required"}, 400

    if user_type not in ALLOWED_USER_TYPES:
        return {"error": "Invalid account type"}, 400

    existing_user = await users_collection.find_one({"email": email})
    if existing_user:
        return {"error": "This email is already registered"}, 400

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    user = {
        "email": email,
        "name": name,
        "password": hashed_password,
        "user_type": user_type,
    }

    result = await users_collection.insert_one(user)
    created_user = await users_collection.find_one({"_id": result.inserted_id})
    await async_update_user_to_meilisearch(created_user)
    return {"message": "Registration successful"}, 201


async def login_user(email, password):
    if not email or not password:
        return {"error": "Email and password are required"}, 400

    user = await users_collection.find_one({"email": email})
    if not user:
        return {"error": "User does not exist"}, 404

    stored_password = user.get("password")
    if isinstance(stored_password, str):
        try:
            stored_password_bytes = base64.b64decode(stored_password)
        except Exception as e:
            return {"error": "Password format error"}, 500
    elif isinstance(stored_password, bytes):
        stored_password_bytes = stored_password
    else:
        # print("Unknown password type.")
        return {"error": "Password format error"}, 500

    if not bcrypt.checkpw(password.encode("utf-8"), stored_password_bytes):
        return {"error": "Incorrect password"}, 401

    token = jwt.encode(
        {
            "email": user["email"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        },
        SECRET_KEY,
        algorithm="HS256",
    )

    user_data = {
        key: str(value) if key == "_id" else value
        for key, value in user.items()
        if key != "password"
    }

    if "api_url" not in user_data:
        user_data["api_url"] = ""
    if "model_name" not in user_data:
        user_data["model_name"] = ""

    return {"message": "Login successful", "token": token, "user": user_data}, 200


async def decode_token(token):
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        current_user = await users_collection.find_one({"email": data["email"]})
        return current_user
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


# Check login attempt count
async def check_login_attempts(email):
    cache_key = f"login_attempts:{email}"
    attempts = await async_redis.get(cache_key)
    if attempts and int(attempts) >= 10:
        return True
    return False


# Increment login attempt count
async def increment_login_attempts(email):
    cache_key = f"login_attempts:{email}"
    await async_redis.incr(cache_key)
    await async_redis.expire(cache_key, 300)


# Reset login attempt count
async def reset_login_attempts(email):
    cache_key = f"login_attempts:{email}"
    await async_redis.delete(cache_key)


# Cache session
async def cache_user_session(user_id, data):
    await async_redis.setex(f"user_session:{user_id}", 3600, json.dumps(data))
