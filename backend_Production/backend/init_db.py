from database import get_cursor, get_db

def init_schema():
    cur = get_cursor()
    db = get_db()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        customer_id INT PRIMARY KEY AUTO_INCREMENT,
        name        VARCHAR(100),
        mobile      VARCHAR(15),
        email       VARCHAR(100) UNIQUE,
        password    VARCHAR(255),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS product_registrations (
        id              INT PRIMARY KEY AUTO_INCREMENT,
        customer_id     INT,
        product_name    VARCHAR(150),
        serial_number   VARCHAR(100),
        model_number    VARCHAR(100),
        mac_id          VARCHAR(100),
        purchase_date   DATE,
        warranty_years  INT DEFAULT 1,
        warranty_expiry DATE,
        is_registered   BOOLEAN DEFAULT TRUE,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS password_reset_otps (
        id         INT PRIMARY KEY AUTO_INCREMENT,
        email      VARCHAR(100) NOT NULL,
        otp        VARCHAR(6)   NOT NULL,
        expires_at DATETIME     NOT NULL,
        is_used    BOOLEAN      DEFAULT FALSE,
        created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS grains (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100),
        value_name VARCHAR(100),
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    db.commit()

    # Insert default grains data
    cur.execute("SELECT COUNT(*) as total FROM grains")
    if cur.fetchone()["total"] == 0:
        grains_data = [
            ("WHEAT", "wheat", "../static/img/wheat.png"),
            ("CHANA DAL", "chana_dal", "../static/img/chana_dal.png"),
            ("RICE", "rice", "../static/img/rice.png"),
            ("RAGI", "ragi", "../static/img/ragi.png"),
            ("JOWAR", "jowar", "../static/img/jowar.png"),
            ("BAJRA", "bajra", "../static/img/bajra.png"),
            ("MASALA", "masala", "../static/img/masala.png")
        ]
        cur.executemany("""
            INSERT INTO grains(name, value_name, image)
            VALUES (%s, %s, %s)
        """, grains_data)
        db.commit()

if __name__ == "__main__":
    init_schema()
    print("Database schema successfully initialized.")