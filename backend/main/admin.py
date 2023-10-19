from django.contrib import admin
from .models import Events, Faculty_Advisors, Users, Faculty_Org

# Register your models here.
admin.site.register(Events)
admin.site.register(Faculty_Advisors)
admin.site.register(Users)
admin.site.register(Faculty_Org)