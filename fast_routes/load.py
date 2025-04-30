from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from utils.auth_utils import fastapi_token_required
import utils.tasks as USER
import utils.log as LOG
from .utils import route_handler
import json

load_router = APIRouter()

@load_router.get("/user/load_solutions")
@route_handler()
async def load_user_solutions(
    page: int = Query(default=1, ge=1),
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    result = await USER.load_solutions(current_user['_id'], page)
    return result

@load_router.get("/user/load_liked_solutions")
@route_handler()
async def load_user_liked_solutions(
    page: int = Query(default=1, ge=1),
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    result = await USER.load_liked_solutions(current_user['_id'], page)
    return result

@load_router.get("/gallery")
@route_handler()
async def gallery(page: int = Query(default=1, ge=1)):
    result = await USER.gallery(page)
    return result

@load_router.get("/logs")
@route_handler()
async def get_logs(current_user: Dict[str, Any] = Depends(fastapi_token_required)):
    """获取日志条目"""
    try:
        if current_user['user_type'] != 'developer':
            raise HTTPException(status_code=403, detail='没有权限访问此资源')
        
        logs = []
        with open(LOG.LOG_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    # 解析日志行
                    parts = line.split(' - ', 3)
                    if len(parts) == 4:
                        timestamp, name, level, message = parts
                        logs.append({
                            'timestamp': timestamp.strip(),
                            'name': name.strip(),
                            'level': level.strip(),
                            'message': message.strip()
                        })
                except Exception as e:
                    continue
        return logs
    except FileNotFoundError:
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@load_router.get("/logs/stats")
@route_handler()
async def get_log_stats(current_user: Dict[str, Any] = Depends(fastapi_token_required)):
    """获取日志统计信息"""
    try:
        if current_user['user_type'] != 'developer':
            raise HTTPException(status_code=403, detail='没有权限访问此资源')
        
        stats = {
            'total_logs': 0,
            'error_count': 0,
            'warn_count': 0,
            'info_count': 0,
            'debug_count': 0
        }
        
        try:
            with open(LOG.LOG_FILE, 'r', encoding='utf-8') as f:
                for line in f:
                    stats['total_logs'] += 1
                    if ' ERROR ' in line:
                        stats['error_count'] += 1
                    elif ' WARN ' in line:
                        stats['warn_count'] += 1
                    elif ' INFO ' in line:
                        stats['info_count'] += 1
                    elif ' DEBUG ' in line:
                        stats['debug_count'] += 1
        except FileNotFoundError:
            pass
                    
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 