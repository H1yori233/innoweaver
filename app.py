from gevent import monkey
monkey.patch_all()

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from routes import auth_bp, task_bp, query_bp, load_bp, prompts_bp
import os

def create_app():
    __name__ = "innoweaver"
    app = Flask(__name__)
    CORS(app)

    # Celery 配置
    app.config.update(
        broker_url='redis://localhost:6379/1',
        result_backend='redis://localhost:6379/0',
        BASE_URL=os.getenv("BASE_URL")
    )

    # 注册蓝图
    app.register_blueprint(auth_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(query_bp)
    app.register_blueprint(load_bp)
    app.register_blueprint(prompts_bp)

    return app

app = create_app()

@app.route('/hello', methods=['GET'])
def hello():
    return "Hello World!"

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    # app.run(host='0.0.0.0', port=5001, debug=False)
    # app.run(host='0.0.0.0', port=5001, debug=True)
    app.run(host='0.0.0.0', port=5000, debug=True)
    # app.run(host='0.0.0.0', port=5000, debug=False)
