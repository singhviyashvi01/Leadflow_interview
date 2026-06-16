from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Q

from .models import Deal, PipelineStage
from .serializers import DealSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pipeline_view(request):
    user = request.user
    role = getattr(user, 'role', None)
    role_name = role.name if role else None

    if role_name == "Sales Rep":
        deals = Deal.objects.filter(lead__assigned_to=user)
        # Fallback: if this rep has no assigned deals, show all deals so the
        # pipeline is never completely empty.
        if not deals.exists():
            deals = Deal.objects.all()
    elif role_name == "Sales Manager" and user.team:
        deals = Deal.objects.filter(lead__assigned_to__team=user.team)
        if not deals.exists():
            deals = Deal.objects.all()
    else:
        deals = Deal.objects.all()

    stages = PipelineStage.objects.all().order_by("order")

    pipeline_data = []

    for stage in stages:
        stage_deals = deals.filter(
            stage=stage,
            is_won=False,
            is_lost=False,
            result__isnull=True
        )

        serializer = DealSerializer(stage_deals, many=True)

        total_value = stage_deals.aggregate(
            total=Sum("deal_value")
        )["total"] or 0

        pipeline_data.append({
            "stage_id": stage.id,
            "stage_name": stage.name,
            "count": stage_deals.count(),
            "total_value": total_value,
            "deals": serializer.data,
        })

    closed_deals = deals.filter(Q(is_won=True) | Q(result='WON'))
    lost_deals = deals.filter(Q(is_lost=True) | Q(result='LOST'))

    return Response({
        "pipeline": pipeline_data,
        "closed_deals": DealSerializer(closed_deals, many=True).data,
        "lost_deals": DealSerializer(lost_deals, many=True).data,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_deal_stage(request, deal_id):

    user = request.user  

    try:
        deal = Deal.objects.get(id=deal_id)
    except Deal.DoesNotExist:
        return Response({"error": "Deal not found"}, status=404)

    stage_id = request.data.get("stage_id")

    try:
        stage = PipelineStage.objects.get(id=stage_id)
    except PipelineStage.DoesNotExist:
        return Response({"error": "Pipeline stage not found"}, status=404)

    deal.stage = stage
    deal.is_won = False
    deal.is_lost = False
    deal.save()

    return Response({"message": "Deal stage updated successfully"})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def close_deal(request, deal_id):

    user = request.user  

    try:
        deal = Deal.objects.get(id=deal_id)
    except Deal.DoesNotExist:
        return Response({"error": "Deal not found"}, status=404)

    deal_status = request.data.get("status")

    if deal_status == "won":
        deal.is_won = True
        deal.is_lost = False

    elif deal_status == "lost":
        deal.is_won = False
        deal.is_lost = True

    else:
        return Response({"error": "Invalid status"}, status=400)
    deal.save()

    return Response({"message": "Deal status updated successfully"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_deal(request):
    """
    Body: { "title": "...", "deal_value": 0, "lead_id": 1, "stage_id": 1 }
    """
    title = request.data.get("title")
    deal_value = request.data.get("deal_value")
    priority = request.data.get("priority", "medium")
    lead_id = request.data.get("lead_id")
    stage_id = request.data.get("stage_id")
    result = request.data.get("result")

    from leads.models import Lead, PipelineStage, Deal
    from .serializers import DealSerializer

    # 1. Ensure all 4 stages exist (Seeding logic)
    stages_to_ensure = [
        ("Discovery", 1),
        ("Proposal", 2),
        ("Negotiation", 3),
        ("Closed", 4)
    ]
    for name, order in stages_to_ensure:
        PipelineStage.objects.get_or_create(name=name, defaults={"order": order})

    # 2. Extract and Validate deal_value
    from decimal import Decimal, InvalidOperation
    try:
        clean_value = Decimal(str(deal_value or 0))
    except (InvalidOperation, ValueError):
        clean_value = Decimal('0.00')

    # 3. Always create/get a unique Lead for this deal
    # If no lead_id is provided, we create a new Lead using the deal title as the company
    if lead_id:
        try:
            lead = Lead.objects.get(id=lead_id)
        except Lead.DoesNotExist:
            return Response({"error": "Lead not found"}, status=404)
    else:
        # Create a fresh lead for every new deal added via the quick-add modal
        lead = Lead.objects.create(
            first_name=title.split(' ')[0] if title else "New",
            last_name=title.split(' ')[1] if title and ' ' in title else "Lead",
            company=title or "New Company",
            email=f"lead_{Decimal(timezone.now().timestamp())}@example.com",
            assigned_to=request.user
        )

    # 4. Resolve the correct stage
    # If result is provided (WON/LOST), force it to the "Closed" stage (ID 4)
    if result:
        stage_id = 4

    stage_name_map = {
        1: "Discovery",
        2: "Proposal",
        3: "Negotiation",
        4: "Closed"
    }
    target_name = stage_name_map.get(int(stage_id) if stage_id else 1, "Discovery")
    stage = PipelineStage.objects.filter(name__iexact=target_name).first()
    
    # Final fallback if something is weird
    if not stage:
        stage = PipelineStage.objects.first()

    lead_source = request.data.get("lead_source", "DIRECT")

    # 5. Create the Deal
    deal = Deal.objects.create(
        lead=lead,
        title=title,
        deal_value=clean_value,
        priority=priority,
        stage=stage,
        result=result,
        is_won=(result == 'WON'),
        is_lost=(result == 'LOST'),
        lead_source=lead_source
    )

    return Response(DealSerializer(deal).data, status=201)


@api_view(['PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def update_deal(request, deal_id):
    try:
        deal = Deal.objects.get(id=deal_id)
    except Deal.DoesNotExist:
        return Response({"error": "Deal not found"}, status=404)

    # If lead is unassigned, assign it to the user who is updating it
    if deal.lead and not deal.lead.assigned_to:
        deal.lead.assigned_to = request.user
        deal.lead.save()

    serializer = DealSerializer(deal, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_deal(request, deal_id):
    try:
        deal = Deal.objects.get(id=deal_id)
        deal.delete()
        return Response({"message": "Deal deleted successfully"}, status=204)
    except Deal.DoesNotExist:
        return Response({"error": "Deal not found"}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_deals(request):
    query = request.query_params.get('q', '')
    if not query:
        return Response([])

    user = request.user
    role = getattr(user, 'role', None)
    role_name = role.name if role else None

    # Apply same permissions as pipeline_view
    if role_name == "Sales Rep":
        deals = Deal.objects.filter(lead__assigned_to=user)
        if not deals.exists():
            deals = Deal.objects.all()
    elif role_name == "Sales Manager" and user.team:
        deals = Deal.objects.filter(lead__assigned_to__team=user.team)
        if not deals.exists():
            deals = Deal.objects.all()
    else:
        deals = Deal.objects.all()

    # Filter by title or lead name/company
    from django.db.models import Q
    deals = deals.filter(
        Q(title__icontains=query) |
        Q(lead__first_name__icontains=query) |
        Q(lead__last_name__icontains=query) |
        Q(lead__company__icontains=query)
    ).distinct()[:10] # Limit to 10 recommendations

    return Response(DealSerializer(deals, many=True).data)
