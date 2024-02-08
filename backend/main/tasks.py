from celery import Celery
from main.services.mail import send_email

celery = Celery(__name__, broker='redis://redis:6379/0', backend='redis://redis:6379/0')


@celery.task
def send_email_queue(subject, body, recipients):
  send_email(subject, body, recipients)
