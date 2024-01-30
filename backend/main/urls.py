from django.urls import path, include, re_path
from .views import user_login, register_event, faculty_login, approveL0, get_rows, get_event_details, get_all_org, get_faculties, get_cdc_events, approveL1, get_certificate
from drf_yasg.views import get_schema_view
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
# from .views import MyTokenObtainPairView

# from rest_framework_simplejwt.views import (
#     TokenObtainPairView,
#     TokenRefreshView,
# )


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
    path("user_login", user_login),
    path("faculty_login", faculty_login),
    path("register_event", register_event),
    path("approveL0", approveL0),
    path("get_rows", get_rows),
    path("get_event_details", get_event_details),
    path("get_all_org", get_all_org),
    path("get_faculties", get_faculties),
    path("get_cdc_events", get_cdc_events),
    path("approveL1", approveL1),
    path("get_certificate", get_certificate),
    # path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh')
]
