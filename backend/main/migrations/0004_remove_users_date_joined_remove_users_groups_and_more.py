# Generated by Django 4.2.5 on 2023-10-18 14:04

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0003_users_is_faculty_users_is_org'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='users',
            name='date_joined',
        ),
        migrations.RemoveField(
            model_name='users',
            name='groups',
        ),
        migrations.RemoveField(
            model_name='users',
            name='is_active',
        ),
        migrations.RemoveField(
            model_name='users',
            name='is_admin',
        ),
        migrations.RemoveField(
            model_name='users',
            name='is_anonymous',
        ),
        migrations.RemoveField(
            model_name='users',
            name='is_authenticated',
        ),
        migrations.RemoveField(
            model_name='users',
            name='is_faculty',
        ),
        migrations.RemoveField(
            model_name='users',
            name='is_org',
        ),
        migrations.RemoveField(
            model_name='users',
            name='is_staff',
        ),
        migrations.RemoveField(
            model_name='users',
            name='is_superuser',
        ),
        migrations.RemoveField(
            model_name='users',
            name='last_login',
        ),
        migrations.RemoveField(
            model_name='users',
            name='user_permissions',
        ),
    ]
