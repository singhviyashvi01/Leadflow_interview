from datetime import date
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone

from leads.models import User, Lead, Deal, Role
from reports.models import Target


class ReportsViewSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.role = Role.objects.create(name="Sales Rep")
        self.user = User.objects.create_user(
            email="testuser@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="User",
            role=self.role
        )
        # Create lead and deal
        self.lead = Lead.objects.create(
            first_name="Jane",
            last_name="Doe",
            email="jane@example.com",
            assigned_to=self.user
        )
        self.deal = Deal.objects.create(
            lead=self.lead,
            title="Won Deal",
            deal_value=12000.00,
            is_won=True,
            result="WON"
        )

    def test_unauthenticated_endpoints(self):
        # Verify 401 on reports_dashboard
        response = self.client.get('/api/reports/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Verify 401 on reports_summary
        response = self.client.get('/api/reports/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Verify 401 on set_target
        response = self.client.post('/api/reports/set-target/', {'target_amount': 5000.00})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_dashboard(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/reports/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that it returns summary and revenue_trend
        self.assertIn("summary", response.data)
        self.assertIn("revenue_trend", response.data)
        self.assertEqual(response.data["summary"]["total_revenue"], 12000.0)

    def test_authenticated_summary(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/reports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_revenue", response.data)

    def test_authenticated_set_target(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.post_set_target(15000.00)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Target saved successfully")
        
        # Verify target is in DB
        self.assertEqual(Target.objects.filter(user=self.user).count(), 1)

    def post_set_target(self, amount):
        return self.client.post('/api/reports/set-target/', {'target_amount': amount})
