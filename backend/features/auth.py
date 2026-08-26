from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    name = data.get("name")
    mobile = data.get("mobile")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({
            "error": "Name, email and password are required"
        }), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        hashed_password = generate_password_hash(password)

        cursor.execute("""
            INSERT INTO customers
            (name, mobile, email, password)
            VALUES (%s, %s, %s, %s)
        """, (
            name,
            mobile,
            email,
            hashed_password
        ))

        db.commit()

        return jsonify({
            "message": "Customer registered successfully"
        }), 201

    except Exception as e:

        db.rollback()

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        db.close()


@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT customer_id, name, mobile, email, password
        FROM customers
        WHERE email = %s
    """, (email,))

    customer = cursor.fetchone()

    cursor.close()
    db.close()

    if not customer:
        return jsonify({
            "error": "User not found"
        }), 404

    if not check_password_hash(
        customer["password"],
        password
    ):
        return jsonify({
            "error": "Invalid password"
        }), 401

    return jsonify({
        "message": "Login successful",
        "customer_id": customer["customer_id"],
        "name": customer["name"],
        "mobile": customer["mobile"],
        "email": customer["email"]
    }), 200