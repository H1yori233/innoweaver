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
rate_limiter = RateLimiter(
    redis_prefix="innoweaver:ratelimit:",
    default_limit=60,  # 默认每分钟60次请求
    default_window=60,
    ip_limit=100,      # IP限制每分钟100次请求
    ip_window=60,
)

# 为一些敏感或高负载端点配置特定的限制
rate_limiter.add_endpoint_limit("/api/query", 5, 60)           # 查询API每分钟限制30次
rate_limiter.add_endpoint_limit("/api/knowledge_extraction", 10, 60)  # 知识提取API每分钟限制10次
rate_limiter.add_endpoint_limit("/api/user/api_key", 5, 60)     # API密钥设置每分钟限制5次

async def rate_limit_dependency(request: Request):
    """
    用于FastAPI依赖注入的限流器函数
    
    使用方式:
    @app.get("/some-endpoint", dependencies=[Depends(rate_limit_dependency)])
    async def some_endpoint():
        ...
    """
    try:
        # 尝试获取当前用户
        current_user = await fastapi_token_required(request)
        user_id = str(current_user["_id"])
    except:
        # 如果未能获取用户信息，则作为匿名请求处理
        user_id = None
    
    result = await rate_limiter.async_check_rate_limit(request, user_id)
    
    if not result["allowed"]:
        reset_at = result["reset_at"]
        limit_type = result["type"]
        logger.warning(f"Rate limit exceeded: {limit_type} limit for {request.url.path}. " +
                      f"Count: {result['count']}/{result['limit']}. Reset at: {reset_at}")
        
        retry_after = max(1, reset_at - int(time.time()))
        
        raise HTTPException(
            status_code=429,
            detail="请求频率超限，请稍后再试",
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(result["limit"]),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_at)
            }
        )
    
    return result

# 全局中间件函数，用于应用于所有请求
async def rate_limit_middleware(request: Request, call_next):
    """
    全局限流中间件
    
    使用方式:
    app.add_middleware(rate_limit_middleware)
    """
    try:
        # 尝试获取当前用户
        authorization = request.headers.get("Authorization", "")
        user_id = None
        
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            try:
                from utils.auth_utils import USER
                current_user = await USER.decode_token(token)
                if current_user:
                    user_id = str(current_user["_id"])
            except:
                pass
    except:
        user_id = None
    
    result = await rate_limiter.async_check_rate_limit(request, user_id)
    
    if not result["allowed"]:
        reset_at = result["reset_at"]
        limit_type = result["type"]
        logger.warning(f"Rate limit exceeded: {limit_type} limit for {request.url.path}. " +
                      f"Count: {result['count']}/{result['limit']}. Reset at: {reset_at}")
        
        retry_after = max(1, reset_at - int(time.time()))
        
        return JSONResponse(
            status_code=429,
            content={"detail": "请求频率超限，请稍后再试"},
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(result["limit"]),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_at)
            }
        )
    
    response = await call_next(request)
    
    # 添加速率限制信息到响应头
    response.headers["X-RateLimit-Limit"] = str(result["limit"])
    response.headers["X-RateLimit-Remaining"] = str(max(0, result["limit"] - result["count"]))
    response.headers["X-RateLimit-Reset"] = str(result["reset_at"])
    
    return response 