from .auth import auth_router
from .task import task_router
from .query import query_router
from .load import load_router
from .prompts import prompts_router

__all__ = [
    "auth_router",
    "task_router",
    "query_router",
    "load_router",
    "prompts_router"
] 