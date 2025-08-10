import json
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from meilisearch import Client
from .config import MONGODB, MEILISEARCH, API
from .async_meilisearch import AsyncMeilisearchClient

# MongoDB connection URI
mongo_uri = f"mongodb://{MONGODB['username']}:{MONGODB['password']}@{MONGODB['host']}:{MONGODB['port']}/?authSource={MONGODB['auth_db']}"

# MongoDB client
mongo_client = AsyncIOMotorClient(mongo_uri)

# Database collections
db = mongo_client["userDB"]
users_collection = db["users"]
solutions_collection = db["solutions"]
papers_db = mongo_client["papersDB"]
papers_collection = papers_db["papersCollection"]

# Relationship collections
solutions_liked_collection = db["solution_liked"]
papers_cited_collection = db["paper_cited"]
papers_liked_collection = db["paper_liked"]

# API configuration constants
ALLOWED_USER_TYPES = API["allowed_user_types"]
SECRET_KEY = API["secret_key"]

# Meilisearch clients
meili_client = Client(MEILISEARCH["host"])
async_meili_client = AsyncMeilisearchClient(MEILISEARCH["host"], MEILISEARCH["api_key"])


# Meilisearch index functions
def get_paper_index():
    return meili_client.index("paper_id")


def get_solution_index():
    return meili_client.index("solution_id")


def get_user_index():
    return meili_client.index("user_id")


# Async index functions
async def get_async_paper_index():
    return async_meili_client.index("paper_id")


async def get_async_solution_index():
    return async_meili_client.index("solution_id")


async def get_async_user_index():
    return async_meili_client.index("user_id")


def search_in_meilisearch(query, requirements):
    try:
        search_query = " ".join(requirements[:4])
        index = meili_client.index("paper_id")
        search_results = index.search(search_query)
        return search_results
    except Exception as e:
        print(f"搜索错误: {str(e)}")
        return {"hits": []}


# Async search functions
async def async_search_in_meilisearch(query, requirements):
    try:
        search_query = " ".join(requirements[:4])
        index = async_meili_client.index("paper_id")
        search_results = await index.search(search_query)
        return search_results
    except Exception as e:
        print(f"异步搜索错误: {str(e)}")
        return {"hits": []}


# Utility functions moved from tasks/config.py
def convert_objectid_to_str(data):
    """Convert MongoDB ObjectId to string recursively"""
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
    Parse and validate solution data

    Args:
        solution: Solution data to parse, can be string or dict

    Returns:
        Dict[str, Any]: Parsed solution dictionary
        None: If parsing fails
    """
    if isinstance(solution, str):
        try:
            # Try JSON parsing
            return json.loads(solution)
        except json.JSONDecodeError:
            try:
                # Try Python eval parsing
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
