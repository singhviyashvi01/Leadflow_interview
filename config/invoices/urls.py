from django.urls import path
from .views import MonthlyReportAPIView, InvoiceListAPIView, AutoGenerateInvoicesAPIView, InvoiceDetailAPIView

urlpatterns = [
    # Endpoint: /api/invoices/monthly-report/
    path('invoice-list/', InvoiceListAPIView.as_view(), name='invoice-list'),
    path('auto-generate/', AutoGenerateInvoicesAPIView.as_view(), name='auto-generate-invoices'),
    path('monthly-report/', MonthlyReportAPIView.as_view(), name='monthly-report'),
    path('<int:pk>/', InvoiceDetailAPIView.as_view(), name='invoice-detail'),
]
