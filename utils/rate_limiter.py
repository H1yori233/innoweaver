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
    Redis-based rate limiter class
    Supports IP rate limiting and user rate limiting
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
        Initialize rate limiter

        Parameters:
            redis_prefix: Redis key prefix
            default_limit: Default limit (maximum requests per window period)
            default_window: Default window period (seconds)
            ip_limit: IP limit (maximum requests per window period)
            ip_window: IP window period (seconds)
        """
        self.redis_prefix = redis_prefix
        self.default_limit = default_limit
        self.default_window = default_window
        self.ip_limit = ip_limit
        self.ip_window = ip_window
        
        # Store limit configurations for different API endpoints
        self.endpoint_limits: Dict[str, Dict[str, int]] = {}
    
    def add_endpoint_limit(self, endpoint: str, limit: int, window: int):
        """
        Add limit configuration for specific endpoint

        Parameters:
            endpoint: API endpoint path
            limit: Limit (maximum requests per window period)
            window: Window period (seconds)
        """
        self.endpoint_limits[endpoint] = {
            "limit": limit,
            "window": window
        }
    
    def _get_endpoint_config(self, endpoint: str) -> Dict[str, int]:
        """Get endpoint limit configuration"""
        return self.endpoint_limits.get(endpoint, {
            "limit": self.default_limit,
            "window": self.default_window
        })
    
    def _get_user_key(self, user_id: str, endpoint: str) -> str:
        """Generate user rate limiting key"""
        return f"{self.redis_prefix}user:{user_id}:{endpoint}"
    
    def _get_ip_key(self, ip: str) -> str:
        """Generate IP rate limiting key"""
        return f"{self.redis_prefix}ip:{ip}"

    def _get_anonymous_key(self, req_hash: str) -> str:
        """Generate anonymous user rate limiting key"""
        return f"{self.redis_prefix}anon:{req_hash}"
    
    def _generate_request_hash(self, request: Request) -> str:
        """Generate unique hash value for request"""
        # Combine client IP, user agent and path
        hash_input = f"{request.client.host}:{request.headers.get('user-agent', '')}:{request.url.path}"
        return hashlib.md5(hash_input.encode()).hexdigest()
    
    def check_rate_limit(self, request: Request, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
                Check if request exceeds limit (synchronous version)

        Parameters:
            request: FastAPI request object
            user_id: Optional user ID

        Returns:
            Dictionary containing limit information
        """
        endpoint = request.url.path
        endpoint_config = self._get_endpoint_config(endpoint)
        limit = endpoint_config["limit"]
        window = endpoint_config["window"]
        
        # Apply IP rate limiting
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
        
        # Apply user or anonymous rate limiting
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
                Check if request exceeds limit (asynchronous version)

        Parameters:
            request: FastAPI request object
            user_id: Optional user ID

        Returns:
            Dictionary containing limit information
        """
        endpoint = request.url.path
        endpoint_config = self._get_endpoint_config(endpoint)
        limit = endpoint_config["limit"]
        window = endpoint_config["window"]
        
        # Apply IP rate limiting
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
        
        # Apply user or anonymous rate limiting
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

# Create global rate limiter instance
rate_limiter = RateLimiter(
    redis_prefix="innoweaver:ratelimit:",
    default_limit=60,  # Default 60 requests per minute
    default_window=60,
    ip_limit=100,      # IP limit 100 requests per minute
    ip_window=60,
)

# Configure specific limits for sensitive or high-load endpoints
rate_limiter.add_endpoint_limit("/api/query", 5, 60)           # Query API limit 5 times per minute
rate_limiter.add_endpoint_limit("/api/knowledge_extraction", 10, 60)  # Knowledge extraction API limit 10 times per minute
rate_limiter.add_endpoint_limit("/api/user/api_key", 5, 60)     # API key setting limit 5 times per minute

async def rate_limit_dependency(request: Request):
    """
    Rate limiter function for FastAPI dependency injection

    Usage:
    @app.get("/some-endpoint", dependencies=[Depends(rate_limit_dependency)])
    async def some_endpoint():
        ...
    """
    try:
        # Try to get current user
        current_user = await fastapi_token_required(request)
        user_id = str(current_user["_id"])
    except:
        # If unable to get user info, handle as anonymous request
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
            detail="Request frequency exceeded, please try again later",
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(result["limit"]),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_at)
            }
        )
    
    return result

# Global middleware function for applying to all requests
async def rate_limit_middleware(request: Request, call_next):
    """
    Global rate limiting middleware

    Usage:
    app.add_middleware(rate_limit_middleware)
    """
    try:
        # Try to get current user
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
            content={"detail": "Request frequency exceeded, please try again later"},
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(result["limit"]),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_at)
            }
        )
    
    response = await call_next(request)
    
    # Add rate limit info to response headers
    response.headers["X-RateLimit-Limit"] = str(result["limit"])
    response.headers["X-RateLimit-Remaining"] = str(max(0, result["limit"] - result["count"]))
    response.headers["X-RateLimit-Reset"] = str(result["reset_at"])
    
    return response 