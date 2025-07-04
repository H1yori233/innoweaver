import socket
import redis
from pymongo import MongoClient
from meilisearch import Client
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Dict, List


class HealthCheck:
    def __init__(self):
        self.mongo_uri = "mongodb://localhost:27017/"
        self.redis_host = "localhost"
        self.redis_port = 6379
        self.meilisearch_url = "http://localhost:7700"
        self.connection_timeout = 2

    def _is_port_open(self, host: str, port: int) -> bool:
        """检查指定主机和端口是否开放"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(self.connection_timeout)
                result = sock.connect_ex((host, port))
                return result == 0
        except Exception:
            return False

    def check_mongodb(self) -> Dict:
        if not self._is_port_open("localhost", 27017):
            return {
                "status": "unhealthy",
                "details": "MongoDB service is not running (port 27017 is not open)",
                "suggestion": "Please ensure MongoDB service is started"
            }
        try:
            client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=2000)
            client.server_info()
            return {"status": "healthy"}
        except Exception as e:
            return {
                "status": "unhealthy",
                "details": f"Connection error: {str(e)}",
                "suggestion": "Please check MongoDB service status and connection configuration"
            }

    def check_redis(self) -> Dict:
        if not self._is_port_open("localhost", 6379):
            return {
                "status": "unhealthy",
                "details": "Redis service is not running (port 6379 is not open)",
                "suggestion": "Please ensure Redis service is started"
            }
        try:
            client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                socket_timeout=self.connection_timeout
            )
            client.ping()
            return {"status": "healthy"}
        except Exception as e:
            return {
                "status": "unhealthy",
                "details": f"Connection error: {str(e)}",
                "suggestion": "Please check Redis service status and connection configuration"
            }

    def check_meilisearch(self) -> Dict:
        if not self._is_port_open("localhost", 7700):
            return {
                "status": "unhealthy",
                "details": "Meilisearch service is not running (port 7700 is not open)",
                "suggestion": "Please ensure Meilisearch service is started"
            }
        try:
            client = Client(self.meilisearch_url)
            client.health()
            return {"status": "healthy"}
        except Exception as e:
            return {
                "status": "unhealthy",
                "details": f"Connection error: {str(e)}",
                "suggestion": "Please check Meilisearch service status and connection configuration"
            }

    def get_api_routes(self, app: FastAPI) -> List[Dict]:
        routes = []
        for route in app.routes:
            if hasattr(route, "methods") and route.path.startswith("/api"):
                routes.append({
                    "path": route.path,
                    "methods": list(route.methods),
                    "name": route.name if hasattr(route, "name") else None,
                    "description": route.description if hasattr(route, "description") else None
                })
        return sorted(routes, key=lambda x: x["path"])

    async def check_all(self, app: FastAPI) -> JSONResponse:
        health_status = {
            "system_status": "healthy",
            "version": "1.1.0",
            "check_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "services": {},
            "suggestions": []
        }

        # Check all services
        services_status = {
            "mongodb": self.check_mongodb(),
            "redis": self.check_redis(),
            "meilisearch": self.check_meilisearch()
        }

        health_status["services"] = services_status

        # If any service is unhealthy, set overall status to degraded and collect suggestions
        if any(service["status"] == "unhealthy" for service in services_status.values()):
            health_status["system_status"] = "degraded"
            for service_name, service_status in services_status.items():
                if service_status["status"] == "unhealthy" and "suggestion" in service_status:
                    health_status["suggestions"].append(
                        f"{service_name}: {service_status['suggestion']}"
                    )

        # Get API route information
        health_status["available_apis"] = self.get_api_routes(app)

        # Always return 200 status code, put service status information in response body
        return JSONResponse(
            content=health_status,
            status_code=200
        ) 