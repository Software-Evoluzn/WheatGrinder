from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from database import get_db

product_registration_bp = Blueprint(
    "product_registration",
    __name__
)


@product_registration_bp.route(
    "/register-product",
    methods=["POST"]
)
def register_product():

    data = request.get_json()

    customer_id = data.get("customer_id")

    customer_name = data.get("customer_name")
    customer_mobile = data.get("customer_mobile")
    customer_email = data.get("customer_email")

    product_name = data.get("product_name")
    serial_number = data.get("serial_number")
    device_id = data.get("device_id")
    model_number = data.get("model_number")
    mac_id = data.get("mac_id")

    purchase_date = data.get("purchase_date")

    if not customer_id:
        return jsonify({
            "error": "Customer ID is required"
        }), 400

    if not product_name:
        return jsonify({
            "error": "Product name is required"
        }), 400

    if not serial_number:
        return jsonify({
            "error": "Serial number is required"
        }), 400

    if not purchase_date:
        return jsonify({
            "error": "Purchase date is required"
        }), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        purchase_date_obj = datetime.strptime(
            purchase_date,
            "%Y-%m-%d"
        )

        # Default warranty = 1 year
        warranty_years = 1

        warranty_expiry = (
            purchase_date_obj +
            timedelta(days=365)
        )

        cursor.execute("""
            INSERT INTO product_registrations (
                customer_id,
                customer_name,
                customer_mobile,
                customer_email,
                product_name,
                serial_number,
                device_id,
                model_number,
                mac_id,
                purchase_date,
                warranty_years,
                warranty_expiry,
                is_registered
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s
            )
        """, (
            customer_id,
            customer_name,
            customer_mobile,
            customer_email,
            product_name,
            serial_number,
            device_id,
            model_number,
            mac_id,
            purchase_date_obj.date(),
            warranty_years,
            warranty_expiry.date(),
            True
        ))

        db.commit()

        return jsonify({
            "message": "Product registered successfully",
            "customer_id": customer_id,
            "product_name": product_name,
            "serial_number": serial_number,
            "warranty_years": warranty_years,
            "warranty_expiry": str(
                warranty_expiry.date()
            ),
            "is_registered": True
        }), 201

    except Exception as e:

        db.rollback()

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        db.close()