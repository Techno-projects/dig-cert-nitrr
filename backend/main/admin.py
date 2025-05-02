from django.contrib import admin
from .models import Event, Faculty_Advisor, Organisation, Faculty_Org, Certificate, Faculty_Event, EmailTaskLog

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

@admin.register(EmailTaskLog)
class EmailTaskLogAdmin(admin.ModelAdmin):
    list_display = ('recipient_email', 'subject', 'status', 'retries', 'created_at', 'completed_at')
    list_filter = ('status', 'created_at')
    search_fields = ('recipient_email', 'subject', 'task_id')