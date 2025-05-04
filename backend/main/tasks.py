from celery import Celery
from main.services.mail import send_email
from celery.exceptions import MaxRetriesExceededError
from django.utils import timezone
from .models import EmailTask, EmailTaskAttempt

celery = Celery(__name__, broker='redis://redis:6379/0', backend='redis://redis:6379/0')


@celery.task(
    bind=True,
    rate_limit='6/m',
    default_retry_delay=60,
    max_retries=5,
)
def send_email_queue(self, subject, body, recipients):
    task_obj, created = EmailTask.objects.get_or_create(
        task_id=self.request.id,
        defaults={
            'subject': subject,
            'body': body,
            'recipient_email': recipients[0] if recipients else '',
            'latest_status': 'PENDING',
        }
    )
    attempt_no = task_obj.attempts.count()

    try:
        send_email(subject, body, recipients)

    except Exception as exc:
        EmailTaskAttempt.objects.create(
            task=task_obj,
            attempt_no=attempt_no,
            status='FAILED',
            error=str(exc),
        )

        task_obj.latest_status = 'FAILED'
        task_obj.save(update_fields=['latest_status', 'updated_at'])
        raise self.retry(exc=exc)

    EmailTaskAttempt.objects.create(
        task=task_obj,
        attempt_no=attempt_no,
        status='SUCCESS',
        error='',
    )

    task_obj.latest_status = 'SUCCESS'
    task_obj.save(update_fields=['latest_status', 'updated_at'])