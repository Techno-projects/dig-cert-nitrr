# Generated by Django 4.2.5 on 2023-11-13 19:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0034_rename_faculty_events_faculty_event'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='faculty_event',
            options={'verbose_name_plural': 'Faculty_Events'},
        ),
        migrations.AddField(
            model_name='event',
            name='dispatch',
            field=models.CharField(default='CDC'),
            preserve_default=False,
        ),
    ]
