from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

from routes.auth import auth_bp
from routes.products import products_bp
from routes.grains import grains_bp
from routes.mqtt_routes import mqtt_bp
from mqtt_client import start_mqtt

from init_db import init_schema

app = Flask(__name__)
CORS(app)

# Initialize SocketIO for Realtime Communication
socketio = SocketIO(app, cors_allowed_origins="*")

print("Initializing database....")

try:
    init_schema()
    print("Database schema initialized successfully")
except Exception as e:
    print("Database initialization failed:", e)


# ============================================================
# REGISTER BLUEPRINTS
# ============================================================

print("Starting MQTT connection...")


mqtt_client = start_mqtt()

if mqtt_client:
    print("MQTT client started successfully")
else:
    print("MQTT client failed to start")

app.register_blueprint(auth_bp)
app.register_blueprint(products_bp)
app.register_blueprint(grains_bp)
app.register_blueprint(mqtt_bp)


# ============================================================
# START FLASK WITH SOCKETIO
# ============================================================

if __name__ == '__main__':
    socketio.run(
        app,
        host="0.0.0.0",
        port=5007,
        debug=True,
        use_reloader=False
    )