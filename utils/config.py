import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Project root directory
ROOT_DIR = Path(__file__).parent.parent

# Log configuration
# LOG_DIR = ROOT_DIR / "logs"
LOG_DIR = ROOT_DIR
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "app.log"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
LOG_BACKUP_COUNT = 5

# Database configuration
MONGODB = {
    "username": os.getenv("MONGO_USER", "CHI2025"),
    "password": os.getenv("MONGO_PASS", "Inlab2024!"),
    "host": os.getenv("MONGO_HOST", "120.55.193.195"),
    "port": int(os.getenv("MONGO_PORT", 27017)),
    "auth_db": os.getenv("MONGO_AUTH_DB", "admin"),
}

# Redis configuration
REDIS = {
    # "host": os.getenv("REDIS_HOST", "localhost"),
    "host": os.getenv("REDIS_HOST", "120.55.193.195"),
    "port": int(os.getenv("REDIS_PORT", 6379)),
    "db": int(os.getenv("REDIS_DB", 0)),
    "password": os.getenv("REDIS_PASSWORD", "Redis2024"),
}

# MeiliSearch configuration
MEILISEARCH = {
    # "host": os.getenv("MEILI_HOST", "http://127.0.0.1:7700"),
    "host": os.getenv("MEILI_HOST", "http://120.55.193.195:7700"),
    "api_key": os.getenv("MEILI_API_KEY", ""),
}

# API configuration
API = {
    "secret_key": os.getenv("SECRET_KEY", "your-secret-key"),
    "token_expire_days": int(os.getenv("TOKEN_EXPIRE_DAYS", 7)),
    "allowed_user_types": ["developer", "designer", "researcher"],
}

# OpenAI configuration
OPENAI = {
    "api_key": os.getenv("OPENAI_API_KEY"),
    "base_url": os.getenv("OPENAI_BASE_URL"),
    "model": os.getenv("OPENAI_MODEL", "gpt-4"),
}

# SM.MS image hosting configuration
SMMS = {
    "api_key": os.getenv("SM_MS_API_KEY"),
    "upload_url": "https://sm.ms/api/v2/upload",
}

# Cache configuration
CACHE = {
    "default_expire": 3600,  # 1 hour
    "solution_expire": 3600 * 24,  # 24 hours
    "user_session_expire": 3600,  # 1 hour
}

# Pagination configuration
PAGINATION = {"default_page_size": 10, "max_page_size": 100}

# Prompt file paths
PROMPT_DIR = ROOT_DIR / "prompting"
PROMPT_FILES = {
    "KNOWLEDGE_EXTRACTION": "knowledge_extraction_system_prompt",
    "DOMAIN_EXPERT": "domain_expert_system_prompt",
    "DOMAIN_EXPERT_SOLUTION": "domain_expert_system_solution_prompt",
    "CROSS_DISPLINARY_EXPERT": "cross_displinary_expert_system_prompt",
    "QUERY_EXPLAIN": "query_explain_system_prompt",
    "INTERDISCIPLINARY_EXPERT": "interdisciplinary_expert_system_prompt",
    "PRACTICAL_EXPERT_EVALUATE": "practical_expert_evaluate_system_prompt",
    "DRAWING_EXPERT": "drawing_expert_system_prompt",
    "HTML_GENERATION": "html_generation_system_prompt",
}

# Test configuration
TEST = {
    "test_user": {
        "email": "test_user@example.com",
        "password": "test123",
        "name": "Test User",
        "user_type": "developer",
    },
    "test_solution_id": "675b3d1c82ba215b12b5cf6f",
}
