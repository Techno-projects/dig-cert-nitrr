from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import Event, Faculty_Advisor, Organisation, Faculty_Org, Certificate, Faculty_Event, EmailTask, EmailTaskAttempt
from .tasks import send_email_queue

class EventAdmin(admin.ModelAdmin):
  list_display = ['organisation', 'event_name', 'isCDC']
  search_fields = ['organisation', 'event_name', 'isCDC']

@admin.action(description="Set status = 0")
def make_status_zero(modeladmin, request, queryset):
  updated = queryset.update(status=0)
  modeladmin.message_user(
    request,
    f"{updated} certificate(s) status set to 0."
  )


class CertificateAdmin(admin.ModelAdmin):
  list_display = ['serial_no', 'faculty_advisor', 'status']
  search_fields = ['serial_no', 'faculty_advisor', 'status']
  actions = [make_status_zero]


class FacultyOrgAdmin(admin.ModelAdmin):
  list_display = ['faculty', 'organisation']
  # search_fields = ['faculty', 'organisation']

admin.site.register(Event, EventAdmin)
admin.site.register(Faculty_Advisor)
admin.site.register(Organisation)
admin.site.register(Faculty_Org, FacultyOrgAdmin)
admin.site.register(Certificate, CertificateAdmin)
admin.site.register(Faculty_Event)

class EmailTaskAttemptInline(admin.TabularInline):
  model = EmailTaskAttempt
  fields = ('attempt_no','timestamp','status','error')
  readonly_fields = fields
  extra = 0

@admin.register(EmailTask)
class EmailTaskAdmin(admin.ModelAdmin):
    list_display  = (
        'recipient_email',
        'subject',
        'latest_status',
        'num_attempts',
        'created_at',
        'updated_at',
        'retry_button',
    )
    list_filter   = ('latest_status', 'created_at')
    search_fields = ('recipient_email', 'subject', 'task_id')
    readonly_fields = ('task_id', 'created_at', 'updated_at')
    inlines       = [EmailTaskAttemptInline]
    actions       = ['retry_selected']

    def num_attempts(self, obj):
        return obj.attempts.count()
    num_attempts.short_description = 'Attempts'

    def retry_selected(self, request, queryset):
        failed = queryset.filter(latest_status='FAILED')
        for task in failed:
          send_email_queue.apply_async(
            args=[task.subject, task.body, [task.recipient_email]],
            task_id=task.task_id
          )
        self.message_user(request, f"Queued retry for {failed.count()} failed task(s).")
    retry_selected.short_description = "Retry selected failed email tasks"

    def retry_button(self, obj):
        if obj.latest_status == 'FAILED':
            url = reverse('admin:main_emailtask_changelist')
            return format_html(
                '<a class="button" href="{}?action=retry_selected&select_across=0&_selected_action={}">'
                'Retry</a>',
                url, obj.pk
            )
        return '-'
    retry_button.short_description = 'Retry'
    retry_button.allow_tags = True