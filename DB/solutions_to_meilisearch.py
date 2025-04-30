from meilisearch import Client
from pymongo import MongoClient
from bson.objectid import ObjectId
import asyncio
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.async_meilisearch import AsyncMeilisearchClient

# 连接 MongoDB
client = MongoClient('mongodb://localhost:27017/')

# 选择或创建 user_management_db 数据库
db = client['userDB']
users_collection = db['users']
solutions_collection = db['solutions']
paper_DB = client['papersDB']
papers_collection = paper_DB['papersCollection']

# 便于查询
# user_id, item_id, time
solutions_liked_collection = db['solution_liked']
papers_cited_collection = db['paper_cited']
papers_liked_collection = db['paper_liked']

# 列出所有数据库
db_list = client.list_database_names()
print("现有的 MongoDB 数据库：")
for db_name in db_list:
    print(f"- {db_name}")

# ---------------------------------------------------------------------------

def convert_objectid_to_str(data):
    if isinstance(data, dict):
        return {key: convert_objectid_to_str(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(element) for element in data]
    elif not isinstance(data, str):
        return str(data)
    else:
        return data
    
# 同步版本
def sync_update_solutions():
    solutions = solutions_collection.find()
    data = []
    for item in solutions:
        item = convert_objectid_to_str(item)
        data.append(item)
        
    meili_client = Client('http://127.0.0.1:7700')
    index = meili_client.index('solution_id')
    print("同步方式 - 索引统计:", index.get_stats())

    task = index.add_documents(data)
    print("同步方式 - 任务结果:", task)

# 异步版本
async def async_update_solutions():
    solutions = solutions_collection.find()
    data = []
    for item in solutions:
        item = convert_objectid_to_str(item)
        data.append(item)
        
    meili_client = AsyncMeilisearchClient('http://127.0.0.1:7700')
    index = meili_client.index('solution_id')
    
    task = await index.add_documents(data)
    print("异步方式 - 任务结果:", task)

# 运行同步版本
# sync_update_solutions()

# 运行异步版本
async def main():
    await async_update_solutions()

if __name__ == "__main__":
    asyncio.run(main())
