import json
import time
from redis import Redis
from redis.asyncio import Redis as AsyncRedis
from typing import Optional, Dict, Any
from .config import REDIS

# 同步 Redis 客户端
redis_client = Redis(
    host=REDIS['host'],
    port=REDIS['port'],
    db=REDIS['db'],
    password=REDIS['password'],
    decode_responses=True
)

# 异步 Redis 客户端
async_redis = AsyncRedis(
    host=REDIS['host'],
    port=REDIS['port'],
    db=REDIS['db'],
    password=REDIS['password'],
    decode_responses=True
)

def start_task(current_user):
    task_id = str(int(time.time() * 1000))
    redis_client.set(
        task_id,
        json.dumps({
            "status": "started",
            "progress": 0,
            "result": {}
        })
    )
    return task_id

def update_task_status(task_id, status, progress, result=None):
    task_data = json.loads(redis_client.get(task_id) or "{}")
    if not task_data:
        task_data = {"result": {}}
        
    task_data.update({
        "status": status,
        "progress": progress
    })
    
    if result:
        task_data["result"].update(result)
        
    redis_client.set(task_id, json.dumps(task_data))

def delete_task(task_id):
    redis_client.delete(task_id)

# 异步任务管理函数
async def async_start_task(current_user) -> str:
    task_id = str(int(time.time() * 1000))
    await async_redis.set(
        task_id,
        json.dumps({
            "status": "started",
            "progress": 0,
            "result": {}
        })
    )
    return task_id

async def async_update_task_status(task_id: str, status: str, progress: int, result: Optional[Dict] = None):
    task_data = json.loads(await async_redis.get(task_id) or "{}")
    if not task_data:
        task_data = {"result": {}}
        
    task_data.update({
        "status": status,
        "progress": progress
    })
    
    if result:
        task_data["result"].update(result)
        
    await async_redis.set(task_id, json.dumps(task_data))

async def async_delete_task(task_id: str):
    await async_redis.delete(task_id)

async def get_task_status(task_id: str) -> Dict[str, Any]:
    """获取任务状态"""
    data = await async_redis.get(task_id)
    return json.loads(data) if data else {"status": "unknown", "progress": 0}
