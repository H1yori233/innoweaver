import re
import time
import datetime
from bson.objectid import ObjectId
from pymongo import MongoClient
from meilisearch import Client
from utils.tasks.config import *
from utils.tasks.query_load import *
from utils.config import MEILISEARCH
import base64
from utils.db import (
    users_collection, solutions_collection, papers_collection,
    solutions_liked_collection, papers_cited_collection,
    get_paper_index, get_solution_index, get_user_index,
    get_async_paper_index, get_async_solution_index, get_async_user_index
)
import os
import asyncio
import utils.main as MAIN
import utils.log as LOG

# 创建 MeiliSearch 客户端实例
meili_client = Client(MEILISEARCH['host'])

################################################################################

def get_formatted_time():
    # china_tz = timezone(timedelta(hours=8))
    # current_time = datetime.now(china_tz)
    current_time = datetime.datetime.utcnow()
    formatted_time = current_time.strftime('%Y-%m-%dT%H:%M:%SZ')
    return formatted_time

def update_paper_to_meilisearch(paper):
    if paper:
        paper = convert_objectid_to_str(paper)
        index = get_paper_index()
        index.add_documents([paper])

def update_solution_to_meilisearch(solution):
    if solution:
        solution = convert_objectid_to_str(solution)
        index = get_solution_index()
        index.add_documents([solution])

def update_user_to_meilisearch(user):
    if user:
        user = convert_objectid_to_str(user)
        index = get_user_index()
        index.add_documents([user])

# 添加异步版本的更新函数
async def async_update_paper_to_meilisearch(paper):
    if paper:
        paper = convert_objectid_to_str(paper)
        index = await get_async_paper_index()
        await index.add_documents([paper])

async def async_update_solution_to_meilisearch(solution):
    if solution:
        solution = convert_objectid_to_str(solution)
        index = await get_async_solution_index()
        await index.add_documents([solution])

async def async_update_user_to_meilisearch(user):
    if user:
        user = convert_objectid_to_str(user)
        index = await get_async_user_index()
        await index.add_documents([user])

async def delete_solution(solution_id):
    if solution_id:
        solution = await solutions_collection.find_one({'_id': ObjectId(solution_id)})
        if solution:
            delete_result = await solutions_collection.delete_one({'_id': ObjectId(solution_id)})
            cited_result = await papers_cited_collection.delete_many({'solution_id': ObjectId(solution_id)})
            
            # 使用异步方式删除文档
            index = await get_async_solution_index()
            await index.delete_document(str(solution_id))
            
            return True
    return False

## Insert & Delete #############################################################

async def insert_solution(current_user, query, query_analysis_result, final_solution):
    results = []
    user_id = current_user.get('_id')
    solutions = final_solution['solutions']
    for solution in solutions:
        data = {
            "user_id": ObjectId(user_id),
            "query": query,
            "query_analysis_result": query_analysis_result,
            "solution": solution,
            "timestamp": int(time.time())
        }
        result = await solutions_collection.insert_one(data)
        results.append(result.inserted_id)
        
        temp = await solutions_collection.find_one({'_id': result.inserted_id})
        # 使用异步方式更新到Meilisearch
        await async_update_solution_to_meilisearch(temp)
        
    print(f"新文档已插入，ID: {results}")
    return results

async def paper_cited(papers: List[Dict[str, Any]], solution_ids: List[ObjectId]) -> None:
    formatted_time = get_formatted_time()
    
    for paper in papers:
        paper_id = paper.get('_id')
        if paper_id:
            updated_paper = await papers_collection.find_one_and_update(
                {'_id': ObjectId(paper_id)},
                {'$inc': {'Cited': 1}},
                return_document=True
            )      
            # 使用异步方式更新到Meilisearch
            await async_update_paper_to_meilisearch(updated_paper)
            
            for solution_id in solution_ids:
                await papers_cited_collection.insert_one({
                    'paper_id': ObjectId(paper_id),
                    'solution_id': ObjectId(solution_id),
                    'time': formatted_time
                })

async def like_paper(paper, user):
    paper_id = paper.get('_id')
    user_id = user.get('_id')
    if paper_id and user_id:
        updated_paper = await papers_collection.find_one_and_update(
            {'_id': ObjectId(paper_id)},
            {'$inc': {'Liked': 1}},
            return_document=True
        )
        # 使用异步方式更新到Meilisearch
        await async_update_paper_to_meilisearch(updated_paper)
        
        await papers_liked_collection.insert_one({
            'user_id': ObjectId(user_id),
            'paper_id': ObjectId(paper_id),
            'time': get_formatted_time()
        })

async def like_solution(user_id: str, solution_id: str):
    if (solution_id is None) or (user_id is None):
        return {
            'message': '失败',
            'user_id': str(user_id),
            'solution_id': str(solution_id),
        }, 400
      
    is_exist = await query_liked_solution(user_id, [solution_id])
    if is_exist and len(is_exist) > 0 and is_exist[0]['isLiked']:
        result = await solutions_collection.find_one_and_update(
            {'_id': ObjectId(solution_id)},
            {'$inc': {'Liked': -1}},
            return_document=True
        )
        await solutions_liked_collection.delete_one({
            'user_id': ObjectId(user_id),
            'solution_id': ObjectId(solution_id)
        })
        # 使用异步方式更新到Meilisearch
        await async_update_solution_to_meilisearch(result)
        return {
            'message': '取消点赞',
            'user_id': str(user_id),
            'solution_id': str(solution_id),
        }, 200
    
    result = await solutions_collection.find_one_and_update(
        {'_id': ObjectId(solution_id)},
        {'$inc': {'Liked': 1}},
        return_document=True
    )
    await solutions_liked_collection.insert_one({
        'user_id': ObjectId(user_id),
        'solution_id': ObjectId(solution_id),
        'time': get_formatted_time()
    })
    # 使用异步方式更新到Meilisearch
    await async_update_solution_to_meilisearch(result)
    return {
        'message': '点赞成功',
        'user_id': str(user_id),
        'solution_id': str(solution_id),
    }, 200

## API-Key ########################################################################

def validate_apikey(api_key):
    pattern = r'^sk-[A-Za-z0-9_-]{10,}$'
    if re.match(pattern, api_key):
        return True
    return False

async def set_apikey(current_user, api_key, api_url=None, model_name=None):
    try:
        # Use await for the update operation
        update_data = {'api_key': api_key}
        
        if api_url:
            update_data['api_url'] = api_url
            
        if model_name:
            update_data['model_name'] = model_name
            
        result = await users_collection.update_one(
            {'_id': current_user['_id']},
            {'$set': update_data}
        )
        
        updated_user = await users_collection.find_one({'_id': current_user['_id']})
        await async_update_user_to_meilisearch(updated_user)
        
        return {"success": True, "message": "API settings updated successfully"}
    except Exception as e:
        print(f"Error setting API key: {str(e)}")
        return {"success": False, "message": f"Error setting API key: {str(e)}"}

async def test_api_connection(current_user, api_key, api_url=None, model_name=None):
    try:
        # Validate API key format
        if not validate_apikey(api_key):
            LOG.logger.warning(f"Invalid API key format: {api_key[:5]}...")
            return {"success": False, "message": "Invalid API key format"}
            
        # 使用提供的URL或默认值
        base_url = api_url or "https://api.deepseek.com/v1"
        model = model_name or "deepseek-chat"  # 默认模型
        
        LOG.logger.info(f"Testing API connection for user {current_user['email']} with URL: {base_url}, model: {model}")
        
        # Import here to avoid circular import
        from .llm import OpenAIClient
        
        # Create a new client with the provided credentials
        client = OpenAIClient(
            api_key=api_key,
            base_url=base_url,
            model_name=model  # 传递模型名称给客户端
        )
        
        # Basic test prompt
        test_prompt = "Hello, this is a test message. Please respond with 'OK' if you receive this."
        
        # This is a simple test to verify the API connection works
        try:
            response = await asyncio.to_thread(
                lambda: MAIN.simple_completion(
                    test_prompt, 
                    client
                )
            )
            LOG.logger.info(f"API connection test successful for user {current_user['email']}")
            return {"success": True, "message": "API connection successful", "response": response}
        except Exception as api_error:
            error_details = str(api_error)
            # Log the detailed error
            LOG.logger.error(f"API connection test failed for user {current_user['email']}: {error_details}")
            
            # Extract more readable error message if possible
            if "status_code" in error_details and "text" in error_details:
                # This is likely an OpenAI API error with detailed information
                return {
                    "success": False, 
                    "message": "API connection failed", 
                    "error": error_details,
                    "details": {
                        "raw_error": error_details,
                        "provider": "openai" if "openai.com" in str(base_url) else "other"
                    }
                }
            else:
                # Generic error handling
                return {
                    "success": False, 
                    "message": f"API connection failed: {error_details}",
                    "details": {
                        "raw_error": error_details
                    }
                }
            
    except Exception as e:
        error_message = f"Error testing API connection: {str(e)}"
        LOG.logger.error(error_message)
        return {"success": False, "message": error_message}
