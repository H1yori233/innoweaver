from flask import Blueprint, request, jsonify
from utils.auth_utils import token_required
import utils.prompting as PROMPTING

prompts_bp = Blueprint('prompts', __name__)

_PROMPTS = {
    'KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT' : PROMPTING.KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT,
    'DOMAIN_EXPERT_SYSTEM_PROMPT': PROMPTING.DOMAIN_EXPERT_SYSTEM_PROMPT,
    'DOMAIN_EXPERT_SYSTEM_SOLUTION_PROMPT': PROMPTING.DOMAIN_EXPERT_SYSTEM_SOLUTION_PROMPT,
    'CROSS_DISPLINARY_EXPERT_SYSTEM_PROMPT': PROMPTING.CROSS_DISPLINARY_EXPERT_SYSTEM_PROMPT,
    'QUERY_EXPLAIN_SYSTEM_PROMPT': PROMPTING.QUERY_EXPLAIN_SYSTEM_PROMPT,
    'INTERDISCIPLINARY_EXPERT_SYSTEM_PROMPT': PROMPTING.INTERDISCIPLINARY_EXPERT_SYSTEM_PROMPT,
    'PRACTICAL_EXPERT_EVALUATE_SYSTEM_PROMPT': PROMPTING.PRACTICAL_EXPERT_EVALUATE_SYSTEM_PROMPT,
    'DRAWING_EXPERT_SYSTEM_PROMPT': PROMPTING.DRAWING_EXPERT_SYSTEM_PROMPT,
    'HTML_GENERATION_SYSTEM_PROMPT': PROMPTING.HTML_GENERATION_SYSTEM_PROMPT,
}

@prompts_bp.route('/api/prompts', methods=['GET'])
@token_required
def view_prompts(current_user):
    if current_user['user_type'] != 'developer':
        return jsonify({'error': '没有权限访问此资源'}), 403
    
    return jsonify(_PROMPTS), 200

@prompts_bp.route('/api/prompts', methods=['PUT'])
@token_required
def modify_prompt(current_user):
    if current_user['user_type'] != 'developer':
        return jsonify({'error': '没有权限修改此资源'}), 403
    
    data = request.json
    prompt_name = data.get('prompt_name')
    new_content = data.get('new_content')
    
    if prompt_name not in _PROMPTS:
        return jsonify({'error': '无效的提示词名称'}), 400
    
    try:
        file_name = PROMPTING._PROMPT_FILE_PATHS.get(prompt_name)
        file_path = f'prompting/{file_name}.txt'
        if file_path:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(new_content)
        _PROMPTS[prompt_name] = PROMPTING.readfile(file_name)
    except Exception as e:
        return jsonify({'error': f'更新失败: {str(e)}'}), 500
    
    return jsonify({'message': f'{prompt_name} 已成功更新'}), 200
