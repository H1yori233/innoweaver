from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from datetime import datetime
import os
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from fast_routes import auth_router, task_router, query_router, load_router, prompts_router
from utils.log import logger
from utils.rate_limiter import rate_limit_middleware
from utils.health_check import HealthCheck

app = FastAPI(
    title="InnoWeaver",
    description="InnoWeaver API - FastAPI Version",
    version="1.1.0"
)

# Configure static files and templates (must be before middleware)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Celery configuration
app.state.broker_url = 'redis://localhost:6379/1'
app.state.result_backend = 'redis://localhost:6379/0'
app.state.BASE_URL = os.getenv("BASE_URL")

# Add rate limiting middleware
@app.middleware("http")
async def api_rate_limiter(request: Request, call_next):
    return await rate_limit_middleware(request, call_next)

# Register routes
app.include_router(auth_router, prefix="/api")
app.include_router(task_router, prefix="/api")
app.include_router(query_router, prefix="/api")
app.include_router(load_router, prefix="/api")
app.include_router(prompts_router, prefix="/api")

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"Response Status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        raise

@app.get("/hello")
async def hello():
    return {"message": "Hello World!"}

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

class HealthResponse(BaseModel):
    system_status: str
    version: str
    check_time: str
    services: Dict[str, Dict[str, Any]]
    suggestions: List[str]
    available_apis: Optional[List[Dict[str, Any]]] = None

# Create health check instance
health_checker = HealthCheck()

@app.get("/api/health", response_model=HealthResponse, status_code=200)
def enhanced_health_check():
    """
    Enhanced health check endpoint
    
    Check the health status of system components:
    - MongoDB database connection
    - Redis cache connection  
    - Meilisearch search engine connection
    - Return all available API routes
    
    Returns:
        HealthResponse: Contains system status, service status, suggestions and available APIs
    """
    import asyncio
    
    # Since this is a sync function, we need to create an event loop to run async method
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(health_checker.check_all(app))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "fast_app:app",
        host="0.0.0.0",
        port=5000,
        reload=True,  # Enable hot reload in development mode
        # reload=False,
        # workers=4     # Production environment can adjust worker count
        workers=1
    ) 