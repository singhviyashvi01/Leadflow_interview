from django.urls import path
from leads import views
from leads import auth_views

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────
    path('auth/signup/', auth_views.signup, name='auth-signup'),
    path('auth/login/',  auth_views.login,  name='auth-login'),
    path('auth/logout/', auth_views.logout, name='auth-logout'),
    path('dashboard/stats/', views.DashboardDataView.as_view(), name='dashboard-stats'),
    path('team/', views.team_overview_data, name='team-overview'),
    # ── Notifications ──────────────────────────────────────────────────────
    path('notifications/', views.notifications_list, name='notifications-list'),
    path('notifications/mark-all-read/', views.notifications_mark_all_read, name='notifications-mark-all-read'),
    path('notifications/<int:pk>/read/', views.notification_mark_read, name='notification-mark-read'),
    # ── Profile ─────────────────────────────────────────────────────────────
    path('auth/me/', views.profile_view, name='auth-profile'),
    path('auth/change-password/', views.change_password_view, name='auth-change-password'),
    path('auth/delete-account/', views.delete_account_view, name='auth-delete-account'),
]