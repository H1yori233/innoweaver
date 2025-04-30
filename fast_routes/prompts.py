from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any
from utils.auth_utils import fastapi_token_required, fastapi_validate_input
import utils.prompting as PROMPTING
from pydantic import BaseModel
from .utils import route_handler

class PromptUpdate(BaseModel):
    prompt_name: str
    new_content: str

prompts_router = APIRouter()

_PROMPTS = {
    'KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT': PROMPTING.KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT,
    'DOMAIN_EXPERT_SYSTEM_PROMPT': PROMPTING.DOMAIN_EXPERT_SYSTEM_PROMPT,
    'DOMAIN_EXPERT_SYSTEM_SOLUTION_PROMPT': PROMPTING.DOMAIN_EXPERT_SYSTEM_SOLUTION_PROMPT,
    'CROSS_DISPLINARY_EXPERT_SYSTEM_PROMPT': PROMPTING.CROSS_DISPLINARY_EXPERT_SYSTEM_PROMPT,
    'QUERY_EXPLAIN_SYSTEM_PROMPT': PROMPTING.QUERY_EXPLAIN_SYSTEM_PROMPT,
    'INTERDISCIPLINARY_EXPERT_SYSTEM_PROMPT': PROMPTING.INTERDISCIPLINARY_EXPERT_SYSTEM_PROMPT,
    'PRACTICAL_EXPERT_EVALUATE_SYSTEM_PROMPT': PROMPTING.PRACTICAL_EXPERT_EVALUATE_SYSTEM_PROMPT,
    'DRAWING_EXPERT_SYSTEM_PROMPT': PROMPTING.DRAWING_EXPERT_SYSTEM_PROMPT,
    'HTML_GENERATION_SYSTEM_PROMPT': PROMPTING.HTML_GENERATION_SYSTEM_PROMPT,
}

@prompts_router.get("/prompts")
@route_handler()
async def view_prompts(current_user: Dict[str, Any] = Depends(fastapi_token_required)):
    if current_user['user_type'] != 'developer':
        raise HTTPException(status_code=403, detail='没有权限访问此资源')
    return _PROMPTS

@prompts_router.put("/prompts")
@route_handler()
@fastapi_validate_input(["prompt_name", "new_content"])
async def modify_prompt(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    if current_user['user_type'] != 'developer':
        raise HTTPException(status_code=403, detail='没有权限修改此资源')
    
    if data["prompt_name"] not in _PROMPTS:
        raise HTTPException(status_code=400, detail='无效的提示词名称')
    
    file_name = PROMPTING._PROMPT_FILE_PATHS.get(data["prompt_name"])
    file_path = f'prompting/{file_name}.txt'
    if file_path:
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(data["new_content"])
    _PROMPTS[data["prompt_name"]] = PROMPTING.readfile(file_name)
    return {'message': f'{data["prompt_name"]} 已成功更新'} 