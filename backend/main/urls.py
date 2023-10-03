from django.urls import path, include
from .views import user_registration, user_login

urlpatterns = [
    path("register/", user_registration, name="register-user"),
    path("login/", user_login, name="user-login"),
]
