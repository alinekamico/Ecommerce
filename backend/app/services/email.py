import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    message = MIMEMultipart("alternative")
    message["Subject"] = "Redefinicao de senha - KAMI CO."
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    message["To"] = to_email

    body = (
        f"Voce solicitou a redefinicao da sua senha.\n\n"
        f"Clique no link abaixo para criar uma nova senha. "
        f"Este link expira em 30 minutos e so pode ser usado uma vez:\n\n"
        f"{reset_link}\n\n"
        f"Se voce nao solicitou isso, ignore este e-mail."
    )
    message.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_APP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, message.as_string())
