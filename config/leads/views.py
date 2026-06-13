# leads/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from leads.models import Lead, Deal, FollowUp, User, Notification, CalendarEvent
from tasks.models import Task
from leads.serializers import UserProfileSerializer

class DashboardDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role.name if user.role else 'Sales Rep'
        
        if role == 'Sales Manager' or role == 'sales_manager':
            return self.get_manager_data(user)
        else:
            return self.get_rep_data(user)

    def get_manager_data(self, user):
        # Filter leads/deals by team managed by this user
        # For simplicity in this demo, we'll assume manager sees all data
        # In a real app, you'd filter by team: Q(team__manager=user)
        
        leads = Lead.objects.all()
        deals = Deal.objects.all()
        followups = FollowUp.objects.all()

        total_pipeline = deals.aggregate(total=Sum('deal_value'))['total'] or 0
        total_revenue = deals.filter(is_won=True).aggregate(total=Sum('deal_value'))['total'] or 0
        
        total_leads = leads.count()
        won_deals = deals.filter(is_won=True).count()
        conversion_rate = (won_deals / total_leads * 100) if total_leads > 0 else 0

        overdue_followups = followups.filter(
            status='pending', 
            followup_date__lt=timezone.now()
        ).count()

        deals_closing_soon = deals.filter(
            is_won=False, 
            is_lost=False,
            expected_close_date__lte=timezone.now().date() + timedelta(days=30)
        ).count()

        # Team performance summary
        team_members = User.objects.filter(role__name='Sales Rep')
        team_data = []
        for member in team_members:
            member_leads = leads.filter(assigned_to=member)
            member_deals = deals.filter(lead__assigned_to=member)
            member_revenue = member_deals.filter(is_won=True).aggregate(total=Sum('deal_value'))['total'] or 0
            
            team_data.append({
                "name": member.first_name,
                "deals": member_deals.filter(is_won=True).count(),
                "revenue": f"₹{member_revenue:,.0f}",
                "conv": f"{(member_deals.filter(is_won=True).count() / member_leads.count() * 100 if member_leads.count() > 0 else 0):.0f}%",
                "followUps": followups.filter(user=member, status='pending').count()
            })

        # Upcoming Meetings
        upcoming_meetings = CalendarEvent.objects.filter(
            Q(user=user) | Q(attendees=user),
            start_time__gte=timezone.now()
        ).order_by('start_time')[:5]

        meetings_data = [
            {
                "id": m.id,
                "title": m.title,
                "time": f"{timezone.localtime(m.start_time).strftime('%I:%M %p')} - {timezone.localtime(m.end_time).strftime('%I:%M %p')}",
                "date": timezone.localtime(m.start_time).strftime('%b %d, %Y'),
                "start_time": m.start_time.isoformat(),
                "end_time": m.end_time.isoformat(),
                "location": m.location,
            }
            for m in upcoming_meetings
        ]

        # Tasks
        tasks = Task.objects.filter(user=user).order_by('due_date')[:10]
        tasks_data = [
            {
                "id": t.id,
                "task": t.title,
                "due": timezone.localtime(t.due_date).strftime('%b %d, %I:%M %p') if t.due_date else 'No due date',
                "priority": t.priority,
                "completed": t.is_completed
            }
            for t in tasks
        ]

        return Response({
            "stats": [
                { "label": 'TOTAL PIPELINE VALUE', "value": float(total_pipeline/1000000), "prefix": '₹', "suffix": 'M', "trend": '+6%', "positive": True },
                { "label": 'TOTAL REVENUE', "value": float(total_revenue/1000), "prefix": '₹', "suffix": 'k', "trend": '+8%', "positive": True },
                { "label": 'TEAM CONVERSION', "value": round(conversion_rate), "prefix": '', "suffix": '%', "trend": '-2%', "positive": False },
                { "label": 'OVERDUE FOLLOW-UPS', "value": overdue_followups, "prefix": '', "suffix": '', "trend": '5%', "positive": True },
                { "label": 'DEALS CLOSING', "value": deals_closing_soon, "prefix": '', "suffix": '', "trend": '+4%', "positive": True },
            ],
            "teamData": team_data,
            "meetings": meetings_data,
            "tasks": tasks_data
        })

    def get_rep_data(self, user):
        leads = Lead.objects.filter(assigned_to=user)
        deals = Deal.objects.filter(lead__assigned_to=user)
        followups = FollowUp.objects.filter(user=user)

        leads_today = leads.filter(created_at__date=timezone.now().date()).count()
        pipeline_value = deals.aggregate(total=Sum('deal_value'))['total'] or 0
        
        won_deals = deals.filter(is_won=True).count()
        total_leads = leads.count()
        conversion_rate = (won_deals / total_leads * 100) if total_leads > 0 else 0
        
        pending_followups = followups.filter(status='pending').count()

        # Active Leads for Table
        active_leads_list = []
        for lead in leads.order_by('-updated_at')[:5]:
            active_leads_list.append({
                "name": f"{lead.first_name} {lead.last_name}",
                "status": lead.get_status_display(),
                "lastContact": "Just Now" # In real app, calculate from followups
            })

        # Upcoming Meetings
        upcoming_meetings = CalendarEvent.objects.filter(
            Q(user=user) | Q(attendees=user),
            start_time__gte=timezone.now()
        ).order_by('start_time')[:5]

        meetings_data = [
            {
                "id": m.id,
                "title": m.title,
                "time": f"{timezone.localtime(m.start_time).strftime('%I:%M %p')} - {timezone.localtime(m.end_time).strftime('%I:%M %p')}",
                "date": timezone.localtime(m.start_time).strftime('%b %d, %Y'),
                "start_time": m.start_time.isoformat(),
                "end_time": m.end_time.isoformat(),
                "location": m.location,
            }
            for m in upcoming_meetings
        ]

        # Tasks
        tasks = Task.objects.filter(user=user).order_by('due_date')[:10]
        tasks_data = [
            {
                "id": t.id,
                "task": t.title,
                "due": timezone.localtime(t.due_date).strftime('%b %d, %I:%M %p') if t.due_date else 'No due date',
                "priority": t.priority,
                "completed": t.is_completed
            }
            for t in tasks
        ]

        return Response({
            "stats": [
                { "label": 'LEADS ASSIGNED TODAY', "value": leads_today, "prefix": '', "suffix": '', "trend": '+5%', "positive": True },
                { "label": 'MY PIPELINE VALUE', "value": float(pipeline_value/1000), "prefix": '₹', "suffix": 'k', "trend": '+8%', "positive": True },
                { "label": 'PERSONAL CONVERSION', "value": round(conversion_rate), "prefix": '', "suffix": '%', "trend": '-2%', "positive": False },
                { "label": 'PENDING FOLLOW-UPS', "value": pending_followups, "prefix": '0', "suffix": '', "trend": '+1%', "positive": True },
            ],
            "activeLeads": active_leads_list,
            "meetings": meetings_data,
            "tasks": tasks_data
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    """Return all notifications for the current user, newest first."""
    notifications = Notification.objects.filter(
        receiver=request.user
    ).select_related('sender').order_by('-created_at')[:50]

    data = [
        {
            "id": n.id,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
            "sender": f"{n.sender.first_name} {n.sender.last_name}".strip() or n.sender.email,
        }
        for n in notifications
    ]
    unread_count = Notification.objects.filter(receiver=request.user, is_read=False).count()
    return Response({"notifications": data, "unread_count": unread_count})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def notification_mark_read(request, pk):
    """Mark a single notification as read."""
    try:
        n = Notification.objects.get(pk=pk, receiver=request.user)
    except Notification.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    n.is_read = True
    n.save(update_fields=['is_read'])
    return Response({"id": n.id, "is_read": True})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def notifications_mark_all_read(request):
    """Mark all notifications for the current user as read."""
    Notification.objects.filter(receiver=request.user, is_read=False).update(is_read=True)
    return Response({"status": "ok"})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """GET: return current user's profile. PATCH: update profile (multipart allowed).

    Endpoint: /api/leads/auth/me/
    """
    user = request.user
    if request.method == 'GET':
        serializer = UserProfileSerializer(user, context={'request': request})
        return Response({'user': serializer.data})

    # PATCH
    serializer = UserProfileSerializer(user, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        data = serializer.data
        return Response({'message': 'Profile updated', 'user': data})
    return Response({'errors': serializer.errors}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """POST /api/leads/auth/change-password/
    
    Change current user's password.
    """
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password or not new_password:
        return Response({'error': 'Both current and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(current_password):
        return Response({'error': 'Incorrect current password.'}, status=status.HTTP_400_BAD_REQUEST)

    from leads.serializers import PASSWORD_REGEX
    if not PASSWORD_REGEX.match(new_password):
        return Response({
            'error': 'Password must be at least 8 characters and contain an uppercase letter, '
                     'a lowercase letter, a digit, and a special character (@$!%*?&_-#).'
        }, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account_view(request):
    """DELETE /api/leads/auth/delete-account/
    
    Delete the current user account.
    """
    user = request.user
    user.delete()
    return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_overview_data(request):
    """
    GET /api/leads/team/
    Returns dynamic performance statistics for all sales representatives in the team.
    """
    from collections import defaultdict
    import calendar

    # Get all Sales Reps
    reps = User.objects.filter(role__name='Sales Rep')
    
    data = {}
    
    # Calculate days left in the current month
    now = timezone.now()
    last_day = calendar.monthrange(now.year, now.month)[1]
    days_left = max(1, last_day - now.day)
    
    # Define last 6 months list (abbreviated names)
    months_list = []
    for i in range(5, -1, -1):
        m_date = now - timedelta(days=i*30)
        months_list.append(m_date.strftime('%b').upper())
        
    for rep in reps:
        # Leads and Deals
        rep_leads = Lead.objects.filter(assigned_to=rep)
        rep_deals = Deal.objects.filter(lead__assigned_to=rep)
        
        total_leads_count = rep_leads.count()
        total_deals_count = rep_deals.count()
        
        # Won and lost
        won_deals = rep_deals.filter(is_won=True)
        won_count = won_deals.count()
        
        # Win Rate
        win_rate = (won_count / total_deals_count * 100) if total_deals_count > 0 else 0
        
        # Revenue
        won_revenue = won_deals.aggregate(total=Sum('deal_value'))['total'] or 0
        
        # Average Deal Size
        avg_deal_value = won_deals.aggregate(avg=Sum('deal_value'))['avg'] or 0
        avg_deal_val = (avg_deal_value / won_count) if won_count > 0 else 0
        avg_deal_str = f"₹{avg_deal_val/1000:.1f}k" if avg_deal_val >= 1000 else f"₹{avg_deal_val:.0f}"
        
        # Quota target: let's assume a default quota target of $150,000 for everyone
        quota_target = 150000
        quota_pct = int((won_revenue / quota_target) * 100) if quota_target > 0 else 0
        to_target_val = max(0, quota_target - won_revenue)
        to_target_str = "₹0 (Met)" if to_target_val == 0 else f"₹{to_target_val/1000:.1f}k"
        
        # Outbound calls (mock/realistic using FollowUps)
        calls_count = FollowUp.objects.filter(user=rep, status='done').count()
        # Scale it up to look like the UI calls
        calls_str = f"{calls_count:,}" if calls_count > 0 else "0"
        
        # Meetings set
        meetings_count = CalendarEvent.objects.filter(user=rep, event_type='meeting').count()
        
        # Monthly Revenue Trend for the last 6 months
        revenue_by_month = defaultdict(float)
        six_months_ago = now - timedelta(days=180)
        for deal in won_deals.filter(created_at__gte=six_months_ago):
            m_name = deal.created_at.strftime('%b').upper()
            revenue_by_month[m_name] += float(deal.deal_value or 0) / 1000  # in thousands
            
        revenue_data = []
        for m_name in months_list:
            revenue_data.append({
                "name": m_name,
                "value": round(revenue_by_month[m_name], 1)
            })
            
        # Stage Distribution (Discovery, Proposal, Negotiation)
        stage_counts = rep_deals.filter(is_won=False, is_lost=False).values('stage').annotate(count=Count('id'))
        stage_map = {1: 0, 2: 0, 3: 0}
        for sc in stage_counts:
            if sc['stage'] in stage_map:
                stage_map[sc['stage']] = sc['count']
            
        total_open = sum(stage_map.values())
        if total_open > 0:
            stage_data = [
                { "name": 'Proposal', "value": round(stage_map[2] / total_open * 100), "color": '#cbdad8' },
                { "name": 'Negotiation', "value": round(stage_map[3] / total_open * 100), "color": '#0e4d46' },
                { "name": 'Discovery', "value": round(stage_map[1] / total_open * 100), "color": '#5a827d' },
            ]
        else:
            stage_data = [
                { "name": 'Proposal', "value": 35, "color": '#cbdad8' },
                { "name": 'Negotiation', "value": 35, "color": '#0e4d46' },
                { "name": 'Discovery', "value": 30, "color": '#5a827d' },
            ]

        # Active Deals and Pipeline Value (total value of open deals)
        active_deals = rep_deals.filter(is_won=False, is_lost=False)
        active_deals_count = active_deals.count()
        active_deals_value = active_deals.aggregate(total=Sum('deal_value'))['total'] or 0
        pipeline_val_str = f"₹{active_deals_value/1000:.0f}k" if active_deals_value >= 1000 else f"₹{active_deals_value:.0f}"
            
        # Tags
        tags = []
        if quota_pct >= 80:
            tags.append('Elite' if quota_pct >= 100 else 'Top Performer')
        else:
            tags.append('Growth Lead')
            
        if total_deals_count > 10:
            tags.append('Enterprise')
        else:
            tags.append('Strategic' if total_deals_count > 5 else 'SMB')
            
        rep_name = f"{rep.first_name} {rep.last_name}".strip() or rep.email
        
        data[rep_name] = {
            "role": rep.role.name if rep.role else 'Sales Rep',
            "tags": tags,
            "revenue": f"₹{won_revenue:,.0f}",
            "winRate": f"{win_rate:.1f}%",
            "calls": calls_str,
            "meetings": str(meetings_count),
            "quota": min(quota_pct, 120),  # cap at 120 for visual
            "toTarget": to_target_str,
            "daysLeft": days_left,
            "revenueData": revenue_data,
            "stageData": stage_data,
            "avgDeal": avg_deal_str,
            "cycle": "30 Days",
            "retention": "95%",
            "leads": str(total_leads_count),
            "activeDeals": str(active_deals_count),
            "pipelineValue": pipeline_val_str,
        }
        
    return Response(data)

