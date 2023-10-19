from django.db import models
# from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, AbstractUser
from .managers import CustomUserManager
from django.utils import timezone

class Users(models.Model):
    class Meta:
        verbose_name_plural = "Organisation Users"
    email = models.CharField(unique=True)
    password = models.CharField(max_length=128)
    
    # is_staff = models.BooleanField(default=False)
    # is_active = models.BooleanField(default=True)
    # date_joined = models.DateTimeField(default=timezone.now)
    # is_admin = models.BooleanField(default=False)
    # is_active = models.BooleanField(default=True)
    # is_superuser = models.BooleanField(default=True)
    # is_anonymous = models.BooleanField(default=False)
    # is_authenticated = models.BooleanField(default=False)

    # is_faculty = models.BooleanField(default=False)
    # is_org = models.BooleanField(default=False)

    # USERNAME_FIELD = "email"
    # REQUIRED_FIELDS = ['username']

    # objects = CustomUserManager()

    # def __str__(self):
    #     return self.email

def event_data_upload_path(instance, filename):
    return f'events_db/{instance.organisation}/{instance.event_name}/{filename}'

def certificate_upload_path(instance, filename):
    return f'certificates/{instance.organisation}/{instance.event_name}/{filename}'

class Events(models.Model):
    class Meta:
        verbose_name_plural = "Events"
        unique_together = (('organisation', 'event_name'),)
        
    organisation = models.CharField()
    event_name = models.CharField(max_length=255)
    event_data = models.FileField(upload_to=event_data_upload_path)
    certificate = models.FileField(upload_to=certificate_upload_path)
    coordinates = models.CharField()

class Faculty_Advisors(models.Model):
    class Meta:
        verbose_name_plural = "Faculty_Advisors"
    
    organisation_code = models.CharField()
    name = models.CharField()
    email = models.CharField(unique=True)
    password = models.CharField()


class Certificates(models.Model):
    class Meta:
        verbose_name_plural = "Certificates"
        unique_together = (('organisation_code', 'event_name', 'participant_email'),)
    
    faculty_advisor = models.CharField()
    organisation_code = models.CharField()
    event_name = models.CharField()
    participant_email = models.CharField()
    status = models.CharField()