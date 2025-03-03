from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MPesaViewSet

# Create a router for the ViewSet
router = DefaultRouter()
router.register(r'mpesa', MPesaViewSet, basename='mpesa')

urlpatterns = [
    # Include the new router URLs for the ViewSet
    path('', include(router.urls)),
]