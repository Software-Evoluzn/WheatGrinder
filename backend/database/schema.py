from database.connection import get_cursor


def create_tables():

    db, cursor = get_cursor()

    # -------------------------
    # CUSTOMERS
    # -------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            customer_id INT PRIMARY KEY AUTO_INCREMENT,

            name VARCHAR(100) NOT NULL,

            mobile VARCHAR(15),

            email VARCHAR(100) UNIQUE NOT NULL,

            password VARCHAR(255) NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)


    # -------------------------
    # PRODUCT REGISTRATIONS
    # -------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS product_registrations (

            id INT PRIMARY KEY AUTO_INCREMENT,

            customer_id INT NOT NULL,

            customer_name VARCHAR(100) NOT NULL,

            customer_mobile VARCHAR(15),

            customer_email VARCHAR(100),

            product_id VARCHAR(100),

            product_name VARCHAR(150),

            serial_number VARCHAR(100),

            device_id VARCHAR(100),

            model_number VARCHAR(100),

            mac_id VARCHAR(100),

            purchase_date DATE NOT NULL,

            warranty_years INT DEFAULT 1,

            warranty_expiry DATE,

            is_registered BOOLEAN DEFAULT TRUE,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (customer_id)
                REFERENCES customers(customer_id)
        )
    """)


    # -------------------------
    # PASSWORD RESET OTP
    # -------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_otps (

            id INT PRIMARY KEY AUTO_INCREMENT,

            email VARCHAR(100) NOT NULL,

            otp VARCHAR(6) NOT NULL,

            expires_at DATETIME NOT NULL,

            is_used BOOLEAN DEFAULT FALSE,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            INDEX idx_email (email)
        )
    """)


    # -------------------------
    # GRAINS
    # -------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS grains (

            id INT PRIMARY KEY AUTO_INCREMENT,

            name VARCHAR(100),

            value_name VARCHAR(100),

            image VARCHAR(255),

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)


    db.commit()

    cursor.close()
    db.close()

    print("Database tables created successfully.")