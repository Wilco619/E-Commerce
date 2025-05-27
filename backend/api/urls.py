from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'carts', views.CartViewSet, basename='cart')
router.register(r'orders', views.OrderViewSet, basename='order')
router.register(r'admin', views.AdminDashboardViewSet, basename='admin-dashboard')
router.register(r'wishlist', views.WishlistViewSet, basename='wishlist')

urlpatterns = [
    path('', include(router.urls)),
    # Authentication endpoints
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend-otp'),
    path('logout/', views.UserLogOutAPIView.as_view(), name='logout'),
    path('change-password/', views.PasswordChangeView.as_view(), name='change-password'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/<str:uid>/<str:token>/', views.ResetPasswordView.as_view(), name='reset-password'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),

    # Newsletter endpoint
    path('newsletter/subscribe/', views.subscribe_newsletter, name='newsletter-subscribe'),

    #Cookies endpoint
    path('csrf/', views.set_csrf_token, name='set_csrf_token'),
    path('preferences/', views.set_user_preferences, name='set_user_preferences'),
    path('preferences/get/', views.get_user_preferences, name='get_user_preferences'),
    path('preferences/delete/<str:preference_key>/', views.delete_user_preference, name='delete_user_preference'),
    path('session/', views.set_user_session, name='set_user_session'),
]

urlpatterns += router.urls