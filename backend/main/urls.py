from django.urls import path, include, re_path
from .views import user_registration, user_login, register_event, faculty_registration, faculty_login
from drf_yasg.views import get_schema_view
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# schema_view = get_schema_view(
#     openapi. Info(
#         title="Test API",
#         default_version='v1',
#         description="Test description",
#         terms_of_service="https://www.google.com/policies/terms/",
#         contact=openapi.Contact (email="piyush.at.googl@gmail.com"),
#         license=openapi.License (name="BSD License"),
#     ),
#     public=True,
# )

urlpatterns = [
    # re_path(r'^playground/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    # re_path(r'^docs/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema redoc'),
    path("register_user", user_registration),
    path("register_faculty", faculty_registration),
    path("login_user", user_login),
    path("login_faculty", faculty_login),
    path("register_event", register_event),
]
