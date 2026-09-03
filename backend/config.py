import os

class Config:
    GMAIL_USER = os.getenv("GMAIL_USER" , "evoluzn999@gmail.com")
    GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD","euhf nozx wsjy pwbr")
    
    DB_CONFIG = {
        "host" : os.getenv("DB_HOST" , "localhost"),
        "user": os.getenv("DB_USER" , "root"),
        "password":os.getenv("DB_PASSWORD","root"),
        "database": os.getenv("DB_NAME" , "wheat_grinder")
    }
    