import json
import logging
from logging.handlers import RotatingFileHandler
import os
from pathlib import Path
from .config import LOG_DIR, LOG_FILE, LOG_FORMAT, LOG_MAX_BYTES, LOG_BACKUP_COUNT

# 创建日志目录
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# 配置日志记录器
logger = logging.getLogger("innoweaver")
logger.setLevel(logging.INFO)

# 创建文件处理器
file_handler = RotatingFileHandler(
    log_dir / "app.log",
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5,
    encoding='utf-8'
)

# 创建控制台处理器
console_handler = logging.StreamHandler()

# 设置日志格式
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# 添加处理器到日志记录器
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# 保留原有的 rag 结果记录功能
def save_rag_results_to_log(rag_results):
    # clean
    with open('./test/rag_results.log', 'w') as file:
        file.write('')

    # format 
    hits = rag_results.get('hits', [])
    for hit in hits:
        target_definition = hit.get('Target Definition', {})
        contributions = hit.get('Contributions', [])
        results = hit.get('Results', {})

        formatted_result = {
            'Target Definition': target_definition,
            'Contributions': contributions,
            'Results': results
        }

        with open('./test/rag_results.log', 'a', encoding='utf-8') as file:
            file.write(json.dumps(formatted_result, ensure_ascii=False, indent=4))
            file.write('\n')  # 添加换行符，确保每个结果独立一行