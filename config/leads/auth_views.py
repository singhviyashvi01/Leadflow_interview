import logging

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from leads.serializers import LoginSerializer, LogoutSerializer, SignupSerializer
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Custom throttle classes
# ---------------------------------------------------------------------------

class LoginRateThrottle(AnonRateThrottle):
    """Strict rate limit for login attempts — brute-force protection."""
    scope = 'login'       # set in settings: REST_FRAMEWORK THROTTLE_RATES {'login': '5/min'}


class SignupRateThrottle(AnonRateThrottle):
    """Moderate rate limit for signups."""
    scope = 'signup'      # e.g. '10/hour'


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([SignupRateThrottle])
def signup(request):
    """
    POST /api/auth/signup/

    Body:
        {
            "first_name": "Alex",
            "last_name":  "Smith",
            "email":      "alex@company.com",
            "password":   "Secure@123",
            "phone":      "+91 98765 43210",   // optional
            "role_name":  "Sales Rep" | "Sales Manager"
        }

    Returns 201 with user object + JWT tokens on success.
    """
    serializer = SignupSerializer(data=request.data)

    if not serializer.is_valid():
        logger.warning("Signup validation failed | errors=%s", serializer.errors)
        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        result = serializer.create(serializer.validated_data)
        logger.info("New user signed up | email=%s role=%s",
                    result['user']['email'], result['user']['role'])
        
        response = Response(
            {
                "success": True, 
                "message": "Account created successfully.", 
                "user": result['user'],
                "access": result['access'],
                "refresh": result['refresh']
            },
            status=status.HTTP_201_CREATED,
        )
        
        # Set HttpOnly Cookies
        response.set_cookie(
            key='access_token',
            value=result['access'],
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            max_age=3600 * 2 # 2 hours
        )
        response.set_cookie(
            key='refresh_token',
            value=result['refresh'],
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            max_age=3600 * 24 # 24 hours
        )
        
        return response
    except Exception:
        logger.exception("Unexpected error during signup")
        return Response(
            {"success": False, "errors": {"non_field_errors": ["An unexpected error occurred. Please try again."]}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login(request):
    """
    POST /api/auth/login/

    Body:
        {
            "email":     "alex@company.com",
            "password":  "Secure@123",
            "role_name": "Sales Rep" | "Sales Manager"
        }

    Returns 200 with user object + JWT tokens on success.
    Role mismatch (e.g. rep trying manager portal) returns 403.
    """
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        errors = serializer.errors
        # Distinguish role mismatch (403) from bad credentials (401)
        if 'role_name' in errors:
            return Response(
                {"success": False, "errors": errors},
                status=status.HTTP_403_FORBIDDEN,
            )
        logger.warning("Login failed | ip=%s errors=%s",
                       _get_client_ip(request), errors)
        return Response(
            {"success": False, "errors": errors},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    result = serializer.to_representation(serializer.validated_data)
    logger.info("User logged in | email=%s role=%s",
                result['user']['email'], result['user']['role'])
    
    response = Response(
        {
            "success": True, 
            "message": "Login successful.", 
            "user": result['user'],
            "access": result['access'],
            "refresh": result['refresh']
        },
        status=status.HTTP_200_OK,
    )
    
    # Set HttpOnly Cookies
    response.set_cookie(
        key='access_token',
        value=result['access'],
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        max_age=3600 * 2 # 2 hours
    )
    response.set_cookie(
        key='refresh_token',
        value=result['refresh'],
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        max_age=3600 * 24 # 24 hours
    )
    
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([UserRateThrottle])
def logout(request):
    """
    POST /api/auth/logout/

    Headers:
        Authorization: Bearer <access_token>

    Body:
        { "refresh": "<refresh_token>" }

    Blacklists the refresh token so it can no longer be used.
    Requires rest_framework_simplejwt.token_blacklist in INSTALLED_APPS.
    """
    # Read refresh token from cookie if not in body
    refresh_token = request.data.get('refresh') or request.COOKIES.get('refresh_token')
    
    if not refresh_token:
        return Response(
            {"success": False, "errors": {"refresh": ["Refresh token is required."]}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = LogoutSerializer(data={'refresh': refresh_token})

    if not serializer.is_valid():
        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        serializer.save()
        logger.info("User logged out | user_id=%s",
                    getattr(request.user, 'id', 'unknown'))
        
        response = Response(
            {"success": True, "message": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )
        
        # Clear cookies
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        
        return response
    except Exception:
        logger.exception("Logout failed — token blacklist error")
        return Response(
            {"success": False, "errors": {"non_field_errors": ["Logout failed. Token may already be invalid."]}},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def cookie_token_refresh(request):
    """
    POST /api/token/refresh/
    Reads refresh token from cookie or request body,
    returns new access token in cookies and response.
    """
    refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
    
    if not refresh_token:
        return Response(
            {"detail": "Refresh token is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
    
    try:
        serializer.is_valid(raise_exception=True)
    except (InvalidToken, TokenError):
        return Response(
            {"detail": "Invalid or expired refresh token."},
            status=status.HTTP_401_UNAUTHORIZED
        )
        
    result = serializer.validated_data
    access_token = result.get('access')
    new_refresh_token = result.get('refresh')
    
    response = Response(
        {
            "success": True,
            "access": access_token,
            **({"refresh": new_refresh_token} if new_refresh_token else {})
        },
        status=status.HTTP_200_OK
    )
    
    # Set HttpOnly Cookie for access token
    response.set_cookie(
        key='access_token',
        value=access_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        max_age=3600 * 2 # 2 hours
    )
    
    # Set HttpOnly Cookie for refresh token if it was rotated
    if new_refresh_token:
        response.set_cookie(
            key='refresh_token',
            value=new_refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            max_age=3600 * 24 # 24 hours
        )
        
    return response


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _get_client_ip(request) -> str:
    """Extract real client IP, respecting X-Forwarded-For in production."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')
