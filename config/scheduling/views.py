from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import CalendarEvent, User
from .serializers import CalendarEventSerializer, AttendeeSerializer
import datetime
from django.utils import timezone
 


def _create_meeting_notifications(event, actor, verb):
    """Create a Notification for each attendee (and the organiser if different)."""
    from leads.models import Notification
    recipients = set(event.attendees.all())
    # Also notify the event owner if they're not the actor
    if event.user and event.user != actor:
        recipients.add(event.user)
    for recipient in recipients:
        Notification.objects.create(
            sender=actor,
            receiver=recipient,
            message=f'{verb}: "{event.title}" on {timezone.localtime(event.start_time).strftime("%b %d, %Y at %I:%M %p")}',
            type='meeting',
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_reminders(request):
    """
    Called periodically by the frontend.
    Checks all upcoming events owned by or attended by the current user,
    fires due reminder notifications, and marks them sent to prevent duplicates.
    """
    from leads.models import Notification

    user = request.user
    now = timezone.now()

    # Events the user owns or attends that haven't started yet (within next 24 h)
    window_end = now + datetime.timedelta(hours=24)
    events = CalendarEvent.objects.filter(
        start_time__gte=now,
        start_time__lte=window_end,
    ).filter(
        Q(user=user) | Q(attendees=user)
    ).distinct()

    fired = 0
    for event in events:
        reminders = event.reminders or []
        sent = list(event.sent_reminders or [])

        for offset_minutes in reminders:
            if offset_minutes in sent:
                continue  # already notified for this offset

            reminder_time = event.start_time - datetime.timedelta(minutes=offset_minutes)

            # Fire if we're past the reminder time (with a 2-minute grace window)
            if now >= reminder_time - datetime.timedelta(minutes=2):
                label = (
                    f"{offset_minutes} minutes" if offset_minutes < 60
                    else f"{offset_minutes // 60} hour{'s' if offset_minutes >= 120 else ''}"
                    if offset_minutes < 1440
                    else "1 day"
                )
                Notification.objects.create(
                    sender=event.user,
                    receiver=user,
                    message=f'Reminder: "{event.title}" starts in {label} ({timezone.localtime(event.start_time).strftime("%b %d at %I:%M %p")})',
                    type='meeting',
                )
                sent.append(offset_minutes)
                fired += 1

        if sent != list(event.sent_reminders or []):
            event.sent_reminders = sent
            event.save(update_fields=['sent_reminders'])

    return Response({"fired": fired})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    """Return all users for attendee search/selection."""
    query = request.query_params.get('q', '').strip()
    users = User.objects.all()
    if query:
        from django.db.models import Q
        users = users.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query)
        )
    return Response(AttendeeSerializer(users, many=True).data)

class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CalendarEvent.objects.all().order_by('start_time')
        user_id = self.request.query_params.get('user')
        lead_id = self.request.query_params.get('lead')

        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Conflict detection: check for overlapping events for owner or attendees
            validated = serializer.validated_data
            start = validated.get('start_time')
            end = validated.get('end_time')
            attendee_qs = validated.get('attendee_ids', [])
            attendee_ids = [u.id for u in attendee_qs] if attendee_qs else []
            conflicts = CalendarEvent.objects.filter(
                (Q(user=request.user) | Q(attendees__in=attendee_ids))
            ).filter(start_time__lt=end, end_time__gt=start).distinct()
            if conflicts.exists():
                details = [f"{c.title} ({c.start_time} - {c.end_time})" for c in conflicts[:5]]
                return Response({"detail": "Conflicting events exist.", "conflicts": details}, status=status.HTTP_400_BAD_REQUEST)

            instance = serializer.save(user=request.user)
            _create_meeting_notifications(instance, request.user, 'New meeting scheduled')
            return Response({
                "message": "Event created successfully",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            validated = serializer.validated_data
            new_start = validated.get('start_time', instance.start_time)
            new_end = validated.get('end_time', instance.end_time)
            attendee_qs = validated.get('attendee_ids', None)
            if attendee_qs is None:
                attendee_ids = list(instance.attendees.values_list('id', flat=True))
            else:
                attendee_ids = [u.id for u in attendee_qs]

            conflicts = CalendarEvent.objects.filter(
                (Q(user=instance.user) | Q(attendees__in=attendee_ids))
            ).exclude(id=instance.id).filter(start_time__lt=new_end, end_time__gt=new_start).distinct()
            if conflicts.exists():
                details = [f"{c.title} ({c.start_time} - {c.end_time})" for c in conflicts[:5]]
                return Response({"detail": "Conflicting events exist.", "conflicts": details}, status=status.HTTP_400_BAD_REQUEST)

            updated = serializer.save()
            _create_meeting_notifications(updated, request.user, 'Meeting updated')
            return Response({
                "message": "Event updated successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({
            "message": "Event deleted successfully"
        }, status=status.HTTP_204_NO_CONTENT)