# Generated by Django 4.2.5 on 2023-10-18 20:16

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0013_alter_events_event_data'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='events',
            unique_together={('organisation', 'event_name')},
        ),
    ]