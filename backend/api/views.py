# views.py
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

import logging
import random

from django.conf import settings
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import serializers

# Get the custom user model
CustomUser = get_user_model()

# Setup logging
logger = logging.getLogger(__name__)

from .models import (
    Category, Product,
    Cart, CartItem, Order,
)
from .serializers import (
    OTPSerializer, PasswordChangeSerializer, UserLoginSerializer, UserRegistrationSerializer, UserProfileSerializer,
    CategorySerializer, CategoryDetailSerializer,
    ProductListSerializer, ProductDetailSerializer,
    CartSerializer,OrderSerializer, CheckoutSerializer
)
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin

class UserRegistrationView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            # This will raise ValidationError if username already exists
            serializer.is_valid(raise_exception=True)
            
            # Get the validated data from the serializer
            validated_data = serializer.validated_data
            
            # Create user with validated data
            user = CustomUser.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                user_type='CUSTOMER'  # Set user_type to CUSTOMER
            )
            
            # Update additional fields if present
            if 'first_name' in validated_data:
                user.first_name = validated_data['first_name']
            if 'last_name' in validated_data:
                user.last_name = validated_data['last_name']
            if 'phone_number' in validated_data:
                user.phone_number = validated_data['phone_number']
            if 'address' in validated_data:
                user.address = validated_data['address']
            
            # Generate OTP for email verification
            otp = str(random.randint(100000, 999999))
            user.otp = otp
            user.otp_generated_at = timezone.now()
            user.save()
            
            # Store user_id and OTP in session
            request.session['user_id'] = user.id
            request.session['otp'] = otp
            
            # Send verification email
            if settings.SEND_OTP_VIA_EMAIL:
                send_mail(
                    'Your OTP Code',
                    f'Your OTP code is {otp}',
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            else:
                print(f'{user.email} Your OTP code is {otp}')
                
            return Response({
                'message': 'Registration successful. Please verify your email.',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
            
        except serializers.ValidationError as e:
            # Handle validation errors
            return Response({
                'error': 'Registration failed',
                'details': e.detail
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except IntegrityError as e:
            # Handle database integrity errors (like duplicate username)
            error_message = str(e)
            if 'username' in error_message:
                message = "A user with this username already exists."
            elif 'email' in error_message:
                message = "A user with this email already exists."
            else:
                message = "Registration failed due to a database error."
                
            return Response({
                'error': 'Registration failed',
                'details': {'message': message}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            # Handle other exceptions
            logger.error(f"Registration error: {str(e)}", exc_info=True)
            return Response({
                'error': 'Registration failed',
                'message': 'An unexpected error occurred during registration.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


import logging
import json
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
import random
from django.core.mail import send_mail
from django.conf import settings

# Set up logger
logger = logging.getLogger(__name__)

class LoginView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserLoginSerializer
    
    def post(self, request, *args, **kwargs):
        # Log the incoming request
        logger.info("=== LOGIN REQUEST RECEIVED ===")
        logger.info(f"Request Method: {request.method}")
        logger.info(f"Request Content-Type: {request.content_type}")
        logger.info(f"Request Headers: {dict(request.headers)}")
        
        # Safely log request data
        try:
            request_data = request.data
            safe_data = {k: '***' if k == 'password' else v for k, v in request_data.items()}
            logger.info(f"Request Data: {safe_data}")
        except Exception as e:
            logger.error(f"Error parsing request data: {str(e)}")
        
        try:
            # Create serializer with request data
            logger.info("Creating serializer with request data")
            serializer = self.get_serializer(data=request.data)
            
            # Validate serializer
            logger.info("Validating serializer")
            is_valid = serializer.is_valid(raise_exception=False)
            
            if not is_valid:
                logger.error(f"Serializer validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Get user from validated data
            logger.info("Getting user from validated data")
            try:
                user = serializer.validated_data
                logger.info(f"User retrieved: {user.username} (ID: {user.id})")
            except Exception as e:
                logger.error(f"Error accessing validated_data: {str(e)}")
                logger.info(f"Validated data type: {type(serializer.validated_data)}")
                logger.info(f"Validated data content: {serializer.validated_data}")
                return Response(
                    {"detail": "Server error while processing login"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Generate OTP and save it
            logger.info("Generating OTP")
            otp = str(random.randint(100000, 999999))
            user.otp = otp
            user.otp_generated_at = timezone.now()
            user.save()
            logger.info(f"OTP generated for user {user.username}")
            
            # Store in session
            request.session['user_id'] = user.id
            request.session['otp'] = otp
            logger.info("User ID and OTP stored in session")
            
            # Print OTP and email to terminal
            print(f"\n==== OTP INFORMATION ====")
            print(f"User Email: {user.email}")
            print(f"Generated OTP: {otp}")
            print(f"=========================\n")
            
            # Send the OTP
            if settings.SEND_OTP_VIA_EMAIL:
                logger.info(f"Sending OTP to email: {user.email}")
                send_mail(
                    'Your OTP Code',
                    f'Your OTP code is {otp}',
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
                logger.info("OTP email sent")
            else:
                logger.info(f"OTP delivery disabled. User: {user.email}, OTP: {otp}")
            
            # Prepare response
            response_data = {
                'message': 'OTP generated. Check your email.',
                'user_id': user.id,
            }
            logger.info("Login successful, returning OTP verification response")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Unexpected error in login view: {str(e)}")
            return Response(
                {"detail": "An unexpected error occurred"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

class VerifyOTPView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = OTPSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            user_id = serializer.validated_data.get('user_id')
            user = CustomUser.objects.get(id=user_id)

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Clear OTP fields after successful verification
            user.otp = None
            user.otp_generated_at = None
            user.save()

            # Add custom claims if needed
            refresh['user_type'] = user.user_type

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_type': user.user_type,
                'user_id': user.id,
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        

class UserLogOutAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Logout successful."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class PasswordChangeView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        logger.info(f"Received password change request for user: {request.user.username}")

        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = request.user
            new_password = serializer.validated_data['new_password']
            user.set_password(new_password)
            user.save()
            logger.info(f"Password successfully changed for user: {user.username}")
            return Response({"detail": "Password updated successfully"}, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Password change failed for user: {request.user.username}. Errors: {serializer.errors}")
            
            # Prepare a more user-friendly error message
            error_messages = []
            for field, errors in serializer.errors.items():
                for error in errors:
                    error_messages.append(str(error))
            
            return Response({
                "detail": "Password change failed",
                "errors": error_messages,
                "password_requirements": [
                    "Password must be at least 8 characters long",
                    "Password cannot be too similar to your username",
                    "Password must not be a commonly used password",
                    "Password must contain a mix of letters, numbers, and symbols"
                ]
            }, status=status.HTTP_400_BAD_REQUEST)
        

class UserProfileView(APIView):
    """
    View for retrieving and updating user profile information.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retrieve the authenticated user's profile information"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        """Update the authenticated user's profile information"""
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CategoryDetailSerializer
        return CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductListSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_available']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Return available products with discount"""
        products = Product.objects.filter(is_available=True, discount_price__isnull=False)[:10]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if query:
            products = Product.objects.filter(
                Q(name__icontains=query) | 
                Q(description__icontains=query) |
                Q(category__name__icontains=query)
            ).distinct()
            serializer = ProductListSerializer(products, many=True, context={'request': request})
            return Response(serializer.data)
        return Response([])

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Check if user already has a cart
        try:
            cart = Cart.objects.get(user=self.request.user)
            return Response({"error": "User already has a cart"}, status=status.HTTP_400_BAD_REQUEST)
        except Cart.DoesNotExist:
            serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        cart = self.get_object()
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        
        try:
            product = Product.objects.get(id=product_id)
            if product.stock < quantity:
                return Response({"error": "Not enough stock available"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Reduce the stock quantity
            product.stock -= quantity
            product.save()
            
            # Add item to cart
            cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
            if not created:
                cart_item.quantity += quantity
            cart_item.save()
            
            return Response({"message": "Item added to cart"}, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def remove_item(self, request, pk=None):
        cart = self.get_object()
        cart_item_id = request.data.get('cart_item_id')
        
        try:
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
            # Restore the stock quantity
            cart_item.product.stock += cart_item.quantity
            cart_item.product.save()
            
            cart_item.delete()
            return Response({"message": "Item removed from cart"}, status=status.HTTP_200_OK)
        except CartItem.DoesNotExist:
            return Response({"error": "Cart item not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def update_item(self, request, pk=None):
        cart = self.get_object()
        cart_item_id = request.data.get('cart_item_id')
        quantity = request.data.get('quantity', 1)
        
        try:
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
            if cart_item.product.stock + cart_item.quantity < quantity:
                return Response({"error": "Not enough stock available"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update the stock quantity
            cart_item.product.stock += cart_item.quantity - quantity
            cart_item.product.save()
            
            cart_item.quantity = quantity
            cart_item.save()
            return Response({"message": "Cart item updated"}, status=status.HTTP_200_OK)
        except CartItem.DoesNotExist:
            return Response({"error": "Cart item not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def clear(self, request, pk=None):
        cart = self.get_object()
        for cart_item in cart.items.all():
            # Restore the stock quantity
            cart_item.product.stock += cart_item.quantity
            cart_item.product.save()
            
            cart_item.delete()
        return Response({"message": "Cart cleared"}, status=status.HTTP_200_OK)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    @action(detail=True, methods=['put', 'patch'], url_path='update_status')
    def update_status(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"error": "Only admin users can update order status"}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        order = self.get_object()
        order_status = request.data.get('order_status')
        payment_status = request.data.get('payment_status')
        tracking_number = request.data.get('tracking_number')
        
        if order_status:
            if order_status not in dict(Order.ORDER_STATUS_CHOICES):
                return Response({"error": "Invalid order status"}, status=status.HTTP_400_BAD_REQUEST)
            order.order_status = order_status
        
        if payment_status:
            if payment_status not in dict(Order.PAYMENT_STATUS_CHOICES):
                return Response({"error": "Invalid payment status"}, status=status.HTTP_400_BAD_REQUEST)
            order.payment_status = payment_status
        
        if tracking_number:
            order.tracking_number = tracking_number
        
        order.save()
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        serializer = CheckoutSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Ensure the user is assigned to the order
            order = serializer.save(user=request.user)
            order_serializer = OrderSerializer(order)
            return Response(order_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResendOTPView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = OTPSerializer

    def post(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = CustomUser.objects.get(id=user_id)
            otp = user.generate_otp()
            
            # Send the OTP
            if settings.SEND_OTP_VIA_EMAIL:
                send_mail(
                    'Your OTP Code',
                    f'Your OTP code is {otp}',
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            else:
                print(f'{user.email} Your OTP code is {otp}')
            
            return Response({"message": "OTP resent successfully"}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Sum
from .models import Order, Product
from .serializers import OrderSerializer

class AdminDashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], url_path='dashboard')
    def get_dashboard_data(self, request):
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(order_status='PENDING').count()
        total_products = Product.objects.count()
        low_stock_products = Product.objects.filter(stock__lte=5).count()
        total_revenue = Order.objects.filter(order_status='COMPLETED').aggregate(total_revenue=Sum('order_total'))['total_revenue'] or 0

        recent_orders = Order.objects.order_by('-created_at')[:5]
        recent_orders_data = OrderSerializer(recent_orders, many=True).data

        data = {
            'stats': {
                'totalOrders': total_orders,
                'pendingOrders': pending_orders,
                'totalProducts': total_products,
                'lowStockProducts': low_stock_products,
                'totalRevenue': total_revenue,
            },
            'recentOrders': recent_orders_data,
        }
        return Response(data)