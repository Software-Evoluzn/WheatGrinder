from flask import Flask
from flask_cors import CORS

from routes.auth import auth_bp
from routes.products import products_bp
from routes.grains import grains_bp

app = Flask(__name__)
CORS(app)

# Register Feature Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(products_bp)
app.register_blueprint(grains_bp)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5007, debug=True)