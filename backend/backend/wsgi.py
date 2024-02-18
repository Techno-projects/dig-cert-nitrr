"""
WSGI config for backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

if os.environ.get('PROD'): 
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.production')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.dev')

application = get_wsgi_application()
