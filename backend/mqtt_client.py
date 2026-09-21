# mqtt_client.py

import paho.mqtt.client as mqtt

# ============================================================
# MQTT CONFIGURATION
# ============================================================

MQTT_BROKER  = "evoluzn.org"
MQTT_PORT  = 18889
MQTT_USERNAME  = "evzin_led"
MQTT_PASSWORD  = "63I9YhMaXpa49Eb"

MQTT_TOPICS = [
    "device/data",
    "device/status",
]


# ============================================================
# MQTT CALLBACKS
# ============================================================

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("MQTT connected successfully")

        # Subscribe to required topics
        for topic in MQTT_TOPICS:
            client.subscribe(topic)
            print(f"Subscribed to: {topic}")

    else:
        print(f"MQTT connection failed. Error code: {rc}")


def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode("utf-8")

        print(
            f"MQTT Message | "
            f"Topic: {msg.topic} | "
            f"Payload: {payload}"
        )

        # ====================================================
        # Process MQTT data here
        # ====================================================
        # Example:
        #
        # if msg.topic == "device/data":
        #     process_device_data(payload)

    except Exception as e:
        print(f"MQTT message processing error: {e}")


def on_disconnect(client, userdata, rc):
    print("MQTT disconnected")


# ============================================================
# START MQTT
# ============================================================

def start_mqtt():
    client = mqtt.Client()

    # Authentication if required
    if MQTT_USERNAME and MQTT_PASSWORD:
        client.username_pw_set(
            MQTT_USERNAME,
            MQTT_PASSWORD
        )

    # Register callbacks
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect

    try:
        print(
            f"Connecting to MQTT broker "
            f"{MQTT_BROKER}:{MQTT_PORT}..."
        )

        client.connect(
            MQTT_BROKER,
            MQTT_PORT,
            keepalive=60
        )

        # Start MQTT network loop in background
        client.loop_start()

        return client

    except Exception as e:
        print(f"MQTT connection error: {e}")
        return None