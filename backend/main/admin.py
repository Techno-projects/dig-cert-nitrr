from django.contrib import admin
from .models import Event, Faculty_Advisor, Organisation, Faculty_Org, Certificate

# Register your models here.
admin.site.register(Event)
admin.site.register(Faculty_Advisor)
admin.site.register(Organisation)
admin.site.register(Faculty_Org)
admin.site.register(Certificate)