import paho.mqtt.client as mqtt
import json
import re

from flask_socketio import SocketIO;
from database import get_cursor, get_db

MQTT_BROKER = "evoluzn.org"
MQTT_PORT = 18889
MQTT_USERNAME = "evzin_led"
MQTT_PASSWORD = "63I9YhMaXpa49Eb"

global_client = None


device_statuses = {}

def update_device_status(serial_number, status):
    """DB mein is_online + last_seen update karta hai."""
    try:
        
        cur = get_cursor()
        cur.execute("""
            UPDATE product_registrations
            SET is_online = %s, last_seen = NOW()
            WHERE serial_number = %s
        """, (1 if status == "online" else 0, serial_number))
        get_db().commit()
    except Exception as e:
        print(f"[DB] status update failed: {e}")

def on_connect(client, userdata, flags, rc , properties = None):
    if rc == 0:
        print("MQTT connected successfully")
        # Global pattern subscribe to catch status updates (+/#)
        client.subscribe("softelF0C043/#")
    else:
        print(f"MQTT connection failed. Error code: {rc}")

def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode("utf-8").strip()
        print(f"MQTT Received | Topic: {msg.topic} | Payload: {payload}")

        # Regex to parse exact pattern: {device_id:online} or {device_id:offline}
        match = re.match(r"^\{([^:]+):(online|offline)\}$", payload, re.IGNORECASE)
        
        if match:
            device_id = match.group(1)
            status = match.group(2).lower()
            
            # Save status locally
            device_statuses[device_id] = status
            update_device_status(device_id , status)
            print(f"⚡ Device Status Matched: {device_id} -> {status.upper()}")

          
            
            # Send real-time event to React Native via SocketIO
            SocketIO.emit('device_status_update', {
                'serial_number': device_id,
                'status': status
            })

    except Exception as e:
        print(f"MQTT message processing error: {e}")

def start_mqtt():
    global global_client
    
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    except AttributeError:
        client = mqtt.Client()
   

    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        client.loop_start()
        global_client = client
        return client
    except Exception as e:
        print(f"MQTT connection error: {e}")
        return None

def publish_message(topic, message):
    """message can be a plain string (device commands) or a dict (sent as JSON)."""
    if not (global_client and global_client.is_connected()):
        print("MQTT client not connected")
        return False
    try:
        payload = message if isinstance(message, str) else json.dumps(message)
        info = global_client.publish(topic, payload, qos=1)
        info.wait_for_publish(timeout=5)
        print(f"MQTT Published | Topic: {topic} | Payload: {payload}")
        return info.is_published()
    except Exception as e:
        print(f"Failed to publish MQTT message: {e}")
        return False

# Function to dynamically subscribe to device topics: serial_number/#
def subscribe_to_device(serial_number):
    if global_client and global_client.is_connected():
        global_client.subscribe(f"{serial_number}/#")
        print(f"Subscribed dynamically to: {serial_number}/#")