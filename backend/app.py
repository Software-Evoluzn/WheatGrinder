from flask import Flask , request
from flask_cors import CORS
from flask_socketio import SocketIO

from routes.auth import auth_bp
from routes.products import products_bp
from database import get_cursor, get_db
from routes.grains import grains_bp
from routes.mqtt_routes import mqtt_bp
from mqtt_client import start_mqtt , cleaning_done_devices , CLEANING_FLAG_TTL , pause_screen_devices , PAUSE_FLAG_TTL,device_statuses
from init_db import init_schema
from extensions import socketio
from flask_socketio import emit
import time;

from mqtt_client import cleaning_done_devices

app = Flask(__name__)
CORS(app)


socketio.init_app(app, cors_allowed_origins="*", async_mode="threading")



# Register Blueprints first
app.register_blueprint(auth_bp)
app.register_blueprint(products_bp)
app.register_blueprint(grains_bp)
app.register_blueprint(mqtt_bp)


def init_app():
    """Run database initialization and start MQTT once."""
    print("Initializing database....")
    try:
        init_schema()
        print("Database schema initialized successfully")
    except Exception as e:
        print(f"Database initialization failed: {e}")

    print("Starting MQTT connection...")
    mqtt_client = start_mqtt()
    if mqtt_client:
        print("MQTT client started successfully")
    else:
        print("MQTT client failed to start")
        
@socketio.on("get_device_status")
def get_device_status(data):
    sn = ((data or {}).get("serial_number") or "").strip().lower()
    original_sn = (data or {}).get("serial_number")
    print("sejal want to see the data here : " , sn , original_sn)
    device_info = device_statuses.get(sn)

    if device_info:
        print("sejal come oin device info : " , device_info)
        emit(
            "device_status_update",
            {
                "serial_number": original_sn,
                "status": device_info["status"],
                "raw_status": device_info["raw_status"],
                "timestamp": device_info["timestamp"],
            },
            to=request.sid,
        )
    else:
        # Fallback to Database if not found in memory
        print("sejal fall back to database")
        try:
            cur = get_cursor()
            cur.execute(
                "SELECT is_online FROM product_registrations WHERE LOWER(serial_number) = %s",
                (sn,),
            )
            row = cur.fetchone()
            
            db_status = "online" if row and row.get("is_online") == 1 else "offline"
            print("sejal database status : " , db_status)
            
            # Cache in memory
            device_statuses[sn] = {
                "status": db_status,
                "raw_status": db_status,
                "timestamp": time.time(),
            }
            
            emit(
                "device_status_update",
                {
                    "serial_number": original_sn,
                    "status": db_status,
                    "raw_status": db_status,
                },
                to=request.sid,
            )
        except Exception as e:
            print(f"[Socket] DB status lookup failed: {e}")
            emit(
                "device_status_update",
                {
                    "serial_number": original_sn,
                    "status": "offline",
                    "raw_status": "offline",
                },
                to=request.sid,
            )
    
    
@app.route('/', methods=['GET'])
def home():
    return {
        "status": "success",
        "message": "Thermo API is running"
    }, 200   
        
@socketio.on('start_pause')
def start_pause(data):
    sn = ((data or {}).get('serial_number') or '').lower()
    if sn:
        pause_screen_devices.pop(sn, None)  # purana flag hatao


@socketio.on('check_pause')
def check_pause(data):
    sn = ((data or {}).get('serial_number') or '').lower()
    ts = pause_screen_devices.get(sn)
    if ts and (time.time() - ts) < PAUSE_FLAG_TTL:
        emit('pause_status_update',
             {'serial_number': sn, 'status': 'pause_screen'},
             to=request.sid)
    elif ts:
        pause_screen_devices.pop(sn, None)
        
        
@socketio.on('check_cleaning')
def check_cleaning(data):
    sn = (data.get('serial_number') or '').lower()
    ts = cleaning_done_devices.get(sn)

    if ts and (time.time() - ts) < CLEANING_FLAG_TTL:
        emit('cleaning_status_update',
             {'serial_number': sn, 'status': 'cleaning_done'},
             to=request.sid)
    elif ts:
        # flag is stale, remove it
        cleaning_done_devices.pop(sn, None)
        
        
@socketio.on('start_cleaning')
def start_cleaning(data):
    sn = ((data or {}).get('serial_number') or '').lower()
    if sn:
        cleaning_done_devices.pop(sn, None)


# ============================================================
# START FLASK WITH SOCKETIO
# ============================================================

if __name__ == '__main__':
    # Initialize DB & MQTT strictly inside the main process
    init_app()

    socketio.run(
        app,
        host="0.0.0.0",
        port=5007,
        debug=True,
        use_reloader=False  # Keeps single-process execution clean
    )