from flask import Flask
from flask_cors import CORS

from database.schema import create_tables

app = Flask(__name__)

CORS(app)


# Create database tables
create_tables()




if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )