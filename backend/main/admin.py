from django.contrib import admin
from .models import Event, Faculty_Advisor, Organisation, Faculty_Org, Certificate, Faculty_Event, EmailTask, EmailTaskAttempt
from .tasks import send_email_queue

class EventAdmin(admin.ModelAdmin):
  list_display = ['organisation', 'event_name', 'isCDC']
  search_fields = ['organisation', 'event_name', 'isCDC']


class CertificateAdmin(admin.ModelAdmin):
  list_display = ['serial_no', 'faculty_advisor', 'status']
  search_fields = ['serial_no', 'faculty_advisor', 'status']


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
    list_display  = ('recipient_email','subject','latest_status','num_attempts','created_at','updated_at')
    list_filter   = ('latest_status','created_at')
    search_fields = ('recipient_email','subject','task_id')
    readonly_fields = ('task_id','created_at','updated_at')
    inlines       = [EmailTaskAttemptInline]

    def num_attempts(self, obj):
        return obj.attempts.count()
    num_attempts.short_description = 'Attempts'