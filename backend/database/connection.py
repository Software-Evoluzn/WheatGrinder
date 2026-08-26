import mysql.connector
from config import Config


def get_db_connection():

    return mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME
    )


def get_cursor():

    connection = get_db_connection()

    cursor = connection.cursor(dictionary=True)

    return connection, cursor