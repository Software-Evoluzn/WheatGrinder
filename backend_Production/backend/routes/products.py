from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, date
from database import get_cursor, get_db

products_bp = Blueprint('products', __name__)

@products_bp.route('/register-product', methods=['POST'])
def register_product():
    try:
        data = request.get_json()
        customer_id = data.get("customer_id")
        product_name = data.get("product_name")
        serial_number = data.get("serial_number")
        model_number = data.get("model_number")
        mac_id = data.get("mac_id")
        purchase_date = data.get("purchase_date")

        if not customer_id or not serial_number or not purchase_date:
            return jsonify({"error": "Missing required fields."}), 400

        cur = get_cursor()
        cur.execute("SELECT id FROM product_registrations WHERE serial_number = %s LIMIT 1", (serial_number,))
        if cur.fetchone():
            return jsonify({"error": "Device already registered.", "serial_number": serial_number}), 409

        purchase_date_obj = datetime.strptime(purchase_date, "%Y-%m-%d")
        warranty_years = 1  
        warranty_expiry = purchase_date_obj + timedelta(days=365 * warranty_years)

        cur.execute("""
            INSERT INTO product_registrations
            (customer_id, product_name, serial_number, model_number, mac_id, purchase_date, warranty_years, warranty_expiry, is_registered)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            customer_id, product_name, serial_number, model_number, mac_id,
            purchase_date_obj.date(), warranty_years, warranty_expiry.date(), True
        ))
        get_db().commit()

        return jsonify({
            "message": "Product Registered Successfully",
            "serial_number": serial_number,
            "purchase_date": str(purchase_date_obj.date()),
            "warranty_expiry": str(warranty_expiry.date())
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@products_bp.route('/warranty/<serial_number>', methods=['GET'])
def check_warranty(serial_number):
    try:
        cur = get_cursor()
        cur.execute("""
            SELECT
                pr.product_name,
                pr.serial_number,
                COALESCE(pr.model_number, 'N/A') AS model_number,
                COALESCE(pr.mac_id, 'N/A') AS mac_id,
                c.name AS customer_name,
                c.mobile AS customer_mobile,
                pr.purchase_date,
                pr.warranty_expiry
            FROM product_registrations pr
            LEFT JOIN customers c ON pr.customer_id = c.customer_id
            WHERE pr.serial_number = %s
            ORDER BY pr.id DESC LIMIT 1
        """, (serial_number,))

        result = cur.fetchone()
        if not result:
            return jsonify({"status": "error", "message": "No warranty found for this serial number"}), 404

        result["purchase_date"] = str(result["purchase_date"])
        result["warranty_expiry"] = str(result["warranty_expiry"])
        
        today = date.today()
        expiry = date.fromisoformat(result["warranty_expiry"])
        result["status"] = "active" if expiry >= today else "expired"

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500