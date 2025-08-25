from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any
from utils.auth_utils import fastapi_token_required, fastapi_validate_input
import utils.prompting as PROMPTING
from pydantic import BaseModel
from .utils import route_handler
import os

class PromptUpdate(BaseModel):
    prompt_name: str
    new_content: str

prompts_router = APIRouter()

@prompts_router.get("/prompts")
@route_handler()
async def view_prompts(current_user: Dict[str, Any] = Depends(fastapi_token_required)):
    if current_user['user_type'] != 'developer':
        raise HTTPException(status_code=403, detail='No permission to access this resource')
    
    current_prompts = {}
    for prompt_name in PROMPTING._PROMPT_FILE_PATHS.keys():
        current_prompts[prompt_name] = PROMPTING.get_prompt(prompt_name)
        
    return current_prompts

@prompts_router.put("/prompts")
@route_handler()
@fastapi_validate_input(["prompt_name", "new_content"])
async def modify_prompt(
    request: Request,
    current_user: Dict[str, Any] = Depends(fastapi_token_required)
):
    data = await request.json()
    prompt_name = data["prompt_name"]
    new_content = data["new_content"]
    
    if current_user['user_type'] != 'developer':
        raise HTTPException(status_code=403, detail='No permission to modify this resource')
    
    if prompt_name not in PROMPTING._PROMPT_FILE_PATHS:
        raise HTTPException(status_code=400, detail='Invalid prompt name')
    
    file_name = PROMPTING._PROMPT_FILE_PATHS.get(prompt_name)
    
    file_path = os.path.join('prompting', f'{file_name}.txt')
    
    try:
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(new_content)
        return {'message': f'{prompt_name} updated successfully'}
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail=f'Cannot find prompt file: {file_path}')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error updating prompt: {e}') 
    