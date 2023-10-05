from django.db import models

class User(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)


class Events(models.Model):
    class Meta:
        unique_together = (('organisation_code', 'event_name'))
    organisation_code = models.CharField()
    event_name = models.CharField(max_length=255)
    event_data = models.CharField()