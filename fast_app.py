from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from datetime import datetime
import os
from fast_routes import auth_router, task_router, query_router, load_router, prompts_router
from utils.log import logger
from utils.rate_limiter import rate_limit_middleware

app = FastAPI(
    title="InnoWeaver",
    description="InnoWeaver API - FastAPI Version",
    version="1.1.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置模板
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Celery 配置
app.state.broker_url = 'redis://localhost:6379/1'
app.state.result_backend = 'redis://localhost:6379/0'
app.state.BASE_URL = os.getenv("BASE_URL")

# 添加限流中间件
@app.middleware("http")
async def api_rate_limiter(request: Request, call_next):
    return await rate_limit_middleware(request, call_next)

# 注册路由
app.include_router(auth_router, prefix="/api")
app.include_router(task_router, prefix="/api")
app.include_router(query_router, prefix="/api")
app.include_router(load_router, prefix="/api")
app.include_router(prompts_router, prefix="/api")

# 请求日志中间件
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

# 健康检查端点
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.1.0",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "fast_app:app",
        host="0.0.0.0",
        port=5000,
        # reload=True,  # 开发模式启用热重载
        reload=False,
        workers=4     # 生产环境可以调整 worker 数量
    ) 