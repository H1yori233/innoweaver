from flask import Blueprint, request, jsonify
# import rag as RAG
import json
import os
import requests
from io import BytesIO
from PIL import Image
import time
from openai import OpenAI
from dotenv import load_dotenv

# -----------------------------------

# import main as MAIN
import utils.tasks as USER
from utils.auth_utils import token_required
# import utils.tasks.llm as MAIN
import utils.tasks.query_load as QUERY
from utils.tasks.config import *
import utils.tasks.task as TASK
from utils.redis import *

# -----------------------------------

task_bp = Blueprint('query', __name__)

@task_bp.route('/api/knowledge_extraction', methods=['POST'])
@token_required
def knowledge(current_user):
    try:
        data = request.json
        paper = data['paper']
        result = USER.knowledge(current_user, paper)
        return jsonify(result)
    except KeyError as e:
        return jsonify({"error": f"Missing key: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": "An error occurred while processing the knowledge extraction", "details": str(e)}), 500

@task_bp.route('/api/query', methods=['POST'])
@token_required
def query(current_user):
    try:
        data = request.json
        query = data.get('query', '')
        design_doc = data.get('design_doc', '')
        result = USER.query(current_user, query, design_doc)
        print("hello")
        print(result)
        return jsonify(result)
    except KeyError as e:
        return jsonify({"error": f"Missing key: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": "An error occurred while processing the query", "details": str(e)}), 500
    
# 点赞/取消点赞
@task_bp.route('/api/user/like_solution', methods=['POST'])
@token_required
def like_solution(current_user):
    try:
        data = request.json
        solution_id = data['_id']
        response, status_code = USER.like_solution(current_user['_id'], solution_id)
        return jsonify(response), status_code
    except KeyError:
            return jsonify({"error": "Missing solution ID in request data"}), 400
    except Exception as e:
        return jsonify({"error": "An error occurred while liking/unliking the solution", "details": str(e)}), 500
    
@task_bp.route('/api/user/api_key', methods=['POST'])
@token_required
def set_apikey(current_user):
    try:
        data = request.json
        api_key = data['api_key']
        response, status_code = USER.set_apikey(current_user, api_key)
        return jsonify(response), status_code
    except KeyError:
            return jsonify({"error": "Missing api_key in request data"}), 400
    except Exception as e:
        return jsonify({"error": "An error occurred while set api_key", "details": str(e)}), 500
    
# ------------------------------------------------------------------------

@task_bp.route('/api/complete/initialize', methods=['POST'])
@token_required
def initialize_task(current_user):
    data = request.json.get("data", {})
    try:
        task_id = USER.initialize_task(current_user, data)
        return jsonify({"status": "started", "task_id": task_id, "progress": 10})
    except Exception as e:
        delete_task(task_id)
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/rag', methods=['POST'])
@token_required
def rag_step(current_user):
    task_id = request.json.get("task_id")
    try:
        USER.rag_step(current_user, task_id)
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 30})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "RAG step failed", 30)
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/paper', methods=['POST'])
@token_required
def paper_step(current_user):
    data = request.json.get("data", {})
    task_id = request.json.get("task_id")
    try:
        USER.paper_step(current_user, data, task_id)
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 30})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "RAG step failed", 30)
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/example', methods=['POST'])
@token_required
def example_step(current_user):
    data = request.json.get("data", {})
    task_id = request.json.get("task_id")
    try:
        USER.example_step(current_user, data, task_id)
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 50})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "example step failed", 30)
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/domain', methods=['POST'])
@token_required
def domain_step(current_user):
    task_id = request.json.get("task_id")
    try:
        USER.domain_step(current_user, task_id)
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 50})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "Domain step failed", 50)
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/interdisciplinary', methods=['POST'])
@token_required
def interdisciplinary_step(current_user):
    task_id = request.json.get("task_id")
    try:
        USER.interdisciplinary_step(current_user, task_id)
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 70})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "Interdisciplinary step failed", 70)
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/evaluation', methods=['POST'])
@token_required
def evaluation_step(current_user):
    task_id = request.json.get("task_id")
    try:
        USER.evaluation_step(current_user, task_id)
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 90})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "Evaluation step failed", 90)
        print(e)
        return jsonify({"status": "error", "message": str(e)}), 500

# ------------------------------------------------------------------------

@task_bp.route('/api/complete/drawing', methods=['POST'])
@token_required
def drawing_step(current_user):
    task_id = request.json.get("task_id")
    try:
        USER.drawing_step(current_user, task_id)
        return jsonify({"status": "in_progress", "task_id": task_id, "progress": 100})
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "Drawing step failed", 100)
        print("error: ", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

@task_bp.route('/api/complete/final', methods=['POST'])
@token_required
def final_step(current_user):
    task_id = request.json.get("task_id")
    try:
        final_solution = USER.final_step(current_user, task_id)
        return jsonify(final_solution)
    except Exception as e:
        delete_task(task_id)
        update_task_status(task_id, "Final step failed", 100)
        print("error: ", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500
        
# ------------------------------------------------------------------------

@task_bp.route('/api/complete/status/<task_id>', methods=['GET'])
def task_status(task_id):
    task_data = redis_client.get(task_id)
    if task_data:
        return jsonify(json.loads(task_data))
    else:
        return jsonify({"status": "unknown", "progress": 0})
