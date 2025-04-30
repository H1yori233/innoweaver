from flask import Blueprint, request, jsonify
import json
import utils.tasks as USER
from utils.auth_utils import token_required
import utils.log as LOG

load_bp = Blueprint('load', __name__)

@load_bp.route('/api/user/load_solutions', methods=['GET'])
@token_required
def load_user_solutions(current_user):
    try:
        page = request.args.get('page', default=1, type=int)
        user_solutions = USER.load_solutions(current_user['_id'], page)
        return jsonify(user_solutions), 200
    except Exception as e:
        return jsonify({"error": "An error occurred while loading user solutions", "details": str(e)}), 500

@load_bp.route('/api/user/load_liked_solutions', methods=['GET'])
@token_required
def load_user_liked_solutions(current_user):
    try:
        page = request.args.get('page', default=1, type=int)
        user_solutions = USER.load_liked_solutions(current_user['_id'], page)
        return jsonify(user_solutions), 200
    except Exception as e:
        return jsonify({"error": "An error occurred while loading liked solutions", "details": str(e)}), 500

@load_bp.route('/api/gallery', methods=['GET'])
def gallery():
    try:
        page = request.args.get('page', default=1, type=int)
        solutions = USER.gallery(page)
        return jsonify(solutions), 200
    except Exception as e:
        return jsonify({"error": "An error occurred while loading the gallery", "details": str(e)}), 500

@load_bp.route('/api/logs', methods=['GET'])
@token_required
def get_logs(current_user):
    """获取日志条目"""
    try:
        # 检查用户权限
        if current_user['user_type'] != 'developer':
            return jsonify({"error": "没有权限访问此资源"}), 403
        
        logs = []
        with open(LOG.LOG_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    # 解析日志行
                    parts = line.split(' - ', 3)
                    if len(parts) == 4:
                        timestamp, name, level, message = parts
                        logs.append({
                            'timestamp': timestamp.strip(),
                            'name': name.strip(),
                            'level': level.strip(),
                            'message': message.strip()
                        })
                except Exception:
                    continue
        return jsonify(logs), 200
    except FileNotFoundError:
        return jsonify([]), 200
    except Exception as e:
        return jsonify({"error": "获取日志失败", "details": str(e)}), 500

@load_bp.route('/api/logs/stats', methods=['GET'])
@token_required
def get_log_stats(current_user):
    """获取日志统计信息"""
    try:
        # 检查用户权限
        if current_user['user_type'] != 'developer':
            return jsonify({"error": "没有权限访问此资源"}), 403
        
        stats = {
            'total_logs': 0,
            'error_count': 0,
            'warn_count': 0,
            'info_count': 0,
            'debug_count': 0
        }
        
        try:
            with open(LOG.LOG_FILE, 'r', encoding='utf-8') as f:
                for line in f:
                    stats['total_logs'] += 1
                    if ' ERROR ' in line:
                        stats['error_count'] += 1
                    elif ' WARN ' in line:
                        stats['warn_count'] += 1
                    elif ' INFO ' in line:
                        stats['info_count'] += 1
                    elif ' DEBUG ' in line:
                        stats['debug_count'] += 1
        except FileNotFoundError:
            pass
                    
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": "获取日志统计失败", "details": str(e)}), 500
