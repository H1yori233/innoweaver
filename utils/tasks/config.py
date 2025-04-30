from pymongo import MongoClient
from bson.objectid import ObjectId
from utils.config import MONGODB, API
import json
from typing import Optional, Dict, Any

# 使用主配置文件中的 MongoDB 配置
uri = f"mongodb://{MONGODB['username']}:{MONGODB['password']}@{MONGODB['host']}:{MONGODB['port']}/?authSource={MONGODB['auth_db']}"
client = MongoClient(uri)

# 选择或创建数据库
db = client['userDB']
users_collection = db['users']
solutions_collection = db['solutions']
paper_DB = client['papersDB']
papers_collection = paper_DB['papersCollection']

# 便于查询的集合
solutions_liked_collection = db['solution_liked']
papers_cited_collection = db['paper_cited']
papers_liked_collection = db['paper_liked']

# 使用主配置文件中的用户类型和密钥
ALLOWED_USER_TYPES = API['allowed_user_types']
SECRET_KEY = API['secret_key']

def convert_objectid_to_str(data):
    if isinstance(data, dict):
        return {key: convert_objectid_to_str(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(element) for element in data]
    elif not isinstance(data, str):
        return str(data)
    else:
        return data

def solution_eval(solution: Any) -> Optional[Dict[str, Any]]:
    """
    解析和验证解决方案数据
    
    Args:
        solution: 要解析的解决方案数据，可以是字符串或字典
        
    Returns:
        Dict[str, Any]: 解析后的解决方案字典
        None: 如果解析失败
    """
    if isinstance(solution, str):
        try:
            # 尝试 JSON 解析
            return json.loads(solution)
        except json.JSONDecodeError:
            try:
                # 尝试 Python eval 解析
                result = eval(solution)
                if isinstance(result, dict):
                    return result
                return None
            except Exception as e:
                print(f"解析失败: {e}")
                return None
    elif isinstance(solution, dict):
        return solution
    else:
        print(f"solution 类型不支持: {type(solution)}")
        return None