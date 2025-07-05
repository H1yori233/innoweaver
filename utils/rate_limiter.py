import time
import json
from fastapi import Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List, Union, Callable
from .redis import redis_client, async_redis
from .log import logger
from .auth_utils import fastapi_token_required
import hashlib

class RateLimiter:
    """
    基于Redis的限流器类
    支持IP限流和用户限流
    """
    def __init__(
        self,
        redis_prefix: str = "ratelimit:",
        default_limit: int = 60,
        default_window: int = 60,
        ip_limit: int = 100,
        ip_window: int = 60,
    ):
        """
        初始化限流器
        
        参数:
            redis_prefix: Redis键前缀
            default_limit: 默认限制(每个窗口期内的最大请求数)
            default_window: 默认窗口期(秒)
            ip_limit: IP限制(每个窗口期内的最大请求数)
            ip_window: IP窗口期(秒)
        """
        self.redis_prefix = redis_prefix
        self.default_limit = default_limit
        self.default_window = default_window
        self.ip_limit = ip_limit
        self.ip_window = ip_window
        
        # 为不同API端点存储的限制配置
        self.endpoint_limits: Dict[str, Dict[str, int]] = {}
    
    def add_endpoint_limit(self, endpoint: str, limit: int, window: int):
        """
        为特定端点添加限制配置
        
        参数:
            endpoint: API端点路径
            limit: 限制(每个窗口期内的最大请求数)
            window: 窗口期(秒)
        """
        self.endpoint_limits[endpoint] = {
            "limit": limit,
            "window": window
        }
    
    def _get_endpoint_config(self, endpoint: str) -> Dict[str, int]:
        """获取端点限制配置"""
        return self.endpoint_limits.get(endpoint, {
            "limit": self.default_limit,
            "window": self.default_window
        })
    
    def _get_user_key(self, user_id: str, endpoint: str) -> str:
        """生成用户限流键"""
        return f"{self.redis_prefix}user:{user_id}:{endpoint}"
    
    def _get_ip_key(self, ip: str) -> str:
        """生成IP限流键"""
        return f"{self.redis_prefix}ip:{ip}"

    def _get_anonymous_key(self, req_hash: str) -> str:
        """生成匿名用户限流键"""
        return f"{self.redis_prefix}anon:{req_hash}"
    
    def _generate_request_hash(self, request: Request) -> str:
        """为请求生成唯一哈希值"""
        # 结合客户端IP、用户代理和路径
        hash_input = f"{request.client.host}:{request.headers.get('user-agent', '')}:{request.url.path}"
        return hashlib.md5(hash_input.encode()).hexdigest()
    
    def check_rate_limit(self, request: Request, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        检查请求是否超过限制(同步版本)
        
        参数:
            request: FastAPI请求对象
            user_id: 可选的用户ID
            
        返回:
            包含限制信息的字典
        """
        endpoint = request.url.path
        endpoint_config = self._get_endpoint_config(endpoint)
        limit = endpoint_config["limit"]
        window = endpoint_config["window"]
        
        # 进行IP限流
        ip = request.client.host
        ip_key = self._get_ip_key(ip)
        ip_counter = redis_client.get(ip_key)
        
        if not ip_counter:
            redis_client.setex(ip_key, self.ip_window, 1)
            ip_count = 1
        else:
            ip_count = int(ip_counter) + 1
            redis_client.setex(ip_key, self.ip_window, ip_count)
        
        if ip_count > self.ip_limit:
            return {
                "allowed": False,
                "count": ip_count,
                "limit": self.ip_limit,
                "window": self.ip_window,
                "type": "ip",
                "reset_at": int(time.time()) + int(redis_client.ttl(ip_key))
            }
        
        # 进行用户或匿名限流
        if user_id:
            key = self._get_user_key(user_id, endpoint)
        else:
            req_hash = self._generate_request_hash(request)
            key = self._get_anonymous_key(req_hash)
        
        counter = redis_client.get(key)
        
        if not counter:
            redis_client.setex(key, window, 1)
            count = 1
        else:
            count = int(counter) + 1
            redis_client.setex(key, window, count)
        
        allowed = count <= limit
        
        return {
            "allowed": allowed,
            "count": count,
            "limit": limit,
            "window": window,
            "type": "user" if user_id else "anonymous",
            "reset_at": int(time.time()) + int(redis_client.ttl(key))
        }
    
    async def async_check_rate_limit(self, request: Request, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        检查请求是否超过限制(异步版本)
        
        参数:
            request: FastAPI请求对象
            user_id: 可选的用户ID
            
        返回:
            包含限制信息的字典
        """
        endpoint = request.url.path
        endpoint_config = self._get_endpoint_config(endpoint)
        limit = endpoint_config["limit"]
        window = endpoint_config["window"]
        
        # 进行IP限流
        ip = request.client.host
        ip_key = self._get_ip_key(ip)
        ip_counter = await async_redis.get(ip_key)
        
        if not ip_counter:
            await async_redis.setex(ip_key, self.ip_window, 1)
            ip_count = 1
        else:
            ip_count = int(ip_counter) + 1
            await async_redis.setex(ip_key, self.ip_window, ip_count)
        
        if ip_count > self.ip_limit:
            return {
                "allowed": False,
                "count": ip_count,
                "limit": self.ip_limit,
                "window": self.ip_window,
                "type": "ip",
                "reset_at": int(time.time()) + await async_redis.ttl(ip_key)
            }
        
        # 进行用户或匿名限流
        if user_id:
            key = self._get_user_key(user_id, endpoint)
        else:
            req_hash = self._generate_request_hash(request)
            key = self._get_anonymous_key(req_hash)
        
        counter = await async_redis.get(key)
        
        if not counter:
            await async_redis.setex(key, window, 1)
            count = 1
        else:
            count = int(counter) + 1
            await async_redis.setex(key, window, count)
        
        allowed = count <= limit
        
        return {
            "allowed": allowed,
            "count": count,
            "limit": limit,
            "window": window,
            "type": "user" if user_id else "anonymous",
            "reset_at": int(time.time()) + await async_redis.ttl(key)
        }

# 创建全局限流器实例
rate_limiter = RateLimiter()

# 为特定端点添加自定义限制
rate_limiter.add_endpoint_limit("/api/query", limit=30, window=60)  # 查询分析限制
rate_limiter.add_endpoint_limit("/api/complete", limit=10, window=300)  # 完成任务限制
rate_limiter.add_endpoint_limit("/api/knowledge_extraction", limit=20, window=60)  # 知识提取限制

async def rate_limit_dependency(request: Request):
    """
    FastAPI依赖项，用于检查限流
    """
    try:
        # 尝试获取用户ID（如果已认证）
        user_id = None
        try:
            # 这里可以添加获取用户ID的逻辑
            # 例如从JWT token中提取用户ID
            pass
        except:
            pass
        
        # 检查限流
        result = await rate_limiter.async_check_rate_limit(request, user_id)
        
        if not result["allowed"]:
            # 构建限流响应
            response_data = {
                "error": "Rate limit exceeded",
                "message": f"Too many requests. Limit: {result['limit']} requests per {result['window']} seconds",
                "count": result["count"],
                "limit": result["limit"],
                "window": result["window"],
                "type": result["type"],
                "reset_at": result["reset_at"]
            }
            
            # 添加限流头部信息
            headers = {
                "X-RateLimit-Limit": str(result["limit"]),
                "X-RateLimit-Remaining": str(max(0, result["limit"] - result["count"])),
                "X-RateLimit-Reset": str(result["reset_at"]),
                "Retry-After": str(result["window"])
            }
            
            raise HTTPException(
                status_code=429,
                detail=response_data,
                headers=headers
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Rate limiting error: {e}")
        # 如果限流检查失败，允许请求通过
        return {"allowed": True, "count": 0, "limit": 0, "window": 0, "type": "error"}

async def rate_limit_middleware(request: Request, call_next):
    """
    FastAPI中间件，用于全局限流检查
    """
    try:
        # 检查限流
        await rate_limit_dependency(request)
        
        # 继续处理请求
        response = await call_next(request)
        
        # 添加限流头部信息到响应
        # 这里可以添加更多的头部信息
        
        return response
        
    except HTTPException as e:
        if e.status_code == 429:
            # 返回限流错误响应
            return JSONResponse(
                status_code=429,
                content=e.detail,
                headers=e.headers
            )
        raise
    except Exception as e:
        logger.error(f"Rate limiting middleware error: {e}")
        # 如果限流检查失败，允许请求通过
        return await call_next(request)

# 便捷的装饰器函数
def rate_limit(limit: int = 60, window: int = 60):
    """
    装饰器函数，用于为特定端点添加限流
    
    参数:
        limit: 限制(每个窗口期内的最大请求数)
        window: 窗口期(秒)
    """
    def decorator(func: Callable):
        async def wrapper(*args, **kwargs):
            # 这里可以添加限流逻辑
            return await func(*args, **kwargs)
        return wrapper
    return decorator 