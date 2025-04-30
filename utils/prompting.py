
def readfile(name: str):
    with open(f'prompting/{name}.txt', 'r', encoding='utf-8') as file:
        content = file.read()
    return content   

KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT = readfile('knowledge_extraction_system_prompt')
DOMAIN_EXPERT_SYSTEM_PROMPT = readfile('domain_expert_system_prompt')
DOMAIN_EXPERT_SYSTEM_SOLUTION_PROMPT = readfile('domain_expert_system_solution_prompt')
CROSS_DISPLINARY_EXPERT_SYSTEM_PROMPT = readfile('cross_displinary_expert_system_prompt')
QUERY_EXPLAIN_SYSTEM_PROMPT = readfile('query_explain_system_prompt')
INTERDISCIPLINARY_EXPERT_SYSTEM_PROMPT = readfile('interdisciplinary_expert_system_prompt')
PRACTICAL_EXPERT_EVALUATE_SYSTEM_PROMPT = readfile('practical_expert_evaluate_system_prompt')
DRAWING_EXPERT_SYSTEM_PROMPT = readfile('drawing_expert_system_prompt')
HTML_GENERATION_SYSTEM_PROMPT = readfile('html_generation_system_prompt')

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
}