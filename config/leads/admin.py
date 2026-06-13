from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from leads.models import *


class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active', 'team')
    
    # Customizing fieldsets to use 'email' instead of 'username'
    # and adding custom fields like 'phone', 'role', etc.
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'profile_picture')}),
        ('Professional Info', {'fields': ('role', 'manager', 'team')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # add_fieldsets is for the 'Add User' page
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'first_name', 'last_name', 'role', 'team'),
        }),
    )
    
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

admin.site.register(Role)
admin.site.register(Team)
admin.site.register(User, CustomUserAdmin)
admin.site.register(LeadSource)
admin.site.register(Lead)
admin.site.register(FollowUp)