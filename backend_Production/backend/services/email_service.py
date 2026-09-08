import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config

def send_otp_email(to_email, otp):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Password Reset OTP - EVOLUZN INDIA"
        msg["From"]    = Config.GMAIL_USER
        msg["To"]      = to_email

        text_body = f"Hello,\n\nYour Password Reset OTP is: {otp}\n\nValid for 10 minutes.\n- Evoluzn Team"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 20px; text-align: center;">
            <h2 style="color: #0f3460;">EVOLUZN INDIA</h2>
            <p>Your Password Reset OTP is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #533483; letter-spacing: 5px; margin: 20px 0;">{otp}</div>
            <p style="font-size: 12px; color: #777;">This OTP is valid for 10 minutes.</p>
          </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(Config.GMAIL_USER, Config.GMAIL_PASSWORD)
            server.sendmail(Config.GMAIL_USER, to_email, msg.as_string())

        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False