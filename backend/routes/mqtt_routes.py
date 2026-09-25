from flask import Blueprint , request , jsonify
from mqtt_client import publish_message , subscribe_to_device

mqtt_bp = Blueprint('mqtt_bp' , __name__)


ALLOWED_COMMANDS = {
    "selfCleaningProcess", "startGrinding", "pauseGrinding",
    "previouseGrindingStart", "QRScanned",
    "wheat", "chanaDal", "rice", "ragi", "jowar",
    "bajra", "other", "masala", "fada",
}

# Commands with a value: payload = "command:VALUE"
# (min, max) = allowed range for VALUE
PARAM_COMMANDS = {
    "grindingLevel": (0, 100),
}


def build_message(action, extra):
    """Returns (message, error). Exactly one of them is None."""
    if action in ALLOWED_COMMANDS:
        return action, None

    if action in PARAM_COMMANDS:
        value = (extra or {}).get("value")
        try:
            value = int(value)
        except (TypeError, ValueError):
            return None, f"{action} needs a numeric 'value'"

        low, high = PARAM_COMMANDS[action]
        if not (low <= value <= high):
            return None, f"{action} value must be between {low} and {high}"

        return f"{action}:{value}", None

    return None, f"Invalid action: {action}"



@mqtt_bp.route('/api/mqtt/publish' , methods=['POST'])
def handle_publish():
    data = request.get_json(silent=True) or {}
    
    
    serial_number = data.get('serial_number')
    action = data.get('action')
    sub_topic = data.get('sub_topic' , 'control')
    extra = data.get('payload') if isinstance(data.get('payload'), dict) else {}
    
    if not serial_number:
        return jsonify({
            "success": False, "error": "serial_number is required"
            }), 400
        
    message,error = build_message(action , extra)
    
    if error:
          return jsonify({"success": False, "error": error}), 400
        

    
    
    
    topic = f"{serial_number}/{sub_topic}"
    
  
    subscribe_to_device(serial_number)
    
    if publish_message(topic, message):
        return jsonify({"success": True, "message": f"Published '{message}' to {topic}"}), 200
    return jsonify({"success": False, "error": "Failed to publish MQTT message"}), 500
