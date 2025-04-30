from functools import wraps
from flask import request, jsonify
import utils.tasks as USER
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Union, Any
from .config import API

def token_required(f):
    @wraps(f)
    async def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({'error': '请登录'}), 401
        current_user = await USER.decode_token(token)
        if not current_user:
            return jsonify({'error': '令牌无效或已过期'}), 401
        return await f(current_user, *args, **kwargs)
    return decorated

def validate_input(fields):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.json
            for field in fields:
                if field not in data or not data[field]:
                    return jsonify({"error": f"Missing or empty field: {field}"}), 400
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# 添加 FastAPI 的安全模式
security = HTTPBearer()

# 新增 FastAPI 版本的认证装饰器
async def fastapi_token_required(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    FastAPI 版本的 token 验证装饰器
    使用方法:
    @router.get("/protected")
    async def protected_route(current_user: dict = Depends(fastapi_token_required)):
        return {"message": "Protected route", "user": current_user}
    """
    try:
        token = credentials.credentials
        current_user = await USER.decode_token(token)
        
        if not current_user:
            raise HTTPException(
                status_code=401,
                detail="令牌无效或已过期",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return current_user
        
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="请登录",
            headers={"WWW-Authenticate": "Bearer"},
        )

# FastAPI 版本的输入验证装饰器
def fastapi_validate_input(fields: list):
    """
    FastAPI 版本的输入验证装饰器
    使用方法:
    @router.post("/example")
    @fastapi_validate_input(["username", "password"])
    async def example_route(request: Request):
        data = await request.json()
        return {"message": "Valid input"}
    """
    def decorator(f):
        @wraps(f)
        async def decorated_function(request: Request, *args, **kwargs):
            try:
                data = await request.json()
                for field in fields:
                    if field not in data or not data[field]:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Missing or empty field: {field}"
                        )
                return await f(request, *args, **kwargs)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid JSON data"
                )
        return decorated_function
    return decorator
