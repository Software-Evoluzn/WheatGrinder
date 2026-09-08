import mysql.connector
from config import Config

db = mysql.connector.connect(**Config.DB_CONFIG)
cursor = db.cursor(dictionary = True)

def get_cursor():
    global db , cursor
    try:
        db.ping(reconnect=True , attempts=3,delay=2)
    except Exception:
        db= mysql.connector.connect(**Config.DB_CONFIG)
    cursor = db.cursor(dictionary=True)
    return cursor

def get_db():
    return db