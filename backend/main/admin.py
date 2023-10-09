from django.contrib import admin
from .models import Events, Faculty_Advisors, Users

# Register your models here.
admin.site.register(Events)
admin.site.register(Faculty_Advisors)
admin.site.register(Users)