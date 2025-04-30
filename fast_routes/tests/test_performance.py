from locust import HttpUser, task, between, events
import json
import time
from pathlib import Path
from datetime import datetime
import os

# 创建日志目录
log_dir = Path("fast_routes/tests/log")
log_dir.mkdir(parents=True, exist_ok=True)

# 测试数据
TEST_USER = {
    "email": "test_user@example.com",
    "password": "test123"
}

def log_request(request_type, name, response_time, response_length, response, exception=None):
    """记录请求日志"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_file = log_dir / f"performance_test_{datetime.now().strftime('%Y%m%d')}.log"
    
    with open(log_file, "a", encoding="utf-8") as f:
        log_entry = {
            "timestamp": timestamp,
            "request_type": request_type,
            "name": name,
            "response_time": response_time,
            "response_length": response_length,
            "status_code": response.status_code if response else None,
            "exception": str(exception) if exception else None,
            "response_text": response.text if response else None
        }
        f.write(f"{json.dumps(log_entry, ensure_ascii=False)}\n")

# 注册事件处理器
@events.request.add_listener
def request_handler(request_type, name, response_time, response_length, response, exception=None, **kwargs):
    log_request(request_type, name, response_time, response_length, response, exception)

class APIUser(HttpUser):
    wait_time = between(1, 2)
    token = None

    def on_start(self):
        """每个用户开始时执行登录"""
        self.login()

    def login(self):
        """用户登录并获取 token"""
        with self.client.post(
            "/api/login",
            json=TEST_USER,
            headers={"Content-Type": "application/json"},
            catch_response=True
        ) as response:
            if response.status_code == 200:
                result = response.json()
                self.token = result.get("token")
                response.success()
            else:
                response.failure(f"Login failed: {response.status_code}")

    @task(1)
    def view_gallery(self):
        """浏览 gallery，与前端 fetchGallery 保持一致"""
        for page in range(1, 4):
            with self.client.get(
                f"/api/gallery?page={page}",
                headers={"Content-Type": "application/json"},
                catch_response=True
            ) as response:
                if response.status_code == 200:
                    response.success()
                else:
                    response.failure(f"Gallery view failed: {response.status_code}")

    @task(2)
    def query_solutions(self):
        """查询解决方案"""
        solution_ids = [
            "675b3d1c82ba215b12b5cf6f",
            "67245d8394ffc23355f79716",
            "6704f7c4015fee53d0935188"
        ]
        for solution_id in solution_ids:
            with self.client.get(
                f"/api/query_solution/{solution_id}",
                headers={"Content-Type": "application/json"},
                catch_response=True
            ) as response:
                if response.status_code == 200:
                    response.success()
                else:
                    response.failure(f"Solution query failed: {response.status_code}")

    @task(3)
    def user_operations(self):
        """用户相关操作，与前端 fetchLoadSolutions/fetchLoadLikedSolutions 保持一致"""
        if not self.token:
            return

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }

        # 加载用户的解决方案
        with self.client.get(
            "/api/user/load_solutions?page=1",  # 与前端路径保持一致
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Load solutions failed: {response.status_code}")

        # 加载用户点赞的解决方案
        with self.client.get(
            "/api/user/load_liked_solutions?page=1",  # 与前端路径保持一致
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Load liked solutions failed: {response.status_code}")

    @task(4)
    def like_solution(self):
        """点赞解决方案"""
        if not self.token:
            return

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }

        solution_id = "675b3d1c82ba215b12b5cf6f"
        with self.client.post(
            f"/api/user/like_solution",  # 修改为正确的路径
            json={"_id": solution_id},  # 使用 JSON 请求体
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Like solution failed: {response.status_code}")

    # 暂时注释掉 task.py 相关的测试
    """
    @task(5)
    def submit_query(self):
        # 任务相关的测试暂时注释掉
        pass
    """ 

def generate_summary():
    """生成测试摘要"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    summary_file = log_dir / f"performance_summary_{timestamp}.txt"
    
    with open(summary_file, "w", encoding="utf-8") as f:
        f.write(f"Performance Test Summary\n")
        f.write(f"Generated at: {datetime.now()}\n")
        f.write("="*50 + "\n\n")
        
        # 分析最新的日志文件
        latest_log = max(log_dir.glob("performance_test_*.log"), key=os.path.getctime)
        
        # 统计信息
        stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "avg_response_time": 0,
            "response_times": []
        }
        
        with open(latest_log, "r", encoding="utf-8") as log:
            for line in log:
                entry = json.loads(line)
                stats["total_requests"] += 1
                if entry.get("exception") is None:
                    stats["successful_requests"] += 1
                else:
                    stats["failed_requests"] += 1
                if entry.get("response_time"):
                    stats["response_times"].append(entry["response_time"])
        
        if stats["response_times"]:
            stats["avg_response_time"] = sum(stats["response_times"]) / len(stats["response_times"])
        
        # 写入统计信息
        f.write("Request Statistics:\n")
        f.write(f"Total Requests: {stats['total_requests']}\n")
        f.write(f"Successful Requests: {stats['successful_requests']}\n")
        f.write(f"Failed Requests: {stats['failed_requests']}\n")
        f.write(f"Average Response Time: {stats['avg_response_time']:.2f}ms\n")

if __name__ == "__main__":
    # 在测试结束时生成摘要
    events.test_stop.add_listener(lambda environment: generate_summary()) 