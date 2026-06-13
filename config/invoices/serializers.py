from rest_framework import serializers
from leads.models import Invoice

class InvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='deal.lead.company', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 
            'invoice_number', 
            'client_name', 
            'amount', 
            'status', 
            'due_date', 
            'created_at'
        ]
