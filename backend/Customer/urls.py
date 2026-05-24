from django.urls import path
from . import views

from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', views.CustomerTokenObtainPairView.as_view(), name='token_obtain_pair'),  # Get access & refresh token
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),       # Get new access token using refresh token
    path('register/', views.RegisterCustomer.as_view(), name="RegisterPage"),
    path('customlogin/', views.CustomerLogin.as_view(), name="LoginPage"),
    path('google-login/', views.GoogleLogin.as_view(), name="GoogleLogin"),
    path('change-password/', views.ResetPasswordRoute.as_view()),
    path('address/', views.CustomerAddressRoute.as_view()),
    path('profile/', views.CustomerProfile.as_view()),
    path('verify-email/', views.VerifyEmail.as_view(), name="verify_email"),
    path('send-email-verification-link/', views.SendEmailVerificationLink.as_view()),
    path('updateProfile/', views.CustomerUpdateProfile.as_view()),
    path('subscriber/', views.SubscriberRoute.as_view()),
    path('protected/', views.ProtectedRoute.as_view()),
    # path('phoneno/', views.CustomerPhoneNoRoute.as_view()),
]
