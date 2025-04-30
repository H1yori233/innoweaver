import multiprocessing

# Gunicorn 配置
bind = "0.0.0.0:5000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5
errorlog = "error.log"
accesslog = "access.log"
loglevel = "info"