import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from leads.models import User
from scheduling.serializers import CalendarEventSerializer

user = User.objects.first()
print(f"Testing with user: {user.email}")

data = {
    'title': 'Test Event',
    'start_time': '2026-06-14T10:00:00Z',
    'end_time': '2026-06-14T11:00:00Z',
    'all_day': False,
    'location': '',
    'meeting_link': '',
    'description': '',
    'event_type': 'meeting',
    'attendee_ids': [],
    'permissions': {},
    'reminders': [],
    'color': '#0e4d46'
}

serializer = CalendarEventSerializer(data=data)
if serializer.is_valid():
    print("Serializer is valid!")
else:
    print("Serializer errors:", serializer.errors)
