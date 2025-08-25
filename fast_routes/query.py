from fastapi import APIRouter, Depends, HTTPException, Query, Body, Request
from typing import Dict, Any, List
from utils.auth_utils import fastapi_token_required
import utils.tasks as USER
from utils.redis import async_redis
from pydantic import BaseModel
from .utils import route_handler
import json

query_router = APIRouter()

@query_router.get("/query_solution")
@route_handler()
async def query_solution(id: str = Query(default="1")):
    cache_key = f"solution:{id}"
    cached_result = await async_redis.get(cache_key)
    if cached_result:
        return cached_result
    
    try:
        result = await USER.query_solution(id)
    except Exception as e:
        print(f"Query failed: {e}")
    try:
        await async_redis.setex(cache_key, 3600, json.dumps(result))
    except Exception as e:
        print(f"Cache write failed: {e}")
    return result

# @query_router.get("/query_paper")
# @route_handler()
# async def query_paper(id: str = Query(default="1")):
#     cache_key = f"paper:{id}"
#     cached_result = redis_client.get(cache_key)
#     if cached_result:
#         return cached_result
        
#     result = USER.query_paper(id)
#     redis_client.setex(cache_key, 3600, result)
#     return result

@query_router.post("/user/query_liked_solutions")
@route_handler()
async def query_liked_solution(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    solution_ids = data.get('solution_ids', [])
    if not solution_ids:
        raise HTTPException(
            status_code=400,
            detail="Solution IDs are required"
        )
    
    user_id = current_user['_id']
    result = await USER.query_liked_solution(user_id, solution_ids)
    return result

@query_router.get("/solution/{solution_id}/like_count")
@route_handler()
async def get_solution_like_count(solution_id: str):
    from utils.db import solutions_collection
    from bson.objectid import ObjectId
    doc = await solutions_collection.find_one({'_id': ObjectId(solution_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Solution not found")
    like_count = doc.get('Liked', 0)
    return {"solution_id": solution_id, "like_count": like_count}
