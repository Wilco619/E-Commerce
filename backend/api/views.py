# views.py
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

import logging
import random

from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta


from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Sum
from .models import GuestCart, GuestCartItem, Order, OrderItem, Product
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
    CartSerializer,OrderSerializer, CheckoutSerializer, GuestCartSerializer, NewsletterSubscriberSerializer
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
            serializer.is_valid(raise_exception=True)
            validated_data = serializer.validated_data
            
            # Create user without OTP
            user = CustomUser.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                user_type='CUSTOMER'
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
            
            user.save()
            
            # Migrate guest cart if exists
            self.migrate_guest_cart(request, user)
            
            return Response({
                'message': 'Registration successful. Please login to continue.',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
            
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
        try:
            serializer = self.get_serializer(data=request.data)
            
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            user = serializer.validated_data
            
            # Generate OTP
            otp = str(random.randint(100000, 999999))
            user.otp = otp
            user.otp_generated_at = timezone.now()
            user.save()
            
            # Store in session
            request.session['user_id'] = user.id
            request.session['otp'] = otp
            
            # Send the OTP via email
            if settings.SEND_OTP_VIA_EMAIL:
                send_success = send_otp_email(user.email, otp)
                if not send_success:
                    return Response(
                        {"error": "Failed to send OTP email. Please try again."},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            return Response({
                'message': 'OTP has been sent to your email.',
                'user_id': user.id,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
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
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return Category.objects.annotate(
            product_count=Count('products', filter=Q(products__is_available=True))
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class ProductFilter(django_filters.FilterSet):
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    category = django_filters.CharFilter(field_name='category__slug')
    inStock = django_filters.BooleanFilter(field_name='stock', lookup_expr='gt', exclude=True)

    class Meta:
        model = Product
        fields = ['category', 'is_available', 'price_min', 'price_max', 'inStock']



class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().prefetch_related('images')
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'price', 'name']
    lookup_field = 'slug'
    parser_classes = (MultiPartParser, FormParser)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductDetailSerializer
        return ProductListSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle the product data
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Handle image uploads
        images = request.FILES.getlist('images')
        if images:
            for image in images:
                ProductImage.objects.create(
                    product=instance,
                    image=image
                )

        return Response(serializer.data)
    
    def get_queryset(self):
        queryset = Product.objects.all()
        category_slug = self.request.query_params.get('category_slug', None)
        
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        return queryset

    def perform_update(self, serializer):
        serializer.save()
    
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
        try:
            # Get product IDs from OrderItem with count >= 5
            popular_product_ids = OrderItem.objects.values('product') \
                .annotate(order_count=Count('id')) \
                .filter(order_count__gte=5) \
                .values_list('product', flat=True)

            # Get the actual products
            popular_products = Product.objects.filter(
                id__in=popular_product_ids,
                is_available=True
            ).annotate(
                order_count=Count('orderitem')
            ).order_by('-order_count')

            # Log for debugging
            logger.debug(f"Found {popular_products.count()} popular products")
            for product in popular_products:
                logger.debug(f"Product {product.name}: {product.order_count} orders")

            serializer = self.get_serializer(popular_products, many=True)
            return Response({
                'results': serializer.data,
                'count': popular_products.count()
            })
        except Exception as e:
            logger.error(f"Error fetching popular products: {str(e)}")
            return Response(
                {'error': 'Failed to fetch popular products'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer

    def get_permissions(self):
        """
        Allow guest cart operations without authentication
        """
        if self.action in ['guest_cart', 'create_guest_cart', 'add_guest_item']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Cart.objects.filter(user=self.request.user)
        return Cart.objects.none()

    def create(self, request):
        # Create a new cart for authenticated user
        if request.user.is_authenticated:
            # Check if user already has a cart
            existing_cart = Cart.objects.filter(user=request.user).first()
            if (existing_cart):
                serializer = self.get_serializer(existing_cart)
                return Response(serializer.data)
            
            # Create new cart if none exists
            cart = Cart.objects.create(user=request.user)
            serializer = self.get_serializer(cart)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        try:
            cart = self.get_object()
            product_id = request.data.get('product_id')
            quantity = int(request.data.get('quantity', 1))

            # Validate product
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response(
                    {'error': 'Product not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check stock
            if not product.is_available or product.stock < quantity:
                return Response(
                    {'error': 'Product is out of stock or unavailable'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Add or update cart item
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )

            if not created:
                cart_item.quantity += quantity
                cart_item.save()

            serializer = self.get_serializer(cart)
            return Response(serializer.data)

        except Cart.DoesNotExist:
            return Response(
                {'error': 'Cart not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
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
            # Create a new guest cart if one doesn't exist
            cart = GuestCart.objects.create(
                user_session_id=user_session_id,
                session_id=f"guest_{timezone.now().timestamp()}_{user_session_id}"
            )
            serializer = GuestCartSerializer(cart)
            return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def get_guest_cart(self, request):
        session_id = request.query_params.get('user_session_id')
        if not session_id:
            return Response({'error': 'Session ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        cart = GuestCart.objects.filter(session_id=session_id).first()
        if not cart:
            return Response({'error': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = GuestCartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_guest_cart(self, request):
        session_id = request.data.get('user_session_id')
        if not session_id:
            return Response({'error': 'Session ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        cart = GuestCart.objects.create(session_id=session_id)
        serializer = GuestCartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

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
                send_otp_email(user.email, otp)
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

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import NewsletterSubscriberSerializer
from .utils import send_newsletter_confirmation, send_otp_email

@api_view(['POST'])
@permission_classes([AllowAny])
def subscribe_newsletter(request):
    serializer = NewsletterSubscriberSerializer(data=request.data)
    if serializer.is_valid():
        try:
            subscriber = serializer.save()
            # Send confirmation email
            email_sent = send_newsletter_confirmation(subscriber.email)
            
            if email_sent:
                return Response(
                    {'message': 'Successfully subscribed to newsletter! Please check your email for confirmation.'},
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'message': 'Subscribed successfully, but confirmation email could not be sent.'},
                    status=status.HTTP_201_CREATED
                )
        except Exception as e:
            return Response(
                {'error': 'This email is already subscribed'},
                status=status.HTTP_400_BAD_REQUEST
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)