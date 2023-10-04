from django.urls import path, include
from .views import user_registration, user_login, decode_user

urlpatterns = [
    path("register", user_registration, name="register-user"),
    path("login", user_login, name="user-login"),
    path("decode_user", decode_user, name="decode-user"),
]
