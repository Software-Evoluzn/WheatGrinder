import json
import re
import time
import paho.mqtt.client as mqtt

from database import get_cursor, get_db
from extensions import socketio

MQTT_BROKER = "evoluzn.org"
MQTT_PORT = 18889
MQTT_USERNAME = "evzin_led"
MQTT_PASSWORD = "63I9YhMaXpa49Eb"

global_client = None

device_statuses = {}
cleaning_done_devices = {}

pause_screen_devices = {}
PAUSE_FLAG_TTL = 60



CLEANING_FLAG_TTL = 60  # seconds, isse purana flag ignore hoga


def update_device_status(serial_number, status):
    """DB mein is_online + last_seen update karta hai."""
    try:
        cur = get_cursor()
        cur.execute(
            """
            UPDATE product_registrations
            SET is_online = %s, last_seen = NOW()
            WHERE serial_number = %s
        """,
            (1 if status == "online" else 0, serial_number),
        )
        get_db().commit()
    except Exception as e:
        print(f"[DB] status update failed: {e}")


def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("MQTT connected successfully")
        # Global pattern subscribe to catch status updates (+/#)
        client.subscribe("#")
    else:
        print(f"MQTT connection failed. Error code: {rc}")


def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode("utf-8").strip()
        print(f"MQTT Received | Topic: {msg.topic} | Payload: {payload}")

        clean_payload = payload.strip("{}")
        device_id = None
        message_text = clean_payload

        # Case 1: {device_id:softelF0C052:Self Cleaning is Done...}
        if "device_id:" in clean_payload:
            parts = clean_payload.split(":")
            if len(parts) >= 2:
                device_id = parts[1].strip()
                message_text = (
                    ":".join(parts[2:]).strip()
                    if len(parts) > 2
                    else clean_payload
                )

        # Case 2: {softelF0C052:online} or {softelF0C052:Self Cleaning is Done}
        elif ":" in clean_payload:
            parts = clean_payload.split(":", 1)
            device_id = parts[0].strip()
            message_text = parts[1].strip()

        # Fallback: topic ka first segment (e.g. "softelF0C052/status")
        if not device_id and msg.topic:
            device_id = msg.topic.split("/")[0].strip()

        if not device_id:
            print(f"[MQTT] No device_id for topic {msg.topic}")
            return

        payload_lower = payload.lower()

        is_cleaning_done = (
            "self cleaning is done, please discard contents from collection bowl"
            in payload_lower
            or "discard contents" in payload_lower
        )

        # Sab kuch lowercase mein match karo
        is_pause_screen = "pause button select screen" in payload_lower

        # status ab hamesha defined hai
        if is_pause_screen:
            status = "pause_screen"
        elif is_cleaning_done:
            status = "cleaning_done"
        else:
            status = message_text.lower()

        if is_pause_screen:
            print(f"⏸️ Emitting pause_status_update for {device_id}")
            pause_screen_devices[device_id.lower()] = time.time()
            socketio.emit(
                "pause_status_update",
                {
                    "serial_number": device_id,
                    "status": "pause_screen",
                    "message": payload,
                },
            )

        if is_cleaning_done:
            print(f"✅ Emitting cleaning_status_update for {device_id}")
            cleaning_done_devices[device_id.lower()] = time.time()
            socketio.emit(
                "cleaning_status_update",
                {
                    "serial_number": device_id,
                    "status": "cleaning_done",
                    "message": payload,
                },
            )

        socketio.emit(
            "device_status_update",
            {
                "serial_number": device_id,
                "status": status,
                "message": payload,
            },
        )

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
    global global_client

    if global_client is None:
        print("[MQTT] Client is None. Attempting reconnect...")
        start_mqtt()

    if not (global_client and global_client.is_connected()):
        print("[MQTT] Client not connected")
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


def subscribe_to_device(serial_number):
    if global_client and global_client.is_connected():
        global_client.subscribe(f"{serial_number}/#")
        print(f"Subscribed dynamically to: {serial_number}/#")