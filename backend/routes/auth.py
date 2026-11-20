from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import random

import base64

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

from database import get_cursor, get_db
from services.email_service import send_otp_email

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register_customer():
    data = request.json
    name = data.get('name')
    mobile = data.get('mobile')
    email = data.get('email')
    password = data.get('password')

    hashed_password = generate_password_hash(password)

    try:
        cur = get_cursor()
        cur.execute("""
            INSERT INTO customers(name, mobile, email, password)
            VALUES (%s, %s, %s, %s)
        """, (name, mobile, email, hashed_password))
        get_db().commit()

        new_customer_id = cur.lastrowid  # Naya customer_id nikala

        return jsonify({
            "message": "Customer registered successfully",
            "customer_id": new_customer_id
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login_customer():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        cur = get_cursor()
        cur.execute("SELECT * FROM customers WHERE email=%s", (email,))
        customer = cur.fetchone()

        if customer and check_password_hash(customer['password'], password):
            return jsonify({
                "message": "Login Successful",
                "customer_id": customer['customer_id'],    
                "name": customer['name'],
                "mobile": customer['mobile'],
                "email": customer['email']
            }), 200
        
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# ENABLE BIOMETRIC (Save Public Key & bio_device_id)
# ==========================================
@auth_bp.route('/enable-biometric', methods=['POST'])
def enable_biometric():
    data = request.json
    customer_id = data.get('customer_id')
    public_key = data.get('public_key')
    bio_device_id = data.get('bio_device_id')

    if not all([customer_id, public_key, bio_device_id]):
        return jsonify({"error": "Missing required biometric data"}), 400

    try:
        cur = get_cursor()
        cur.execute("""
            UPDATE customers 
            SET biometric_public_key = %s, bio_device_id = %s 
            WHERE customer_id = %s
        """, (public_key, bio_device_id, customer_id))
        get_db().commit()
        return jsonify({"message": "Biometric enabled successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# BIOMETRIC LOGIN (Verify Signature)
# ==========================================
@auth_bp.route('/biometric-login', methods=['POST'])
def biometric_login():
    data = request.json
    customer_id = data.get('customer_id')
    signature_b64 = data.get('signature')
    payload = data.get('payload')
    bio_device_id = data.get('bio_device_id')

    try:
        cur = get_cursor()
        cur.execute(
            "SELECT * FROM customers WHERE customer_id = %s AND bio_device_id = %s",
            (customer_id, bio_device_id)
        )
        customer = cur.fetchone()

        if not customer or not customer.get('biometric_public_key'):
            return jsonify({"error": "Biometric not configured for this device"}), 401

        pem_key = f"-----BEGIN PUBLIC KEY-----\n{customer['biometric_public_key']}\n-----END PUBLIC KEY-----"
        public_key = serialization.load_pem_public_key(pem_key.encode('utf-8'))

        signature = base64.b64decode(signature_b64)
        public_key.verify(
            signature,
            payload.encode('utf-8'),
            padding.PKCS1v15(),
            hashes.SHA256()
        )

        return jsonify({
            "message": "Biometric Login Successful",
            "customer_id": customer['customer_id'],
            "name": customer['name'],
            "mobile": customer['mobile'],
            "email": customer['email']
        }), 200

    except Exception as e:
        print("Biometric verification failed:", str(e))
        return jsonify({"error": "Biometric authentication failed"}), 401


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    email = request.json.get('email', '').strip().lower()
    if not email:
        return jsonify({"error": "Email is required."}), 400

    cur = get_cursor()
    cur.execute("SELECT customer_id FROM customers WHERE email = %s", (email,))
    if not cur.fetchone():
        return jsonify({"error": "No account was found with this email."}), 404

    otp = str(random.randint(100000, 999999))
    expires_at = datetime.now() + timedelta(minutes=10)

    cur.execute("UPDATE password_reset_otps SET is_used = TRUE WHERE email = %s AND is_used = FALSE", (email,))
    cur.execute("INSERT INTO password_reset_otps (email, otp, expires_at) VALUES (%s, %s, %s)", (email, otp, expires_at))
    get_db().commit()

    if not send_otp_email(email, otp):
        return jsonify({"error": "Failed to send email."}), 500

    return jsonify({"message": f"OTP sent to '{email}'", "email": email}), 200


@auth_bp.route('/verify-reset-otp', methods=['POST'])
def verify_reset_otp():
    data = request.json
    email = data.get('email', '').strip().lower()
    otp = data.get('otp', '').strip()

    cur = get_cursor()
    cur.execute("""
        SELECT id FROM password_reset_otps
        WHERE email = %s AND otp = %s AND is_used = FALSE AND expires_at > NOW()
        ORDER BY id DESC LIMIT 1
    """, (email, otp))

    if not cur.fetchone():
        return jsonify({"error": "OTP is incorrect or expired."}), 400

    return jsonify({"message": "OTP verified successfully.", "email": email}), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email', '').strip().lower()
    otp = data.get('otp', '').strip()
    new_password = data.get('new_password', '').strip()

    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    cur = get_cursor()
    cur.execute("""
        SELECT id FROM password_reset_otps
        WHERE email = %s AND otp = %s AND is_used = FALSE AND expires_at > NOW()
        ORDER BY id DESC LIMIT 1
    """, (email, otp))
    
    record = cur.fetchone()
    if not record:
        return jsonify({"error": "OTP is incorrect or expired."}), 400

    hashed_pw = generate_password_hash(new_password)
    cur.execute("UPDATE customers SET password = %s WHERE email = %s", (hashed_pw, email))
    cur.execute("UPDATE password_reset_otps SET is_used = TRUE WHERE id = %s", (record['id'],))
    get_db().commit()

    return jsonify({"message": "Password successfully reset."}), 200


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    email = request.json.get('email', '').strip().lower()
    cur = get_cursor()
    
    cur.execute("SELECT customer_id FROM customers WHERE email = %s", (email,))
    if not cur.fetchone():
        return jsonify({"error": "Account not found."}), 404

    cur.execute("""
        SELECT created_at FROM password_reset_otps
        WHERE email = %s AND is_used = FALSE
        ORDER BY id DESC LIMIT 1
    """, (email,))
    last = cur.fetchone()

    if last and (datetime.now() - last['created_at']).total_seconds() < 60:
        return jsonify({"error": "Please wait before requesting another OTP."}), 429

    cur.execute("UPDATE password_reset_otps SET is_used = TRUE WHERE email = %s AND is_used = FALSE", (email,))
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.now() + timedelta(minutes=10)

    cur.execute("INSERT INTO password_reset_otps (email, otp, expires_at) VALUES (%s, %s, %s)", (email, otp, expires_at))
    get_db().commit()

    if not send_otp_email(email, otp):
        return jsonify({"error": "Failed to send email."}), 500

    return jsonify({"message": "New OTP sent."}), 200