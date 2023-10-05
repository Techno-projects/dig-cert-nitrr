from django.urls import path, include
from .views import user_registration, user_login, register_event

urlpatterns = [
    path("register", user_registration, name="register-user"),
    path("login", user_login, name="user-login"),
    path("register_event", register_event),
]
