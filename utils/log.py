import json
import logging
from logging.handlers import RotatingFileHandler
import os
from pathlib import Path
from .config import LOG_DIR, LOG_FILE, LOG_FORMAT, LOG_MAX_BYTES, LOG_BACKUP_COUNT

# Create log directory
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# Configure logger
logger = logging.getLogger("innoweaver")
logger.setLevel(logging.INFO)

# Create file handler
file_handler = RotatingFileHandler(
    log_dir / "app.log",
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5,
    encoding='utf-8'
)

# Create console handler
console_handler = logging.StreamHandler()

# Set log format
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Add handlers to logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Keep original RAG results logging functionality
def save_rag_results_to_log(rag_results):
    with open('./test/rag_results.log', 'w') as file:
        file.write('')

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
            file.write('\n')  # Add newline to ensure each result is on a separate line