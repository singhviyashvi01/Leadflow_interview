from rest_framework import serializers
from .models import Deal

class DealSerializer(serializers.ModelSerializer):
    lead_name = serializers.SerializerMethodField()
    lead_id = serializers.SerializerMethodField()
    company = serializers.CharField(source='lead.company')
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = [
            'id',
            'title',
            'deal_value',
            'priority',
            'stage',
            'lead_id',
            'lead_name',
            'company',
            'is_won',
            'is_lost',
            'result',
            'lead_source',
            'assigned_to_name',
        ]

    def get_lead_name(self, obj):
        if obj.lead:
            return f"{obj.lead.first_name} {obj.lead.last_name}"
        return None

    def get_lead_id(self, obj):
        return obj.lead_id

    def get_assigned_to_name(self, obj):
        if obj.lead and obj.lead.assigned_to:
            u = obj.lead.assigned_to
            full = f"{u.first_name} {u.last_name}".strip()
            return full if full else u.email
        return None
