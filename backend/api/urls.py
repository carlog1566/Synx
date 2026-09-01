from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import SongViewset, RegisterView, LogoutView, CookieTokenObtainPairView, MeView, GoogleLoginView, ForgotPasswordView, ResetPasswordConfirmView


router = DefaultRouter()
router.register(r'songs', SongViewset, basename='song')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'), 
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('auth/reset-password/', ResetPasswordConfirmView.as_view(), name='reset_password'),
]