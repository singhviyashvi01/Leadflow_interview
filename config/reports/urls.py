# reports/urls.py

from django.urls import path
from .views import reports_dashboard, reports_summary, set_target

urlpatterns = [
    path("dashboard/", reports_dashboard),
    path("", reports_summary),
    path("set-target/", set_target),
]
