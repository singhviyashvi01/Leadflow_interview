from django.urls import path
from .views import CalendarEventViewSet, user_list, check_reminders

calendar_list = CalendarEventViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

calendar_detail = CalendarEventViewSet.as_view({
    'get': 'retrieve',
    'patch': 'partial_update',
    'delete': 'destroy'
})

urlpatterns = [
    path('events/', calendar_list, name='calendar-events-list'),
    path('events/<int:pk>/', calendar_detail, name='calendar-events-detail'),
    path('users/', user_list, name='calendar-users-list'),
    path('check-reminders/', check_reminders, name='calendar-check-reminders'),
]
