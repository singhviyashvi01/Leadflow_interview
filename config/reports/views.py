from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Sum, Q
from decimal import Decimal, InvalidOperation
import datetime

from leads.models import Lead
from pipeline.models import Deal
from reports.serializers import ExecutivePerformanceSerializer
from reports.models import Target


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reports_dashboard(request):

    user = request.user  

    # 🔹 Role-based filtering
    if user.role and user.role.name == "Sales Rep":
        leads = Lead.objects.filter(assigned_to=user)
        deals = Deal.objects.filter(lead__assigned_to=user)
    else:
        leads = Lead.objects.filter(team__manager=user)
        deals = Deal.objects.filter(lead__team__manager=user)

    # 🔹 Summary
    total_revenue = deals.filter(is_won=True).aggregate(
        total=Sum("deal_value")
    )["total"] or 0

    active_leads = leads.count()

    converted = deals.filter(is_won=True).count()
    conversion_rate = (converted / active_leads * 100) if active_leads > 0 else 0

    # 🔹 Monthly revenue (Current Year vs Previous Year)
    from django.utils.timezone import now
    current_year = now().year
    
    monthly_data = []
    for month in range(1, 13):
        month_revenue = deals.filter(
            is_won=True,
            created_at__year=current_year,
            created_at__month=month
        ).aggregate(total=Sum("deal_value"))["total"] or 0

        prev_month_revenue = deals.filter(
            is_won=True,
            created_at__year=current_year - 1,
            created_at__month=month
        ).aggregate(total=Sum("deal_value"))["total"] or 0

        monthly_data.append({
            "month": month,
            "revenue": month_revenue,
            "previous_revenue": prev_month_revenue
        })

    # 🔹 Lead source performance
    source_data = leads.values("source__name").annotate(count=Count("id"))
    total_leads_count = leads.count()

    lead_sources = []
    for src in source_data:
        percentage = (
            src["count"] / total_leads_count * 100
            if total_leads_count > 0 else 0
        )

        lead_sources.append({
            "source": src["source__name"] or "Unknown",
            "percentage": round(percentage, 2)
        })

    # 🔹 Executive performance
    executives = []
    users = leads.values("assigned_to").distinct()

    for u in users:
        if not u["assigned_to"]:
            continue
        user_leads = leads.filter(assigned_to=u["assigned_to"])
        user_deals = deals.filter(
            lead__assigned_to=u["assigned_to"],
            is_won=True
        )

        total = user_leads.count()
        conversions = user_deals.count()

        rate = (conversions / total * 100) if total > 0 else 0

        first_lead = user_leads.first()
        if first_lead and first_lead.assigned_to:
            executives.append({
                "name": first_lead.assigned_to.first_name,
                "total_leads": total,
                "conversions": conversions,
                "conversion_rate": round(rate, 2)
            })

    # 🔹 Invoice & Target metrics for Dashboard alignment
    from leads.models import Invoice
    invoices = Invoice.objects.all()
    if user.role and user.role.name == "Sales Rep":
        invoices = invoices.filter(deal__lead__assigned_to=user)
    elif user.role and user.role.name == "Sales Manager" and user.team:
        invoices = invoices.filter(deal__lead__assigned_to__team=user.team)

    total_invoiced = invoices.aggregate(total=Sum('amount'))['total'] or 0
    paid_amount = invoices.filter(status='PAID').aggregate(total=Sum('amount'))['total'] or 0
    pending_amount = invoices.filter(status='PENDING').aggregate(total=Sum('amount'))['total'] or 0
    overdue_amount = invoices.filter(status='OVERDUE').aggregate(total=Sum('amount'))['total'] or 0

    # Target calculation
    today = datetime.date.today()
    current_month_start = today.replace(day=1)
    if today.month == 1:
        last_month_start = today.replace(year=today.year - 1, month=12, day=1)
    else:
        last_month_start = today.replace(month=today.month - 1, day=1)

    from leads.models import User as _UserModel
    manager_qs = _UserModel.objects.filter(role__name__icontains="manager")
    target_obj = Target.objects.filter(
        user__in=manager_qs,
        month=current_month_start,
    ).order_by('-target_amount').first()

    if target_obj is None:
        target_obj = Target.objects.filter(
            user__in=manager_qs,
            month=last_month_start,
        ).order_by('-target_amount').first()

    target_value = target_obj.target_amount if target_obj else (total_revenue if total_revenue > 0 else 0)

    # Overdue invoices
    overdue_qs = Invoice.objects.filter(status='OVERDUE')
    if user.role and user.role.name == "Sales Rep":
        overdue_qs = overdue_qs.filter(deal__lead__assigned_to=user)
    elif user.role and user.role.name == "Sales Manager" and user.team:
        overdue_qs = overdue_qs.filter(deal__lead__assigned_to__team=user.team)

    overdue_qs = overdue_qs.select_related('deal__lead').order_by('due_date')[:4]
    overdue_invoices = []
    for inv in overdue_qs:
        overdue_days = (today - inv.due_date).days
        company = inv.deal.lead.company if inv.deal.lead.company else (
            f"{inv.deal.lead.first_name} {inv.deal.lead.last_name}".strip()
        )
        overdue_invoices.append({
            "invoice_id": inv.id,
            "company": company,
            "amount": f"₹{inv.amount:,.2f}",
            "days": overdue_days,
            "isCritical": overdue_days >= 30,
        })

    return Response({
        "summary": {
            "total_revenue": total_revenue,
            "active_leads": active_leads,
            "conversion_rate": round(conversion_rate, 2)
        },
        "revenue_trend": monthly_data,
        "lead_sources": lead_sources,
        "executive_performance": ExecutivePerformanceSerializer(executives, many=True).data,
        "total_invoiced": total_invoiced,
        "paid_amount": paid_amount,
        "pending_amount": pending_amount,
        "overdue_amount": overdue_amount,
        "target": target_value,
        "overdue_invoices": overdue_invoices,
    })

from leads.models import Invoice

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reports_summary(request):
    user = request.user
    
    # Base querysets (unfiltered by date)
    all_invoices = Invoice.objects.all()
    all_deals = Deal.objects.all()
    
    if hasattr(user, 'role') and user.role:
        if user.role.name == "Sales Rep":
            all_invoices = all_invoices.filter(deal__lead__assigned_to=user)
            all_deals = all_deals.filter(lead__assigned_to=user)
        elif user.role.name == "Sales Manager" and user.team:
            all_invoices = all_invoices.filter(deal__lead__assigned_to__team=user.team)
            all_deals = all_deals.filter(lead__assigned_to__team=user.team)
            
    from datetime import timedelta
    from django.utils.timezone import now
    
    range_param = request.query_params.get("range", "last_30_days")
    
    if range_param == "last_30_days":
        start_date = now() - timedelta(days=30)
    elif range_param == "last_week":
        start_date = now() - timedelta(days=7)
    elif range_param == "yesterday":
        start_date = now() - timedelta(days=1)
    elif range_param == "last_year":
        start_date = now() - timedelta(days=365)
    else:
        start_date = now() - timedelta(days=30)

    invoices = all_invoices.filter(created_at__gte=start_date)
    deals = all_deals.filter(created_at__gte=start_date)
            
    # Aggregations
    total_revenue = invoices.filter(status='PAID').aggregate(total=Sum('amount'))['total'] or 0
    total_invoiced = invoices.aggregate(total=Sum('amount'))['total'] or 0
    
    paid_amount = invoices.filter(status='PAID').aggregate(total=Sum('amount'))['total'] or 0
    pending_amount = invoices.filter(status='PENDING').aggregate(total=Sum('amount'))['total'] or 0
    overdue_amount = invoices.filter(status='OVERDUE').aggregate(total=Sum('amount'))['total'] or 0
    
    deals_closed = deals.filter(result='WON').count()
    deals_lost = deals.filter(result='LOST').count()
    
    total_closed = deals_closed + deals_lost
    conversion_rate = (deals_closed / total_closed * 100) if total_closed > 0 else 0
    
    trend_data = []
    
    if range_param in ["last_week", "last_30_days", "yesterday"]:
        # Group by day
        days = 30 if range_param == "last_30_days" else (7 if range_param == "last_week" else 1)
        for i in range(days, -1, -1):
            target_date = now() - timedelta(days=i)
            # Current period amount
            amount = all_invoices.filter(
                status='PAID',
                created_at__date=target_date.date()
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Previous period amount (offset by exactly days + 1)
            prev_target_date = target_date - timedelta(days=days + 1)
            prev_amount = all_invoices.filter(
                status='PAID',
                created_at__date=prev_target_date.date()
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            trend_data.append({
                "month": target_date.strftime("%b %d"),
                "amount": amount,
                "previous_amount": prev_amount
            })
    else:
        # Group by month (last_year)
        current_month = now().month
        current_year = now().year
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        for m in range(1, 13):
            if m <= current_month:
                amount = all_invoices.filter(
                    status='PAID',
                    created_at__year=current_year,
                    created_at__month=m
                ).aggregate(total=Sum('amount'))['total'] or 0
            else:
                amount = 0
                
            prev_amount = all_invoices.filter(
                status='PAID',
                created_at__year=current_year - 1,
                created_at__month=m
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            trend_data.append({
                "month": month_names[m - 1],
                "amount": amount,
                "previous_amount": prev_amount
            })

    lead_source_performance = {
        "DIRECT": deals.filter(lead_source="DIRECT").count(),
        "PAID": deals.filter(lead_source="PAID").count(),
        "REFERRAL": deals.filter(lead_source="REFERRAL").count(),
        "SOCIAL": deals.filter(lead_source="SOCIAL").count(),
    }

    # --- Overdue Invoices ---
    today_date = datetime.date.today()
    overdue_qs = all_invoices.filter(status='OVERDUE')
    if hasattr(user, 'role') and user.role:
        if user.role.name == "Sales Rep":
            overdue_qs = overdue_qs.filter(deal__lead__assigned_to=user)
        elif user.role.name == "Sales Manager" and user.team:
            overdue_qs = overdue_qs.filter(deal__lead__assigned_to__team=user.team)

    overdue_qs = overdue_qs.select_related('deal__lead').order_by('due_date')[:4]

    overdue_invoices = []
    for inv in overdue_qs:
        overdue_days = (today_date - inv.due_date).days
        company = inv.deal.lead.company if inv.deal.lead.company else (
            f"{inv.deal.lead.first_name} {inv.deal.lead.last_name}".strip()
        )
        overdue_invoices.append({
            "invoice_id": inv.id,
            "company": company,
            "amount": f"₹{inv.amount:,.2f}",
            "days": overdue_days,
            "isCritical": overdue_days >= 30,
        })

    # --- Monthly Target Logic ---
    today = datetime.date.today()
    current_month_start = today.replace(day=1)

    # Current month revenue (paid invoices this calendar month, scoped to user)
    all_invoices = Invoice.objects.all()
    if hasattr(user, 'role') and user.role:
        if user.role.name == "Sales Rep":
            all_invoices = all_invoices.filter(deal__lead__assigned_to=user)
        elif user.role.name == "Sales Manager" and user.team:
            all_invoices = all_invoices.filter(deal__lead__assigned_to__team=user.team)

    current_revenue = all_invoices.filter(
        status='PAID',
        created_at__year=today.year,
        created_at__month=today.month
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

    # Shared team target — always look up from a manager account so all
    # users (reps and managers) see the same value.
    if today.month == 1:
        last_month_start = today.replace(year=today.year - 1, month=12, day=1)
    else:
        last_month_start = today.replace(month=today.month - 1, day=1)

    from leads.models import User as _UserModel
    manager_qs = _UserModel.objects.filter(role__name__icontains="manager")

    target_obj = Target.objects.filter(
        user__in=manager_qs,
        month=current_month_start,
    ).order_by('-target_amount').first()

    if target_obj is None:
        target_obj = Target.objects.filter(
            user__in=manager_qs,
            month=last_month_start,
        ).order_by('-target_amount').first()

    if target_obj is not None:
        target_value = target_obj.target_amount
    else:
        # Fallback: use current revenue as target
        target_value = current_revenue if current_revenue > 0 else Decimal('0')

    if target_value > 0:
        achievement_percentage = (Decimal(str(current_revenue)) / Decimal(str(target_value))) * Decimal('100')
    else:
        achievement_percentage = Decimal('0')

    # --- Conversion by Executive ---
    from leads.models import User as AppUser

    # All users who have at least one deal — no role/team scoping so every
    # user sees the same global top-5 list.
    users_with_deal_ids = Deal.objects.values_list(
        'lead__assigned_to', flat=True
    ).distinct()
    users_with_deals = AppUser.objects.filter(pk__in=users_with_deal_ids)

    def _perf(rate):
        if rate >= 25:
            return "EXCELLENT", "bg-emerald-100/70 text-emerald-600"
        elif rate >= 15:
            return "ON TRACK", "bg-slate-100 text-slate-500"
        return "IMPROVING", "bg-yellow-100/70 text-yellow-600"

    conversion_by_executive = []
    for eu in users_with_deals:
        total_leads = Deal.objects.filter(lead__assigned_to=eu).count()
        total_converted = Deal.objects.filter(
            lead__assigned_to=eu
        ).filter(Q(result='WON') | Q(is_won=True)).count()
        rate = round((total_converted / total_leads) * 100, 1) if total_leads > 0 else 0.0
        perf, perf_color = _perf(rate)
        full_name = f"{eu.first_name} {eu.last_name}".strip() or eu.email
        conversion_by_executive.append({
            "name": full_name,
            "leads": total_leads,
            "conversions": total_converted,
            "rate": f"{rate}%",
            "perf": perf,
            "perfColor": perf_color,
            "_rate_num": rate,  # used for sorting only
        })

    # Sort by conversion rate descending, keep top 5, strip the sort key
    conversion_by_executive.sort(key=lambda x: x["_rate_num"], reverse=True)
    conversion_by_executive = conversion_by_executive[:5]
    for row in conversion_by_executive:
        del row["_rate_num"]

    return Response({
        "total_revenue": total_revenue,
        "total_invoiced": total_invoiced,
        "paid_amount": paid_amount,
        "pending_amount": pending_amount,
        "overdue_amount": overdue_amount,
        "deals_closed": deals_closed,
        "deals_lost": deals_lost,
        "conversion_rate": round(conversion_rate, 2),
        "lead_source_performance": lead_source_performance,
        "trend_data": trend_data,
        "current_revenue": current_revenue,
        "target": target_value,
        "achievement_percentage": round(achievement_percentage, 2),
        "overdue_invoices": overdue_invoices,
        "conversion_by_executive": conversion_by_executive,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def set_target(request):
    user = request.user

    raw = request.data.get("target_amount")

    if raw is None or raw == "":
        return Response({"error": "target_amount is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        target_amount = Decimal(str(raw)).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        return Response({"error": "Invalid target amount"}, status=status.HTTP_400_BAD_REQUEST)

    if target_amount <= 0:
        return Response({"error": "Target amount must be greater than zero"}, status=status.HTTP_400_BAD_REQUEST)

    today = datetime.date.today()
    current_month_start = today.replace(day=1)

    target_obj, created = Target.objects.update_or_create(
        user=user,
        month=current_month_start,
        defaults={"target_amount": target_amount},
    )

    return Response({
        "message": "Target saved successfully",
        "month": current_month_start.strftime("%Y-%m"),
        "target_amount": str(target_obj.target_amount),
    }, status=status.HTTP_200_OK)
