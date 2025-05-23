from typing import Dict, List
import redis
from pymongo import MongoClient
from meilisearch import Client
from datetime import datetime
import socket
from fastapi import FastAPI
from fastapi.responses import JSONResponse

class HealthCheck:
    def __init__(self):
        self.mongo_uri = "mongodb://localhost:27017/"
        self.redis_host = "localhost"
        self.redis_port = 6379
        self.meilisearch_url = "http://localhost:7700"
        self.connection_timeout = 2  # 2秒超时

    def _is_port_open(self, host: str, port: int) -> bool:
        """检查指定端口是否开放"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(self.connection_timeout)
        try:
            result = sock.connect_ex((host, port))
            return result == 0
        finally:
            sock.close()

    def check_mongodb(self) -> Dict:
        if not self._is_port_open("localhost", 27017):
            return {
                "status": "不健康",
                "状态详情": "MongoDB服务未运行（端口27017未开放）",
                "建议": "请确保MongoDB服务已启动"
            }
        try:
            client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=2000)
            client.server_info()
            return {"status": "健康"}
        except Exception as e:
            return {
                "status": "不健康",
                "状态详情": f"连接错误: {str(e)}",
                "建议": "请检查MongoDB服务状态和连接配置"
            }

    def check_redis(self) -> Dict:
        if not self._is_port_open("localhost", 6379):
            return {
                "status": "不健康",
                "状态详情": "Redis服务未运行（端口6379未开放）",
                "建议": "请确保Redis服务已启动"
            }
        try:
            client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                socket_timeout=self.connection_timeout
            )
            client.ping()
            return {"status": "健康"}
        except Exception as e:
            return {
                "status": "不健康",
                "状态详情": f"连接错误: {str(e)}",
                "建议": "请检查Redis服务状态和连接配置"
            }

    def check_meilisearch(self) -> Dict:
        if not self._is_port_open("localhost", 7700):
            return {
                "status": "不健康",
                "状态详情": "Meilisearch服务未运行（端口7700未开放）",
                "建议": "请确保Meilisearch服务已启动"
            }
        try:
            client = Client(self.meilisearch_url)
            client.health()
            return {"status": "健康"}
        except Exception as e:
            return {
                "status": "不健康",
                "状态详情": f"连接错误: {str(e)}",
                "建议": "请检查Meilisearch服务状态和连接配置"
            }

    def get_api_routes(self, app: FastAPI) -> List[Dict]:
        routes = []
        for route in app.routes:
            if hasattr(route, "methods") and route.path.startswith("/api"):
                routes.append({
                    "路径": route.path,
                    "请求方法": list(route.methods),
                    "名称": route.name if hasattr(route, "name") else None,
                    "描述": route.description if hasattr(route, "description") else None
                })
        return sorted(routes, key=lambda x: x["路径"])

    async def check_all(self, app: FastAPI) -> JSONResponse:
        health_status = {
            "系统状态": "健康",
            "版本": "1.1.0",
            "检查时间": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "服务状态": {},
            "修复建议": []
        }

        # 检查各个服务
        services_status = {
            "MongoDB数据库": self.check_mongodb(),
            "Redis缓存": self.check_redis(),
            "Meilisearch搜索引擎": self.check_meilisearch()
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

        # 获取API路由信息
        health_status["可用API"] = self.get_api_routes(app)

        # 始终返回200状态码，将服务状态信息放在响应体中
        return JSONResponse(
            content=health_status,
            status_code=200
        ) 