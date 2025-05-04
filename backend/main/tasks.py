from celery import Celery
from main.services.mail import send_email
from celery.exceptions import MaxRetriesExceededError
from django.utils import timezone
from .models import EmailTaskLog

celery = Celery(__name__, broker='redis://redis:6379/0', backend='redis://redis:6379/0')


@celery.task(
    bind=True,
    default_retry_delay=60,
    max_retries=5,
    rate_limit='6/m',
    autoretry_for=(Exception,),
    retry_backoff=False,
)
def send_email_queue(self, subject, body, recipients):
    recipient = recipients[0] if recipients else "unknown"

    task_log = EmailTaskLog.objects.create(
        subject=subject,
        body=body,
        recipient_email=recipient,
        task_id=self.request.id,
        status='STARTED',
        created_at=timezone.now()
    )

    try:
        send_email(subject, body, recipients)
        task_log.status = 'SUCCESS'
        task_log.completed_at = timezone.now()
        task_log.save()

    except Exception as exc:
        task_log.status = 'FAILED'
        task_log.error_message = str(exc)
        task_log.retries = self.request.retries
        task_log.completed_at = timezone.now()
        task_log.save()

        raise self.retry(exc=exc)