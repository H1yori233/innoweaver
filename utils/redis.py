import json
import time
from redis import Redis
from redis.asyncio import Redis as AsyncRedis
from typing import Optional, Dict, Any
from .config import REDIS

# Synchronous Redis client
redis_client = Redis(
    host=REDIS["host"],
    port=REDIS["port"],
    db=REDIS["db"],
    password=REDIS["password"],
    decode_responses=True,
)

# Asynchronous Redis client
async_redis = AsyncRedis(
    host=REDIS["host"],
    port=REDIS["port"],
    db=REDIS["db"],
    password=REDIS["password"],
    decode_responses=True,
)


def start_task(current_user):
    task_id = str(int(time.time() * 1000))
    redis_client.set(
        task_id, json.dumps({"status": "started", "progress": 0, "result": {}})
    )
    return task_id


def update_task_status(task_id, status, progress, result=None):
    task_data = json.loads(redis_client.get(task_id) or "{}")
    if not task_data:
        task_data = {"result": {}}

    task_data.update({"status": status, "progress": progress})

    if result:
        task_data["result"].update(result)

    redis_client.set(task_id, json.dumps(task_data))


def delete_task(task_id):
    redis_client.delete(task_id)


# Async task management functions
async def async_start_task(current_user) -> str:
    task_id = str(int(time.time() * 1000))
    await async_redis.set(
        task_id, json.dumps({"status": "started", "progress": 0, "result": {}})
    )
    return task_id


async def async_update_task_status(
    task_id: str, status: str, progress: int, result: Optional[Dict] = None
):
    task_data = json.loads(await async_redis.get(task_id) or "{}")
    if not task_data:
        task_data = {"result": {}}

    task_data.update({"status": status, "progress": progress})

    if result:
        task_data["result"].update(result)

    await async_redis.set(task_id, json.dumps(task_data))


async def async_delete_task(task_id: str):
    await async_redis.delete(task_id)


async def get_task_status(task_id: str) -> Dict[str, Any]:
    """Get task status"""
    data = await async_redis.get(task_id)
    return json.loads(data) if data else {"status": "unknown", "progress": 0}
