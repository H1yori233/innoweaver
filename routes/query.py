from flask import Blueprint, request, jsonify
import json
import utils.tasks as USER
from utils.auth_utils import token_required
from utils.redis import *

query_bp = Blueprint('solution', __name__)

@query_bp.route('/api/query_solution', methods=['GET'])
def query_solution():
    try:
        solution_id = request.args.get('id', default=1, type=str)
        result = USER.query_solution(solution_id)
        return jsonify(result), 200
    except KeyError:
        return jsonify({"error": "Solution ID is missing"}), 400
    except Exception as e:
        return jsonify({"error": "An error occurred while querying the solution", "details": str(e)}), 500

@query_bp.route('/api/query_paper', methods=['GET'])
def query_paper():
    try:
        paper_id = request.args.get('id', default=1, type=str)
        result = USER.query_paper(paper_id)
        return jsonify(result), 200
    except KeyError:
        return jsonify({"error": "Paper ID is missing"}), 400
    except Exception as e:
        return jsonify({"error": "An error occurred while querying the paper", "details": str(e)}), 500
    
@query_bp.route('/api/user/query_liked_solutions', methods=['POST'])
@token_required
def query_liked_solution(current_user):
    try:
        data = request.json
        solution_ids = data.get('solution_ids', [])
        if not solution_ids or not isinstance(solution_ids, list):
            return jsonify({"error": "Solution IDs are missing or invalid"}), 400
        
        # result = []
        # for solution_id in solution_ids:
        #     is_liked = USER.query_liked_solution(current_user['_id'], solution_id)
        #     result.append({
        #         'solution_id': solution_id,
        #         'isLiked': is_liked
        #     })
        user_id = current_user['_id']
        result = USER.query_liked_solution(user_id, solution_ids)
        return jsonify(result), 200
    except KeyError:
        return jsonify({"error": "Solution ID or User ID is missing"}), 400
    except Exception as e:
        return jsonify({"error": "An error occurred while querying the liked solution", "details": str(e)}), 500
