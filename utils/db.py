from motor.motor_asyncio import AsyncIOMotorClient
from meilisearch import Client
from .config import MONGODB, MEILISEARCH
from .async_meilisearch import AsyncMeilisearchClient

# 异步 MongoDB 客户端
mongo_uri = f"mongodb://{MONGODB['username']}:{MONGODB['password']}@{MONGODB['host']}:{MONGODB['port']}/?authSource={MONGODB['auth_db']}"
mongo_client = AsyncIOMotorClient(mongo_uri)

# 数据库和集合
db = mongo_client['userDB']
users_collection = db['users']
solutions_collection = db['solutions']
papers_db = mongo_client['papersDB']
papers_collection = papers_db['papersCollection']

# 关联集合
solutions_liked_collection = db['solution_liked']
papers_cited_collection = db['paper_cited']
papers_liked_collection = db['paper_liked']

# 同步的 Meilisearch 客户端
meili_client = Client(MEILISEARCH['host'])

# 异步的 Meilisearch 客户端
async_meili_client = AsyncMeilisearchClient(MEILISEARCH['host'], MEILISEARCH['api_key'])

# 修改为同步函数
def get_paper_index():
    return meili_client.index('paper_id')

def get_solution_index():
    return meili_client.index('solution_id')

def get_user_index():
    return meili_client.index('user_id')

# 添加异步函数
async def get_async_paper_index():
    return async_meili_client.index('paper_id')

async def get_async_solution_index():
    return async_meili_client.index('solution_id')

async def get_async_user_index():
    return async_meili_client.index('user_id')

def search_in_meilisearch(query, requirements):
    try:
        search_query = ' '.join(requirements[:4])
        index = meili_client.index('paper_id')
        search_results = index.search(search_query)
        return search_results
    except Exception as e:
        print(f"搜索错误: {str(e)}")
        return {"hits": []}

# 添加异步搜索函数
async def async_search_in_meilisearch(query, requirements):
    try:
        search_query = ' '.join(requirements[:4])
        index = async_meili_client.index('paper_id')
        search_results = await index.search(search_query)
        return search_results
    except Exception as e:
        print(f"异步搜索错误: {str(e)}")
        return {"hits": []}
