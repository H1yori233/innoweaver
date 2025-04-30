from functools import wraps
from fastapi import HTTPException
import utils.log as LOG

def route_handler():
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except HTTPException as e:
                LOG.logger.error(f"Error in {func.__name__}: {str(e.detail)}")
                raise
            except Exception as e:
                LOG.logger.error(f"Error in {func.__name__}: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        return wrapper
    return decorator 