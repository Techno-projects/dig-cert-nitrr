from django.urls import path, include
from .views import test_get, test_post

urlpatterns = [
    path('', test_get),
    path('test_post', test_post),
]