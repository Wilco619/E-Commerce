# views.py
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

import logging
import random


from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Sum
from .models import GuestCart, GuestCartItem, Order, Product
from .serializers import OrderSerializer

from django.conf import settings
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser

from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import serializers

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


# Get the custom user model
CustomUser = get_user_model()

# Setup logging
logger = logging.getLogger(__name__)

from .models import (
    Category, Product,
    Cart, CartItem, Order, ProductImage,
)
from .serializers import (
    OTPSerializer, PasswordChangeSerializer, UserLoginSerializer, UserRegistrationSerializer, UserProfileSerializer,
    CategorySerializer, CategoryDetailSerializer,
    ProductListSerializer, ProductDetailSerializer,
    CartSerializer,OrderSerializer, CheckoutSerializer, GuestCartSerializer
)
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin

from django_filters import rest_framework as django_filters

class UserRegistrationView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def migrate_guest_cart(self, request, user):
        session_id = request.session.session_key
        if (session_id):
            try:
                guest_cart = GuestCart.objects.get(session_id=session_id)
                user_cart, created = Cart.objects.get_or_create(user=user)

                # Migrate items from guest cart to user cart
                for guest_item in guest_cart.items.all():
                    cart_item, created = CartItem.objects.get_or_create(
                        cart=user_cart,
                        product=guest_item.product,
                        defaults={'quantity': guest_item.quantity}
                    )
                    if not created:
                        cart_item.quantity += guest_item.quantity
                        cart_item.save()

                # Delete the guest cart
                guest_cart.delete()
            except GuestCart.DoesNotExist:
                pass
    
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
            
            # Migrate guest cart if exists
            self.migrate_guest_cart(request, user)
            
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
    lookup_field = 'slug'
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.annotate(
            product_count=Count('products', filter=Q(products__is_available=True))
        )
        categories_list = list(queryset)  # Force evaluation
        print("Debug - Categories found:", len(categories_list))
        for cat in categories_list:
            print(f"Category: {cat.name}, Products: {cat.product_count}")
        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        print("Debug - Response data:", response.data)
        return response

class ProductFilter(django_filters.FilterSet):
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    category = django_filters.CharFilter(field_name='category__slug')
    inStock = django_filters.BooleanFilter(field_name='stock', lookup_expr='gt', exclude=True)

    class Meta:
        model = Product
        fields = ['category', 'is_available', 'price_min', 'price_max', 'inStock']

from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().prefetch_related('images')
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'price', 'name']
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = super().get_queryset()
        category_slug = self.request.query_params.get('category', None)
        if (category_slug):
            queryset = queryset.filter(category__slug=category_slug)
        return queryset
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_products = Product.objects.filter(is_feature=True).prefetch_related('images')
        serializer = self.get_serializer(featured_products, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def delete_image(self, request, slug=None):
        image_id = request.data.get('image_id')
        try:
            image = ProductImage.objects.get(id=image_id, product__slug=slug)
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProductImage.DoesNotExist:
            return Response(
                {"error": "Image not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if query:
            products = Product.objects.filter(
                Q(name__icontains=query) | 
                Q(description__icontins=query) |
                Q(category__name__icontains=query)
            ).distinct()
            serializer = ProductListSerializer(products, many=True, context={'request': request})
            return Response(serializer.data)
        return Response([])

    @action(detail=False, methods=['get'])
    def popular(self, request):
        one_week_ago = timezone.now() - timedelta(days=7)
        
        popular_products = Product.objects.annotate(
            weekly_orders=Count(
                'orderitem',
                filter=Q(
                    orderitem__order__created_at__gte=one_week_ago,
                    orderitem__order__order_status='DELIVERED'  # Changed to match Order model
                )
            )
        ).filter(
            weekly_orders__gt=0
        ).order_by('-weekly_orders')[:6]

        serializer = self.get_serializer(popular_products, many=True)
        return Response(serializer.data)

class CartViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action in ['guest_cart', 'add_guest_item']:
            return GuestCartSerializer
        return CartSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Cart.objects.filter(user=self.request.user)
        return Cart.objects.none()

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        cart = self.get_object()
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            product = Product.objects.get(id=product_id)
            
            # Check if product is in stock
            if not product.is_in_stock:
                return Response(
                    {'error': 'Product is out of stock'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if there's sufficient stock
            if not product.has_sufficient_stock(quantity):
                return Response(
                    {'error': f'Only {product.stock} items available'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not created:
                new_quantity = cart_item.quantity + quantity
                if not product.has_sufficient_stock(new_quantity):
                    return Response(
                        {'error': f'Cannot add more items. Only {product.stock} available'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                cart_item.quantity = new_quantity
                cart_item.save()
            
            cart.refresh_from_db()
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
            
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def update_item(self, request, pk=None):
        cart = self.get_object()
        cart_item_id = request.data.get('cart_item_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
            product = cart_item.product
            
            # Check if product is in stock
            if not product.is_in_stock:
                return Response(
                    {'error': 'Product is out of stock'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if there's sufficient stock
            if not product.has_sufficient_stock(quantity):
                return Response(
                    {'error': f'Only {product.stock} items available'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            cart_item.quantity = quantity
            cart_item.save()
            
            cart.refresh_from_db()
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
            
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def remove_item(self, request, pk=None):
        cart = self.get_object()
        cart_item_id = request.data.get('cart_item_id')
        
        try:
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
            cart_item.delete()
            
            cart.refresh_from_db()
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
            
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def clear(self, request, pk=None):
        cart = self.get_object()
        cart.items.all().delete()
        
        cart.refresh_from_db()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def migrate_cart(self, request):
        """Migrate guest cart to user cart"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "User not authenticated"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        user_session_id = request.data.get('user_session_id')
        if not user_session_id:
            return Response(
                {"error": "Missing user session ID"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # First check if user already has a cart
            user_cart = Cart.objects.get_or_create(user=request.user)[0]

            # Then check for guest cart
            try:
                guest_cart = GuestCart.objects.get(user_session_id=user_session_id)
            except GuestCart.DoesNotExist:
                # If no guest cart exists, just return the empty user cart
                return Response(CartSerializer(user_cart).data)

            # Migrate items if guest cart exists
            for guest_item in guest_cart.items.all():
                cart_item, created = CartItem.objects.get_or_create(
                    cart=user_cart,
                    product=guest_item.product,
                    defaults={'quantity': guest_item.quantity}
                )
                if not created:
                    cart_item.quantity += guest_item.quantity
                    cart_item.save()

            # Delete guest cart after successful migration
            guest_cart.delete()

            return Response(CartSerializer(user_cart).data)

        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def add_guest_item(self, request):
        """Add item to guest cart, creating cart if needed"""
        user_session_id = request.data.get('user_session_id')
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)

        if not user_session_id or not product_id:
            return Response(
                {"error": "Missing required fields"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Clean up expired carts first
            GuestCart.cleanup_expired_carts()

            # Get or create guest cart
            guest_cart = GuestCart.objects.filter(
                user_session_id=user_session_id,
                expires_at__gt=timezone.now()
            ).first()

            if not guest_cart:
                guest_cart = GuestCart.objects.create(
                    session_id=f"guest_{timezone.now().timestamp()}_{user_session_id}",
                    user_session_id=user_session_id
                )

            # Add item to cart
            product = Product.objects.get(id=product_id)
            cart_item, created = GuestCartItem.objects.get_or_create(
                cart=guest_cart,
                product=product,
                defaults={'quantity': quantity}
            )

            if not created:
                cart_item.quantity += quantity
                cart_item.save()

            serializer = GuestCartSerializer(guest_cart)
            return Response(serializer.data)

        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def guest_cart(self, request):
        """Get guest cart if it exists and is not expired"""
        user_session_id = request.query_params.get('user_session_id')
        
        if not user_session_id:
            return Response(
                {"error": "Missing user_session_id"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Clean up expired carts
        GuestCart.cleanup_expired_carts()

        try:
            cart = GuestCart.objects.get(
                user_session_id=user_session_id,
                expires_at__gt=timezone.now()
            )
            serializer = GuestCartSerializer(cart)
            return Response(serializer.data)
        except GuestCart.DoesNotExist:
            return Response(
                {"error": "No active cart found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

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