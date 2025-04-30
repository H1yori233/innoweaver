import pytest
import asyncio
from httpx import AsyncClient
import sys
import os
from datetime import datetime
from functools import wraps
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from fast_app import app
import json
from typing import Dict, Any
from pathlib import Path
import uuid

# 创建日志目录
log_dir = Path("test_logs")
log_dir.mkdir(exist_ok=True)

def log_test_output(func):
    """装饰器：记录测试输出到文件"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = log_dir / f"test_output_{timestamp}.txt"
        
        # 记录测试开始
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*50}\n")
            f.write(f"Testing: {func.__name__}\n")
            f.write(f"Time: {datetime.now()}\n")
            f.write(f"{'='*50}\n")
        
        try:
            # 运行测试
            result = await func(*args, **kwargs)
            
            # 记录测试成功
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"\nTest passed ✓\n")
                f.write(f"{'='*50}\n")
            
            return result
        except Exception as e:
            # 记录测试失败
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"\nTest failed ✗\n")
                f.write(f"Error: {str(e)}\n")
                f.write(f"{'='*50}\n")
            raise
    return wrapper

def handle_api_error(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            print(f"API Error in {func.__name__}: {str(e)}")
            raise
    return wrapper

# 测试数据
TEST_USER = {
    "email": "test_user@example.com",
    "name": "Test User",
    "password": "test123",
    "user_type": "developer"
}

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://localhost:5001") as client:
        yield client

# 健康检查测试
@log_test_output
async def test_health_check(client):
    response = await client.get("/health")
    log_response(response)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"

# 认证相关测试
# @log_test_output
# async def test_register(client):
#     test_user = generate_test_user()
#     response = await client.post("/api/register", json=test_user)
#     log_response(response)
#     assert response.status_code == 200
#     data = response.json()
#     assert "user_id" in data

@log_test_output
async def test_login(client):
    # 确保用户已注册
    # await client.post("/api/register", json=TEST_USER)
    
    response = await client.post("/api/login", json={
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    log_response(response)
    assert response.status_code == 200
    data = response.json()
    assert "token" in data

@pytest.fixture
async def auth_headers(client) -> Dict[str, str]:
    """获取认证头，模拟前端 customFetch 的行为"""
    response = await client.post("/api/login", json={
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    assert response.status_code == 200
    token = response.json()["token"]
    
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

# 查询相关测试
@log_test_output
async def test_query_solution(client):
    solution_id = "675b3d1c82ba215b12b5cf6f"
    response = await client.get(f"/api/query_solution/{solution_id}")  # 使用路径参数
    log_response(response)
    assert response.status_code in [200, 404]

@log_test_output
async def test_gallery(client):
    response = await client.get("/api/gallery")
    log_response(response)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

# 用户相关测试
@log_test_output
async def test_load_solutions(client, auth_headers):
    response = await client.get(
        "/api/user/solutions",  # 修改路径
        headers=auth_headers
    )
    log_response(response)
    if response.status_code == 401:
        pytest.skip("Unauthorized access")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

@log_test_output
async def test_load_liked_solutions(client, auth_headers):
    response = await client.get(
        "/api/user/liked",  # 修改路径
        headers=auth_headers
    )
    log_response(response)
    if response.status_code == 401:
        pytest.skip("Unauthorized access")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

# 点赞相关测试
@log_test_output
async def test_like_solution(client, auth_headers):
    solution_id = "675b3d1c82ba215b12b5cf6f"
    response = await client.post(
        f"/api/user/like/{solution_id}",  # 使用路径参数
        headers=auth_headers
    )
    log_response(response)
    if response.status_code == 401:
        pytest.skip("Unauthorized access")
    assert response.status_code == 200

# 提示词相关测试
@log_test_output
async def test_view_prompts(client, auth_headers):
    response = await client.get(
        "/api/prompts/all",  # 修改路径
        headers=auth_headers
    )
    log_response(response)
    if response.status_code == 401:
        pytest.skip("Unauthorized access")
    assert response.status_code in [200, 403]

def log_response(response):
    """记录响应到当前测试日志文件"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"test_output_{timestamp}.txt"
    
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"\nResponse Status: {response.status_code}\n")
        f.write(f"Response Headers: {dict(response.headers)}\n")
        f.write(f"Response Body: {response.text}\n")
        f.write(f"{'-'*50}\n")

# 运行所有测试并生成汇总报告
def generate_test_summary():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    summary_file = log_dir / f"test_summary_{timestamp}.txt"
    
    with open(summary_file, "w", encoding="utf-8") as f:
        f.write("Test Summary Report\n")
        f.write(f"Generated at: {datetime.now()}\n")
        f.write("="*50 + "\n\n")
        
        # 读取所有测试日志
        for log_file in log_dir.glob("test_output_*.txt"):
            with open(log_file, "r", encoding="utf-8") as log:
                f.write(log.read())
                f.write("\n\n")

def generate_test_user():
    """生成唯一的测试用户数据"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "email": f"test_user_{unique_id}@example.com",
        "name": "Test User",
        "password": "test123",
        "user_type": "developer"
    }

def handle_response_error(response):
    """模拟前端的错误处理"""
    if response.status_code == 401:
        raise Exception("Unauthorized: Token has expired or is invalid.")
    if not response.is_success:
        error_details = response.json()
        raise Exception(f"Error: {response.status_code} {response.reason_phrase} - {json.dumps(error_details)}")

if __name__ == "__main__":
    # 运行测试时自动生成汇总报告
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])
    generate_test_summary() 