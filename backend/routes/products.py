import os
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta, date
from fpdf import FPDF
from database import get_cursor, get_db
from mqtt_client import publish_message, subscribe_to_device

products_bp = Blueprint('products', __name__)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'invoices')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------------------------------------------------------------
# HELPER: Automatic Invoice PDF Generator
# ---------------------------------------------------------------
def generate_invoice_pdf(customer_id, product_name, serial_number, mac_id, purchase_date_str, warranty_expiry_str):
    cur = get_cursor()
    cur.execute(
        "SELECT name, email, mobile FROM customers WHERE customer_id = %s LIMIT 1",
        (customer_id,)
    )
    customer = cur.fetchone() or {}
    cust_name = customer.get("name") or f"Customer #{customer_id}"
    cust_email = customer.get("email") or "N/A"
    cust_phone = customer.get("mobile") or "N/A"

    safe_serial = secure_filename(serial_number)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"Invoice_{safe_serial}_{timestamp}.pdf"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    invoice_no = f"INV-{safe_serial.upper()}-{datetime.now().strftime('%y%m%d')}"

    pdf = FPDF()
    pdf.add_page()

    # Header Banner
    pdf.set_fill_color(82, 45, 112)  # #522D70
    pdf.rect(0, 0, 210, 38, 'F')
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_xy(15, 10)
    pdf.cell(0, 10, "EVOLUZN - PRODUCT INVOICE", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_x(15)
    pdf.cell(0, 6, f"Invoice No: {invoice_no}   |   Generated: {datetime.now().strftime('%d-%m-%Y')}", ln=True)

    # Reset text color
    pdf.set_text_color(15, 23, 42)
    pdf.ln(18)

    # Customer Details Section
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "BILLED TO (CUSTOMER DETAILS)", ln=True)
    pdf.set_draw_color(226, 232, 240)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(4)

    pdf.set_font("Helvetica", "", 11)
    pdf.cell(50, 7, "Customer Name:", border=0)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, str(cust_name), ln=True)

    pdf.set_font("Helvetica", "", 11)
    pdf.cell(50, 7, "Phone / Mobile:", border=0)
    pdf.cell(0, 7, str(cust_phone), ln=True)

    pdf.cell(50, 7, "Email:", border=0)
    pdf.cell(0, 7, str(cust_email), ln=True)

    pdf.ln(8)

    # Product & Warranty Details Section
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "PRODUCT & WARRANTY DETAILS", ln=True)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(4)

    rows = [
        ("Product Name", product_name or "Wheat Grinder"),
        ("Serial Number", serial_number),
        ("MAC ID", mac_id or "N/A"),
        ("Date of Purchase", purchase_date_str),
        ("Warranty Period", "1 Year Standard Warranty"),
        ("Warranty Valid Till", warranty_expiry_str),
        ("Registration Status", "VERIFIED & REGISTERED"),
    ]

    for label, val in rows:
        pdf.set_font("Helvetica", "", 11)
        pdf.cell(65, 8, f"{label}:", border=1)
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(115, 8, f"  {val}", border=1, ln=True)

    pdf.ln(15)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(0, 6, "This is a system-generated warranty & registration invoice by Evoluzn.", ln=True, align="C")

    pdf.output(filepath)
    return f"/uploads/invoices/{filename}"


# ---------------------------------------------------------------
# HELPER: DB se customer ka naam nikalo aur device ko MQTT se bhejo
# ---------------------------------------------------------------
def send_register_name(serial_number, customer_id):
    try:
        cur = get_cursor()
        cur.execute(
            "SELECT name FROM customers WHERE customer_id = %s LIMIT 1",
            (customer_id,)
        )
        row = cur.fetchone()

        name = ((row or {}).get("name") or "").strip()
        if not name:
            return False

        topic = f"{serial_number}/control"
        message = f"registeredName:{name}"

        subscribe_to_device(serial_number)
        return bool(publish_message(topic, message))
    except Exception as e:
        print(f"[REGISTER-NAME] ERROR: {e}")
        return False


# ---------------------------------------------------------------
# SERVE / DOWNLOAD GENERATED INVOICE PDF
# ---------------------------------------------------------------
@products_bp.route('/uploads/invoices/<path:filename>', methods=['GET'])
def serve_invoice(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# ---------------------------------------------------------------
# REGISTER PRODUCT (Auto-Generates Invoice PDF)
# ---------------------------------------------------------------
@products_bp.route('/register-product', methods=['POST'])
def register_product():
    try:
        data = request.get_json(silent=True) or {}
        customer_id   = data.get("customer_id")
        product_name  = (data.get("product_name") or "").strip()
        serial_number = (data.get("device_id") or data.get("serial_number") or "").strip()
        model_number  = (data.get("model_number") or "").strip()
        mac_id        = (data.get("mac_id") or "").strip()
        purchase_date = data.get("purchase_date")

        if not customer_id or not serial_number or not purchase_date:
            return jsonify({"error": "Missing required fields (customer_id, serial_number, purchase_date)."}), 400

        cur = get_cursor()
        cur.execute(
            "SELECT id FROM product_registrations WHERE serial_number = %s LIMIT 1",
            (serial_number,)
        )
        if cur.fetchone():
            return jsonify({"error": "Device already registered.", "serial_number": serial_number}), 409

        purchase_date_obj = datetime.strptime(purchase_date, "%Y-%m-%d")
        warranty_years    = 1
        warranty_expiry   = purchase_date_obj + timedelta(days=365 * warranty_years)

        # Automatic PDF Generate karein
        invoice_path = generate_invoice_pdf(
            customer_id=customer_id,
            product_name=product_name,
            serial_number=serial_number,
            mac_id=mac_id,
            purchase_date_str=str(purchase_date_obj.date()),
            warranty_expiry_str=str(warranty_expiry.date()),
        )

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

        mqtt_sent = send_register_name(serial_number, customer_id)

        return jsonify({
            "message": "Product Registered & Invoice Generated Successfully",
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
# LIST ALL PRODUCTS OF A CUSTOMER (Includes invoice_path)
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