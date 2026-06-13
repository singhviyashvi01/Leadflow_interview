"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from leads.auth_views import cookie_token_refresh

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/leads/', include('leads.urls')),
    path("api/reports/", include("reports.urls")),
    path('api/invoices/', include('invoices.urls')),
    path('api/scheduling/', include('scheduling.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/token/refresh/', cookie_token_refresh, name='token-refresh'),
    path('api/pipeline/', include('pipeline.urls')),
]
