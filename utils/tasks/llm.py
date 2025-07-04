import os
import re
from dotenv import load_dotenv
import utils.main as MAIN
import utils.db as RAG
from utils.tasks.config import *
from utils.tasks.config import solution_eval
import utils.tasks.task as TASK
from utils.redis import *
import utils.tasks.query_load as QUERY
import json
import time
import requests
from io import BytesIO
from PIL import Image
import asyncio
import httpx
from utils.image import process_and_upload_image

class OpenAIClient:
    def __init__(self, api_key, base_url, model_name=None):
        self.api_key = api_key
        self.base_url = base_url
        self.model_name = model_name
        
def knowledge(current_user, paper):
    print(f"用户 {current_user['email']} 正在调用 /api/knowledge")
    
    load_dotenv()
    API_KEY = current_user['api_key']
    
    # 优先使用用户设置的URL，如果没有则使用默认值
    BASE_URL = current_user.get('api_url') or "https://api.deepseek.com/v1"
    # 获取用户设置的模型名称（如果有）
    MODEL_NAME = current_user.get('model_name') or "deepseek-chat"
    
    print(API_KEY, ' ', BASE_URL, ' ', MODEL_NAME)
    
    client = OpenAIClient(
        api_key=API_KEY,
        base_url=BASE_URL,
        model_name=MODEL_NAME  # 传递模型名称给客户端
    )
    
    user_type = current_user.get("user_type", "None Type")
    result = MAIN.knowledge_extraction(paper, client, user_type=user_type)
    return result

async def query(current_user, query, design_doc):
    print(f"用户 {current_user['email']} 正在调用 /api/query")
    print(current_user.get("user_type", "None Type"))
    
    load_dotenv()
    API_KEY = current_user['api_key']
    
    # 优先使用用户设置的URL，如果没有则使用默认值
    BASE_URL = current_user.get('api_url') or "https://api.deepseek.com/v1"
    # 获取用户设置的模型名称（如果有）
    MODEL_NAME = current_user.get('model_name') or "deepseek-chat"
    
    print(API_KEY, ' ', BASE_URL, ' ', MODEL_NAME)
    
    client = OpenAIClient(
        api_key=API_KEY,
        base_url=BASE_URL,
        model_name=MODEL_NAME  # 传递模型名称给客户端
    )
    
    user_type = current_user.get("user_type", "None Type")
    result = await MAIN.query_analysis(query, design_doc, client, user_type=user_type)
    return result

# -------------------------------------------------------------------- #

async def initialize_task(current_user, data):
    task_id = await start_task(current_user)
    query_analysis_result = json.loads(data)
    query = query_analysis_result.get("Query")
    await update_task_status(task_id, "Task started", 10, {
        "query_analysis_result": query_analysis_result,
        "query": query
    })
    return task_id

async def rag_step(current_user, task_id):
    task_data = json.loads(await async_redis.get(task_id) or "{}")
    query_analysis_result = task_data.get("result", {}).get("query_analysis_result", {})
    query = task_data.get("result", {}).get("query")
    print(current_user.get("user_type", "None Type"))
    print(query_analysis_result)
    # rag_results = await RAG.search_in_meilisearch(query, query_analysis_result.get("Requirement", ""))
    rag_results = RAG.search_in_meilisearch(query, query_analysis_result.get("Requirement", ""))
    await update_task_status(task_id, "RAG search completed", 30, {"rag_results": rag_results})
    return rag_results

async def paper_step(current_user, data, task_id):
    paper_ids = data
    papers = await asyncio.gather(*[
        QUERY.query_paper(paper_id) for paper_id in paper_ids
    ])
    rag_results = {
        "hits": [{"paper_id": paper_id, "content": paper} 
                for paper_id, paper in zip(paper_ids, papers)]
    }
    await update_task_status(task_id, "Paper processing completed", 30, {"rag_results": rag_results})
    return rag_results

async def example_step(current_user, example_ids, task_id):
    task_data = json.loads(await async_redis.get(task_id) or "{}")
    existing_rag_results = task_data.get("result", {}).get("rag_results", {"hits": []})
    
    if not isinstance(existing_rag_results, dict) or 'hits' not in existing_rag_results:
        existing_rag_results = {"hits": []} # 如果格式不正确，则初始化
    if not isinstance(existing_rag_results['hits'], list):
        existing_rag_results['hits'] = [] # 确保 hits 是一个列表

    solutions = await asyncio.gather(*[
        QUERY.query_solution(str(solution_id)) for solution_id in example_ids
    ])
    new_hits = [
        {"solution_id": str(solution_id), "content": solution} 
        for solution_id, solution in zip(example_ids, solutions) if solution is not None
    ]
    existing_rag_results['hits'].extend(new_hits)
    
    await update_task_status(task_id, "Example solutions added", 35, {"rag_results": existing_rag_results})
    return existing_rag_results

# -------------------------------------------------------------------- #

async def drawing_step(current_user, task_id):
    task_data = json.loads(await async_redis.get(task_id) or "{}")
    query_analysis_result = task_data.get("result", {}).get("query_analysis_result", {})
    final_solution = task_data.get("result", {}).get("final_solution")
    final_solution = solution_eval(final_solution)
    user_type = current_user.get("user_type", "None Type")

    if not final_solution or "solutions" not in final_solution:
        raise ValueError("final_solution 解析失败或不包含 'solutions' 字段")

    target_user = query_analysis_result.get('Target User', 'null')
    
    BASE_URL = os.getenv("DRAW_URL")
    API_KEY = os.getenv("DRAW_API_KEY")
    MODEL_NAME = os.getenv("DRAW_MODEL")
    
    client = OpenAIClient(
        api_key=API_KEY,
        base_url=BASE_URL,
        model_name=MODEL_NAME
    )
    SM_MS_API_KEY = os.getenv("SM_MS_API_KEY")
    
    for i, solution in enumerate(final_solution["solutions"]):
        technical_method = solution.get("Technical Method")
        possible_results = solution.get("Possible Results")
        await update_task_status(task_id, f"Generating image {i+1}/{len(final_solution['solutions'])}...", 80 + (i+1)*10/len(final_solution["solutions"]))
        
        # 生成图片 (Calls the updated drawing_expert_system -> make_image_request)
        image_data = await MAIN.drawing_expert_system(target_user, technical_method, possible_results, client, user_type=user_type)
        try:
            # 处理并上传图片
            image_url, image_name = await process_and_upload_image(image_data['url'], SM_MS_API_KEY)
            final_solution["solutions"][i]["image_url"] = image_url
            final_solution["solutions"][i]["image_name"] = image_name
        except Exception as e:
            print(f"Failed to process image {i}: {e}")
            continue
            
    await update_task_status(task_id, "Image generation completed", 90, {"final_solution": final_solution})
    return final_solution

# -------------------------------------------------------------------- #

async def update_task_status(task_id, status, progress, result=None):
    task_data = json.loads(await async_redis.get(task_id) or "{}")
    
    # 浅层合并（适用于单层数据结构）
    if result:
        existing = task_data.get("result", {})
        existing.update(result)  # 新字段添加/更新，旧字段保留
        task_data["result"] = existing
    
    task_data.update({
        "status": status,
        "progress": progress
    })
    
    await async_redis.setex(task_id, 3600, json.dumps(task_data))

async def start_task(current_user):
    task_id = f"task_{int(time.time())}"
    await async_redis.setex(task_id, 3600, json.dumps({
        "user_id": str(current_user['_id']),
        "status": "started",
        "progress": 0,
        "result": {}
    }))
    return task_id

# -------------------------------------------------------------------- #

async def handle_inspiration_chat(current_user, inspiration_id, new_message, chat_history=None, stream=False):
    print(f"用户 {current_user['email']} 正在调用 /task/inspiration/chat (Stream: {stream})")
    inspiration = await QUERY.query_solution(inspiration_id)
    user_type = current_user.get("user_type", "None Type")
    
    BASE_URL = current_user.get('api_url') or "https://api.deepseek.com/v1"
    MODEL_NAME = current_user.get('model_name') or "deepseek-chat"
    
    client = OpenAIClient(
        api_key=current_user['api_key'],
        base_url=BASE_URL,
        model_name=MODEL_NAME
    )
    
    if stream:
        from fastapi.responses import StreamingResponse
        
        # Get the stream generator from MAIN.inspiration_chat
        stream_generator = await MAIN.inspiration_chat(inspiration, new_message, client, chat_history, user_type=user_type, stream=True)

        # Wrap it for SSE format
        async def sse_wrapper():
            async for chunk in stream_generator:
                 yield f"data: {json.dumps(chunk)}\n\n"

        return StreamingResponse(sse_wrapper(), media_type="text/event-stream")
    else:
        # Call MAIN.inspiration_chat for non-streamed response
        result = await MAIN.inspiration_chat(inspiration, new_message, client, chat_history, user_type=user_type, stream=False)
        return result
