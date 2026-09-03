from flask import Blueprint, jsonify
from database import get_cursor

grains_bp = Blueprint('grains', __name__)

@grains_bp.route('/api/grains', methods=['GET'])
def get_grains():
    try:
        cur = get_cursor()
        cur.execute("SELECT id, name, value_name, image FROM grains")
        grains = cur.fetchall()
        return jsonify(grains), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500