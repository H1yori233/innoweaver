from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from typing import Dict, Any, Optional
from utils.auth_utils import fastapi_token_required, fastapi_validate_input
from utils.rate_limiter import rate_limit_dependency
import utils.tasks as USER
from utils.redis import redis_client, async_redis
from pydantic import BaseModel
from .utils import route_handler
import json

task_router = APIRouter()

class KnowledgeRequest(BaseModel):
    paper: str

class QueryRequest(BaseModel):
    query: str
    design_doc: str = ""

class LikeSolutionRequest(BaseModel):
    _id: str

class ApiKeyRequest(BaseModel):
    api_key: str
    api_url: Optional[str] = None
    model_name: Optional[str] = None

class TaskData(BaseModel):
    data: Optional[Dict[str, Any]] = {}
    task_id: Optional[str] = None

@task_router.post("/knowledge_extraction")
@route_handler()
@fastapi_validate_input(["paper"])
async def knowledge(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required),
    _: Dict = Depends(rate_limit_dependency)
):
    data = await request.json()
    return await USER.knowledge(current_user, data["paper"])

@task_router.post("/query")
@route_handler()
@fastapi_validate_input(["query"])
async def query(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required),
    _: Dict = Depends(rate_limit_dependency)
):
    data = await request.json()
    result = await USER.query(current_user, data["query"], data.get("design_doc", ""))
    print(result)
    return result

@task_router.post("/user/like_solution")
@route_handler()
async def like_solution(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    solution_id = data.get('_id')
    if not solution_id:
        raise HTTPException(status_code=400, detail="Missing solution ID")
    result = await USER.like_solution(str(current_user['_id']), solution_id)
    return result

@task_router.post("/user/api_key")
@route_handler()
async def set_apikey(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    api_key = data.get('api_key')
    api_url = data.get('api_url')
    model_name = data.get('model_name')
    
    if not api_key:
        raise HTTPException(status_code=400, detail="API Key is required")
    
    result = await USER.set_apikey(current_user, api_key, api_url, model_name)
    return result

@task_router.post("/user/test_api")
@route_handler()
async def test_api_connection(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    api_key = data.get('api_key')
    api_url = data.get('api_url')
    model_name = data.get('model_name')
    
    if not api_key:
        raise HTTPException(status_code=400, detail="API Key is required")
    
    result = await USER.test_api_connection(current_user, api_key, api_url, model_name)
    return result

# ------------------------------------------------------------------------

@task_router.post("/complete/initialize")
@route_handler()
async def initialize_task(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    task_id = await USER.initialize_task(current_user, data.get("data", {}))
    return {
        "status": "started", 
        "task_id": task_id, 
        "progress": 10
    }

@task_router.post("/complete/rag")
@route_handler()
async def rag_step(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    task_id = data.get("task_id")
    rag_results = await USER.rag_step(current_user, task_id)
    return {"status": "in_progress", "task_id": task_id, "progress": 30}

@task_router.post("/complete/paper")
@route_handler()
async def paper_step(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    task_id = data.get("task_id")
    rag_results = await USER.paper_step(current_user, data.get("paper_ids", []), task_id)
    return {"status": "in_progress", "task_id": task_id, "progress": 30}

@task_router.post("/complete/example")
@route_handler()
async def example_step(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    task_id = data.get("task_id")
    
    example_ids_str = data.get("data") 
    example_ids = []
    if example_ids_str:
        try:
            example_ids = json.loads(example_ids_str)
            if not isinstance(example_ids, list):
                 raise HTTPException(status_code=400, detail="Invalid format for example IDs in 'data' field: expected a list.")
        except json.JSONDecodeError:
             raise HTTPException(status_code=400, detail="Invalid JSON string in 'data' field for example IDs.")

    print(f"Parsed example_ids: {example_ids}") # Debug print

    if not task_id:
        raise HTTPException(status_code=400, detail="Missing task_id")
    
    updated_rag_results = await USER.example_step(current_user, example_ids, task_id)
    return {"status": "in_progress", "task_id": task_id, "progress": 35}

@task_router.post("/complete/domain")
@route_handler()
async def domain_step(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    task_id = data.get("task_id")
    init_solution = await USER.domain_step(current_user, task_id)
    return {
        "status": "in_progress", 
        "task_id": task_id, 
        "progress": 60,
        "solution": init_solution
    }

@task_router.post("/complete/interdisciplinary")
@route_handler()
async def interdisciplinary_step(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    task_id = data.get("task_id")
    iterated_solution = await USER.interdisciplinary_step(current_user, task_id)
    return {
        "status": "in_progress", 
        "task_id": task_id, 
        "progress": 70,
        "solution": iterated_solution
    }

@task_router.post("/complete/evaluation")
@route_handler()
async def evaluation_step(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    task_id = data.get("task_id")
    final_solution = await USER.evaluation_step(current_user, task_id)
    return {
        "status": "in_progress", 
        "task_id": task_id, 
        "progress": 80,
        "solution": final_solution
    }

@task_router.post("/complete/drawing")
@route_handler()
async def drawing_step(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    task_id = data.get("task_id")
    final_solution = await USER.drawing_step(current_user, task_id)
    return {
        "status": "in_progress", 
        "task_id": task_id, 
        "progress": 90,
        "solution": final_solution
    }

@task_router.post("/complete/final")
@route_handler()
async def final_step(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    task_id = data.get("task_id")
    final_solution = await USER.final_step(current_user, task_id)
    USER.delete_task(task_id)
    return final_solution

# ------------------------------------------------------------------------

@task_router.get("/complete/status/{task_id}")
@route_handler()
async def task_status(task_id: str):
    task_data = await async_redis.get(task_id)
    if task_data:
        return json.loads(task_data)
    return {"status": "unknown", "progress": 0} 

# ------------------------------------------------------------------------

@task_router.post("/inspiration/chat")
@route_handler()
async def inspiration_chat(request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    inspiration_id = data.get("inspiration_id")
    new_message = data.get("new_message")
    chat_history = data.get("chat_history", [])
    stream = data.get("stream", False)
    
    return await USER.handle_inspiration_chat(current_user, inspiration_id, new_message, chat_history, stream=stream)
