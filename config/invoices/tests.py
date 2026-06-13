from datetime import date
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone

from leads.models import User, Lead, Deal, Invoice, Payment
from invoices.reports import get_monthly_financial_report


class InvoicesReportTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="testuser@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="User"
        )
        self.client.force_authenticate(user=self.user)

        # Create basic records
        self.lead = Lead.objects.create(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            assigned_to=self.user
        )
        
        self.deal = Deal.objects.create(
            lead=self.lead,
            title="Test Deal",
            deal_value=5000.00,
            is_won=True
        )

        # Create invoices for current period
        self.inv_paid = Invoice.objects.create(
            deal=self.deal,
            invoice_number="INV-PAID-01",
            amount=2000.00,
            total_amount=2000.00,
            due_date=date.today(),
            status="PAID"
        )
        
        self.inv_overdue = Invoice.objects.create(
            deal=self.deal,
            invoice_number="INV-OVERDUE-01",
            amount=1500.00,
            total_amount=1500.00,
            due_date=date.today(),
            status="OVERDUE"
        )

        self.inv_pending = Invoice.objects.create(
            deal=self.deal,
            invoice_number="INV-PENDING-01",
            amount=1000.00,
            total_amount=1000.00,
            due_date=date.today(),
            status="PENDING"
        )

        # Create payment
        self.payment = Payment.objects.create(
            invoice=self.inv_paid,
            amount_paid=2000.00,
            payment_method="Stripe",
            transaction_id="tx_12345",
            payment_date=timezone.now()
        )

    def test_reports_helper_calculations(self):
        now = timezone.now()
        report = get_monthly_financial_report(month=now.month, year=now.year)
        
        self.assertEqual(report["invoices"]["total_count"], 3)
        self.assertEqual(report["invoices"]["total_value"], 4500.00)
        self.assertEqual(report["invoices"]["paid_count"], 1)
        self.assertEqual(report["invoices"]["overdue_count"], 1)
        self.assertEqual(report["invoices"]["pending_count"], 1)
        
        self.assertEqual(report["payments"]["transaction_count"], 1)
        self.assertEqual(report["payments"]["total_collected"], 2000.00)

    def test_api_view_json(self):
        url = reverse('monthly-report')
        now = timezone.now()
        response = self.client.get(url, {'month': now.month, 'year': now.year})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["invoices"]["total_count"], 3)
        self.assertEqual(response.data["invoices"]["paid_count"], 1)
        self.assertEqual(response.data["payments"]["total_collected"], 2000.0)

    def test_api_view_pdf(self):
        url = reverse('monthly-report')
        now = timezone.now()
        response = self.client.get(url, {'month': now.month, 'year': now.year, 'export': 'pdf'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(len(response.content) > 0)
