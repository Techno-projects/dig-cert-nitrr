from django.db import models


class Organisation(models.Model):
  class Meta:
    verbose_name_plural = "Organisations"
  name = models.CharField(unique=True)
  email = models.CharField(unique=True)
  password = models.CharField(max_length=128)

  def __str__(self):
    return f"{self.id}-{self.name}"


def event_data_upload_path(instance, filename):
  return f'events_db/{instance.organisation}/{instance.event_name}/data/{filename}'


def certificate_upload_path(instance, filename):
  return f'events_db/{instance.organisation}/{instance.event_name}/certificate/{filename}'


class Event(models.Model):
  class Meta:
    verbose_name_plural = "Events"
    unique_together = (('organisation', 'event_name'),)

  organisation = models.CharField()
  event_name = models.CharField(max_length=255)
  event_data = models.FileField(upload_to=event_data_upload_path)
  certificate = models.FileField(upload_to=certificate_upload_path)
  coordinates = models.CharField()
  isCDC = models.BooleanField(default=True)
  dispatch = models.CharField()

  def __str__(self):
    return f"{self.id}-{self.organisation}-{self.event_name}"


class Faculty_Advisor(models.Model):
  class Meta:
    verbose_name_plural = "Faculty_Advisors"

  email = models.CharField(unique=True)
  password = models.CharField()
  isCDC = models.BooleanField(default=False)

  def __str__(self):
    return f"{self.id}-{self.email}"


class Faculty_Org(models.Model):
  class Meta:
    verbose_name_plural = "Faculty-Org"
    unique_together = (('organisation', 'faculty'),)

  faculty = models.ForeignKey(Faculty_Advisor, to_field='email', on_delete=models.CASCADE)
  organisation = models.ForeignKey(Organisation, to_field='name', on_delete=models.CASCADE)

  def __str__(self):
    return f"{self.faculty} -> {self.organisation}"


class Certificate(models.Model):
  class Meta:
    verbose_name_plural = "Certificates"
    unique_together = (('faculty_advisor', 'serial_no'),)

  faculty_advisor = models.CharField()
  serial_no = models.CharField(unique=True)
  status = models.CharField()
  certificate_path = models.CharField()


class Faculty_Event(models.Model):
  class Meta:
    verbose_name_plural = "Faculty_Events"
  faculty = models.ForeignKey(Faculty_Advisor, to_field="email", on_delete=models.CASCADE)
  event = models.ForeignKey(Event, on_delete=models.CASCADE)
