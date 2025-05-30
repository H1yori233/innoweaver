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

class HealthResponse(BaseModel):
    系统状态: str
    版本: str
    检查时间: str
    服务状态: Dict[str, Dict[str, Any]]
    修复建议: List[str]
    可用API: Optional[List[Dict[str, Any]]] = None

# 创建健康检查实例
health_checker = HealthCheck()

@app.get("/api/health", response_model=HealthResponse, status_code=200)
def enhanced_health_check():
    """
    获取系统健康状态和可用API列表
    
    返回:
    - 系统整体健康状态
    - 各个服务（MongoDB、Redis、Meilisearch）的状态
    - 所有可用的API路由列表
    """
    try:
        health_status = {
            "系统状态": "检查中",
            "版本": "1.1.0",
            "检查时间": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "服务状态": {},
            "修复建议": []
        }

        # 检查各个服务
        services_status = {
            "MongoDB数据库": health_checker.check_mongodb(),
            "Redis缓存": health_checker.check_redis(),
            "Meilisearch搜索引擎": health_checker.check_meilisearch()
        }
        
        health_status["服务状态"] = services_status

        # 如果任何服务不健康，将整体状态设置为降级并收集建议
        if any(service["status"] == "不健康" for service in services_status.values()):
            health_status["系统状态"] = "服务降级"
            for service_name, service_status in services_status.items():
                if service_status["status"] == "不健康" and "建议" in service_status:
                    health_status["修复建议"].append(
                        f"{service_name}: {service_status['建议']}"
                    )
        else:
            health_status["系统状态"] = "健康"

        # 获取API路由信息
        routes = []
        for route in app.routes:
            if hasattr(route, "methods") and route.path.startswith("/api"):
                routes.append({
                    "路径": route.path,
                    "请求方法": list(route.methods),
                    "名称": route.name if hasattr(route, "name") else None,
                    "描述": route.description if hasattr(route, "description") else None
                })
        health_status["可用API"] = sorted(routes, key=lambda x: x["路径"])

        return health_status
    except Exception as e:
        logger.error(f"健康检查失败: {str(e)}")
        return {
            "系统状态": "错误",
            "版本": "1.1.0",
            "检查时间": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "服务状态": {},
            "修复建议": [f"健康检查执行失败: {str(e)}"],
            "可用API": []
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