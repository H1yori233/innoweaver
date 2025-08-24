from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any
from utils.auth_utils import fastapi_token_required, fastapi_validate_input
from utils.rate_limiter import rate_limit_dependency, rate_limiter
import utils.tasks as USER
from .utils import route_handler

# Configure login endpoint specific rate limiting rules - prevent brute force attacks
rate_limiter.add_endpoint_limit("/api/login", 10, 60)  # Login 10 times per minute

auth_router = APIRouter()

@auth_router.post("/register")
@route_handler()
@fastapi_validate_input(["email", "name", "password", "user_type"])
async def register(request: Request):
    data = await request.json()
    response, status_code = await USER.register_user(
        data["email"], 
        data["name"], 
        data["password"], 
        data["user_type"]
    )
    if status_code != 201:
        raise HTTPException(status_code=status_code, detail=response['error'])
    return response

@auth_router.post("/login")
@route_handler()
@fastapi_validate_input(["email", "password"])
async def login(
    request: Request,
    _: Dict = Depends(rate_limit_dependency)  # Add rate limiting dependency
):
    data = await request.json()
    response, status_code = await USER.login_user(data["email"], data["password"])
    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=response['error'])
    return response

@auth_router.get("/get_user")
@route_handler()
async def get_user(current_user: Dict[str, Any] = Depends(fastapi_token_required)):
    return current_user 