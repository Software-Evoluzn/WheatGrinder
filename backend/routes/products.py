import os
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta, date
from database import get_cursor, get_db
from mqtt_client import publish_message, subscribe_to_device

products_bp = Blueprint('products', __name__)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'invoices')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'webp'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ---------------------------------------------------------------
# HELPER: DB se customer ka naam nikalo aur device ko MQTT se bhejo
# Payload format: registeredName:NAME
# ---------------------------------------------------------------
def send_register_name(serial_number, customer_id):
    try:
        cur = get_cursor()
        cur.execute(
            "SELECT * FROM customers WHERE customer_id = %s LIMIT 1",
            (customer_id,)
        )
        row = cur.fetchone() or {}

        name = (
            row.get("name")
            or row.get("customer_name")
            or row.get("full_name")
            or ""
        ).strip()

        if not name:
            print(f"[REGISTER-NAME] No name found for customer {customer_id}")
            return False

        topic = f"{serial_number}/control"
        message = f"registeredName:{name}"

        subscribe_to_device(serial_number)
        return bool(publish_message(topic, message))

    except Exception as e:
        print(f"[REGISTER-NAME] ERROR: {e}")
        return False


# ---------------------------------------------------------------
# SERVE UPLOADED INVOICE FILE
# ---------------------------------------------------------------
@products_bp.route('/uploads/invoices/<path:filename>', methods=['GET'])
def serve_invoice(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# ---------------------------------------------------------------
# REGISTER PRODUCT (Accepts User Uploaded Invoice Image or PDF)
# ---------------------------------------------------------------
@products_bp.route('/register-product', methods=['POST'])
def register_product():
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
        else:
            data = request.get_json(silent=True) or {}

        customer_id   = data.get("customer_id")
        product_name  = (data.get("product_name") or "").strip()
        serial_number = (data.get("device_id") or data.get("serial_number") or "").strip()
        model_number  = (data.get("model_number") or "").strip()
        mac_id        = (data.get("mac_id") or "").strip()
        purchase_date = data.get("purchase_date")

        if not customer_id or not serial_number or not purchase_date:
            return jsonify({
                "error": "Missing required fields (customer_id, serial_number, purchase_date)."
            }), 400

        cur = get_cursor()
        cur.execute(
            "SELECT id FROM product_registrations WHERE serial_number = %s LIMIT 1",
            (serial_number,)
        )
        if cur.fetchone():
            return jsonify({
                "error": "Device already registered.",
                "serial_number": serial_number
            }), 409

        # Save user uploaded invoice (Image or PDF)
        invoice_file = request.files.get('invoice')
        invoice_path = None

        if invoice_file and invoice_file.filename:
            if not allowed_file(invoice_file.filename):
                return jsonify({
                    "error": "Invalid file format. Only JPG, PNG, WEBP, or PDF allowed."
                }), 400

            ext = invoice_file.filename.rsplit('.', 1)[1].lower()
            safe_serial = secure_filename(serial_number)
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"{safe_serial}_{timestamp}.{ext}"

            save_path = os.path.join(UPLOAD_FOLDER, filename)
            invoice_file.save(save_path)
            invoice_path = f"/uploads/invoices/{filename}"

        purchase_date_obj = datetime.strptime(purchase_date, "%Y-%m-%d")
        warranty_years    = 1
        warranty_expiry   = purchase_date_obj + timedelta(days=365 * warranty_years)

        cur.execute("""
            INSERT INTO product_registrations
            (customer_id, product_name, serial_number, model_number, mac_id,
             invoice_path, purchase_date, warranty_years, warranty_expiry, is_registered)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            customer_id, product_name, serial_number, model_number, mac_id,
            invoice_path, purchase_date_obj.date(), warranty_years, warranty_expiry.date(), True
        ))
        get_db().commit()

        # Publish registeredName:NAME to MQTT
        mqtt_sent = send_register_name(serial_number, customer_id)

        return jsonify({
            "message": "Product Registered Successfully",
            "serial_number": serial_number,
            "device_id": serial_number,
            "invoice_path": invoice_path,
            "purchase_date": str(purchase_date_obj.date()),
            "warranty_expiry": str(warranty_expiry.date()),
            "mqtt_published": mqtt_sent
        }), 200

    except Exception as e:
        print(f"[REGISTER] ERROR: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------
# GET LATEST REGISTERED SERIAL NUMBER FOR A CUSTOMER
# ---------------------------------------------------------------
@products_bp.route('/api/products/get-serial', methods=['GET'])
def get_serial():
    customer_id = request.args.get('customer_id')
    if not customer_id:
        return jsonify({"success": False, "error": "customer_id is required"}), 400

    try:
        cur = get_cursor()
        cur.execute("""
            SELECT serial_number FROM product_registrations
            WHERE customer_id = %s
            ORDER BY id DESC LIMIT 1
        """, (customer_id,))
        row = cur.fetchone()
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    if not row:
        return jsonify({"success": False, "error": "No registered product for this customer"}), 404
    return jsonify({"success": True, "serial_number": row["serial_number"]}), 200


# ---------------------------------------------------------------
# LIST ALL PRODUCTS OF A CUSTOMER
# ---------------------------------------------------------------
@products_bp.route('/customer-products/<int:customer_id>', methods=['GET'])
def get_customer_products(customer_id):
    try:
        cur = get_cursor()
        cur.execute("""
            SELECT
                id,
                customer_id,
                product_name,
                serial_number,
                COALESCE(model_number, 'N/A') AS model_number,
                COALESCE(mac_id, 'N/A') AS mac_id,
                invoice_path,
                purchase_date,
                warranty_expiry,
                is_online,
                last_seen
            FROM product_registrations
            WHERE customer_id = %s
            ORDER BY id DESC
        """, (customer_id,))

        devices = cur.fetchall()
        today = date.today()

        for dev in devices:
            dev["purchase_date"]   = str(dev["purchase_date"])
            dev["warranty_expiry"] = str(dev["warranty_expiry"])
            dev["is_active"] = date.fromisoformat(dev["warranty_expiry"]) >= today
            dev["status"] = "online" if dev.get("is_online") else "offline"
            dev["last_seen"] = str(dev["last_seen"]) if dev.get("last_seen") else None

        return jsonify({"status": "success", "devices": devices}), 200

    except Exception as e:
        print(f"[CUSTOMER-PRODUCTS] ERROR: {e}")
        return jsonify({"error": str(e)}), 500