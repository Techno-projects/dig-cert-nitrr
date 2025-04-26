from celery import Celery
from main.services.mail import send_email
from celery.exceptions import MaxRetriesExceededError

celery = Celery(__name__, broker='redis://redis:6379/0', backend='redis://redis:6379/0')


@celery.task(
    rate_limit='6/m',
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 5, 'countdown': 60},
    retry_backoff=False
)
def send_email_queue(subject, body, recipients):
  try:
    send_email(subject, body, recipients)
  except Exception as exc:
    try:
        print(f"Retrying to send email to {recipients} due to: {exc}")
        raise exc
    except MaxRetriesExceededError:
        print(f"Max retries exceeded for sending email to {recipients}. Task failed.")
        raise