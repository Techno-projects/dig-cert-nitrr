# Generated by Django 4.2.10 on 2024-03-21 16:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0041_event_faculties_required'),
    ]

    operations = [
        migrations.AddField(
            model_name='organisation',
            name='unique_name',
            field=models.CharField(default='null'),
            preserve_default=False,
        ),
    ]
