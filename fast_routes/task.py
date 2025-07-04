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
async def inspiration_chat(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    inspiration_id = data.get("inspiration_id")
    new_message = data.get("new_message")
    chat_history = data.get("chat_history", [])
    stream = data.get("stream", False)
    
    return await USER.handle_inspiration_chat(current_user, inspiration_id, new_message, chat_history, stream=stream)

# ------------------------------------------------------------------------

from utils.tasks.research import start_research
import asyncio
from sse_starlette.sse import EventSourceResponse


@task_router.post("/research")
@route_handler()
async def research(
    request: Request, current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    query = data.get("query")
    query_analysis_result = data.get("query_analysis_result")
    with_paper = data.get("with_paper", False)
    with_example = data.get("with_example", False)
    is_drawing = data.get("is_drawing", False)
    print("start research")
    print(f"with_paper: {with_paper}, with_example: {with_example}, is_drawing: {is_drawing}")
    
    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()

        async def send_event(event_type: str, payload: Any):
            if await request.is_disconnected():
                raise asyncio.CancelledError()
            # print(f"event: {event_type}, data: {payload}")
            await queue.put({"event": event_type, "data": payload})

        async def run_workflow():
            try:
                await start_research(
                    current_user=current_user,
                    query=query,
                    query_analysis_result=query_analysis_result,
                    with_paper=with_paper,
                    with_example=with_example,
                    is_drawing=is_drawing,
                    send_event=send_event,
                )
            except asyncio.CancelledError:
                print("research cancelled")
                raise
            except Exception as e:
                await queue.put({"event": "error", "data": str(e)})
            finally:
                await queue.put({"event": "end", "data": "complete"})

        task = asyncio.create_task(run_workflow())
        try:
            while True:
                msg = await queue.get()
                yield msg
                if msg["event"] == "end":
                    break
        except asyncio.CancelledError:
            task.cancel()
            raise
        finally:
            if not task.done():
                task.cancel()

    return EventSourceResponse(event_generator(), media_type="text/event-stream")
