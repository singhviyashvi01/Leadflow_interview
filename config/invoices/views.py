# invoices/views.py

from datetime import datetime
from django.http import HttpResponse
from django.template.loader import get_template

from rest_framework.views import APIView
from rest_framework.response import Response

from xhtml2pdf import pisa

from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics

from django.utils import timezone
import uuid
from leads.models import Invoice, Deal
from invoices.serializers import InvoiceSerializer
from invoices.reports import get_monthly_financial_report


class AutoGenerateInvoicesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        role = getattr(user, 'role', None)
        role_name = role.name if role else None

        # Debug: Print deals in Closed stage to console for verification
        print("DEBUG: Deals in Closed stage:", Deal.objects.filter(stage__name="Closed").values('id', 'title', 'result', 'is_won'))
        
        # DEBUG: Print all deals in "Closed" stage to server console
        closed_deals_debug = Deal.objects.filter(stage__name="Closed").values('id', 'title', 'result', 'is_won')
        print(f"DEBUG: Found {len(closed_deals_debug)} deals in Closed stage: {list(closed_deals_debug)}")
        
        # Filter WON deals for invoice generation
        from django.db.models import Q
        # Be more inclusive: check for result='WON' OR is_won=True
        base_filter = Q(result='WON') | Q(is_won=True)
        
        # Filter WON deals for invoice generation
        from django.db.models import Q
        base_filter = Q(result='WON') | Q(is_won=True)
        
        if role_name == "Sales Rep":
            deals_query = Deal.objects.filter(Q(lead__assigned_to=user) & base_filter)
        elif role_name == "Sales Manager" and user.team:
            deals_query = Deal.objects.filter(Q(lead__assigned_to__team=user.team) & base_filter)
        else:
            deals_query = Deal.objects.filter(base_filter)

        # Exclude deals that already have invoices
        deals_needing_invoices = deals_query.exclude(invoice__isnull=False)

        created_count = 0
        new_invoices = []
        for deal in deals_needing_invoices:
            try:
                inv = Invoice.objects.create(
                    deal=deal,
                    invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}",
                    amount=deal.deal_value or 0,
                    tax=0,
                    discount=0,
                    total_amount=deal.deal_value or 0, # REQUIRED FIELD
                    due_date=timezone.now().date() + timezone.timedelta(days=30),
                    status='PENDING'
                )
                new_invoices.append(InvoiceSerializer(inv).data)
                created_count += 1
            except Exception as e:
                print(f"ERROR: Failed to create invoice for deal {deal.id}: {str(e)}")

        return Response({
            "message": f"Successfully generated {created_count} invoices.",
            "count": created_count,
            "invoices": new_invoices
        })
class InvoiceListAPIView(generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', None)
        role_name = role.name if role else None

        if role_name == "Sales Rep":
            qs = Invoice.objects.filter(deal__lead__assigned_to=user)
            # Fallback: if no invoices assigned to this rep, show all so the
            # invoices page is never completely empty.
            if not qs.exists():
                return Invoice.objects.all().order_by('-created_at')
            return qs.order_by('-created_at')
        elif role_name == "Sales Manager" and user.team:
            qs = Invoice.objects.filter(deal__lead__assigned_to__team=user.team)
            if not qs.exists():
                return Invoice.objects.all().order_by('-created_at')
            return qs.order_by('-created_at')
        return Invoice.objects.all().order_by('-created_at')


class MonthlyReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Query params
        month = request.query_params.get('month')
        year = request.query_params.get('year')

        #  Use 'export' instead of 'format'
        export_format = request.query_params.get('export')

        #  Get report data
        data = get_monthly_financial_report(month=month, year=year)

        #  If PDF requested
        if export_format == 'pdf':
            return self.generate_pdf_response(data, month, year)

        #  Default → JSON
        return Response(data)

    def generate_pdf_response(self, data, month, year):
        template = get_template('invoices/report_pdf_template.html')

        context = {
            'report': data,
            'month': month,
            'year': year,
            'today': datetime.now(),
        }

        html = template.render(context)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="LeadFlow_Report_{month}_{year}.pdf"'

        pisa_status = pisa.CreatePDF(html, dest=response)

        if pisa_status.err:
            return HttpResponse('Error generating PDF', status=500)

        return response

class InvoiceDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
