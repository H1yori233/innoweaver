import os

_PROMPT_FILE_PATHS = {
    'KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT': 'knowledge_extraction_system_prompt',
    'DOMAIN_EXPERT_SYSTEM_PROMPT': 'domain_expert_system_prompt',
    'DOMAIN_EXPERT_SYSTEM_SOLUTION_PROMPT': 'domain_expert_system_solution_prompt',
    'CROSS_DISPLINARY_EXPERT_SYSTEM_PROMPT': 'cross_displinary_expert_system_prompt',
    'QUERY_EXPLAIN_SYSTEM_PROMPT': 'query_explain_system_prompt',
    'INTERDISCIPLINARY_EXPERT_SYSTEM_PROMPT': 'interdisciplinary_expert_system_prompt',
    'PRACTICAL_EXPERT_EVALUATE_SYSTEM_PROMPT': 'practical_expert_evaluate_system_prompt',
    'DRAWING_EXPERT_SYSTEM_PROMPT': 'drawing_expert_system_prompt',
    'HTML_GENERATION_SYSTEM_PROMPT': 'html_generation_system_prompt',
    'INSPIRATION_CHAT_SYSTEM_PROMPT': 'inspiration_chat_system_prompt',
}

def _get_prompt_file_path(prompt_name: str) -> str | None:
    """根据 prompt 名称获取对应的文件名（不含扩展名）。"""
    return _PROMPT_FILE_PATHS.get(prompt_name)

def readfile(name: str):
    file_path = f'prompting/{name}.txt'
    if not os.path.exists(file_path):
        print(f"Warning: Prompt file not found: {file_path}")
        return ""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        return content
    except Exception as e:
        print(f"Error reading prompt file {file_path}: {e}")
        return ""

def get_prompt(prompt_name: str) -> str:
    """
    根据 prompt 逻辑名称动态读取并返回其内容。
    """
    file_name = _get_prompt_file_path(prompt_name)
    if file_name:
        return readfile(file_name)
    else:
        print(f"Warning: Unknown prompt name: {prompt_name}")
        return ""