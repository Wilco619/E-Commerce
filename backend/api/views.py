# views.py
import logging
import random
import uuid
from datetime import timedelta

from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .permissions import CartPermission

# Django imports
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db.models import (Case, When, F, Value, DecimalField, Count, Q, Sum)
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.http import Http404
from django.db import transaction, IntegrityError

# Django Rest Framework imports
from rest_framework import (
    viewsets, status, filters
)
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.generics import GenericAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

# Third-party imports
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters

# Local imports
from .permissions import IsAdminOrReadOnly
from .utils import send_newsletter_confirmation, send_otp_email
from .models import (Category, Product, Cart, CartItem, Order, OrderItem,
    ProductImage, Wishlist
)
from .serializers import (
    OTPSerializer, PasswordChangeSerializer, UserLoginSerializer,
    UserRegistrationSerializer, UserProfileSerializer, CategorySerializer,
    ProductListSerializer, ProductDetailSerializer, CartSerializer,
    OrderSerializer, CheckoutSerializer,
    NewsletterSubscriberSerializer, WishlistSerializer
)

# Get the custom user model
CustomUser = get_user_model()

# Setup logging
logger = logging.getLogger(__name__)

class UserRegistrationView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def migrate_guest_cart(self, request, user):
        session_id = request.session.session_key
        if (session_id):
            try:
                guest_cart = Cart.objects.get(session_id=session_id)
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
            except Cart.DoesNotExist:
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
            print(f"username{user.username} email{user.email} otp{otp}")
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

    def migrate_cart(self, user_session_id, user):
        """Migrate guest cart to authenticated user cart"""
        try:
            with transaction.atomic():
                guest_cart = Cart.objects.filter(
                    session_id=user_session_id,
                    cart_type='guest'
                ).first()

                if not guest_cart:
                    return True

                user_cart, _ = Cart.objects.get_or_create(
                    user=user,
                    cart_type='authenticated',
                    defaults={'session_id': None}
                )

                for item in guest_cart.items.all():
                    cart_item, created = CartItem.objects.get_or_create(
                        cart=user_cart,
                        product=item.product,
                        defaults={'quantity': item.quantity}
                    )
                    if not created:
                        cart_item.quantity += item.quantity
                        cart_item.save()

                guest_cart.delete()
                return True

        except Exception as e:
            logger.error(f"Cart migration error: {str(e)}")
            return False

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user_id = serializer.validated_data.get('user_id')
            user = CustomUser.objects.get(id=user_id)
            
            # Verify OTP and generate tokens
            refresh = RefreshToken.for_user(user)
            tokens = {
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            }

            # Migrate cart if session ID exists
            user_session_id = request.data.get('user_session_id')
            cart_migrated = self.migrate_cart(user_session_id, user) if user_session_id else False

            return Response({
                **tokens,
                'cart_migrated': cart_migrated,
                'user_id': user.id
            })

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
        ).prefetch_related('products__images')  # Add this line to prefetch images

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            # Check if category has products/prevent delete category with products
            if instance.products.exists():
                return Response(
                    {"error": "Cannot delete category with existing products"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # If category has no existing products then delete is successful
            self.perform_destroy(instance)
            return Response(
                {"message": "Category deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get'])
    def products(self, request, slug=None):
        try:
            category = self.get_object()
            queryset = Product.objects.filter(category=category)\
                .prefetch_related('images')\
                .select_related('category')\
                .order_by('id')  # Add default ordering by id
            
            # Apply filters
            search = request.query_params.get('search', '')
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(description__icontains=search)
                )
            
            in_stock = request.query_params.get('in_stock', '')
            if (in_stock.lower() == 'true'):
                queryset = queryset.filter(stock__gt=0, is_available=True)
            
            price_min = request.query_params.get('price_min')
            price_max = request.query_params.get('price_max')
            if price_min:
                queryset = queryset.filter(price__gte=price_min)
            if price_max:
                queryset = queryset.filter(price__lte=price_max)
            
            # Apply custom ordering if specified, otherwise keep default
            ordering = request.query_params.get('ordering', '')
            if ordering:
                queryset = queryset.order_by(ordering)
            
            page = self.paginate_queryset(queryset)
            
            # Add debug logging
            logger.debug(f"Number of products found: {queryset.count()}")
            logger.debug(f"Image URLs: {[p.images.all() for p in page]}")
            
            # Add context to include request for full image URLs
            context = {'request': request}
            serializer = ProductListSerializer(page, many=True, context=context)
            
            response = self.get_paginated_response(serializer.data)
            
            # Add category details to response
            response.data['category'] = {
                'id': category.id,
                'name': category.name,
                'slug': category.slug,
                'description': category.description
            }
            
            return response
            
        except Category.DoesNotExist:
            return Response(
                {'error': 'Category not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in category products: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ProductFilter(django_filters.FilterSet):
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    category = django_filters.CharFilter(field_name='category__slug')
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    
    class Meta:
        model = Product
        fields = ['category', 'price_min', 'price_max', 'in_stock']
    
    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0, is_available=True)
        return queryset

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'price', 'name']
    lookup_field = 'slug'
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = Product.objects.all()
        search = self.request.query_params.get('search', None)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(category__name__icontains=search)
            )
        
        # ...rest of filtering logic...
        
        return queryset

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['featured', 'popular', 'list', 'retrieve', 'search']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAdminOrReadOnly]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductDetailSerializer
        return ProductListSerializer

    def create(self, request, *args, **kwargs):
        try:
            # Get the images from the request
            images = request.FILES.getlist('images[]')
            
            # Create the product first
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            product = serializer.save()

            # Then create the product images
            for image in images:
                ProductImage.objects.create(
                    product=product,
                    image=image
                )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            # Get the images from the request
            images = request.FILES.getlist('images[]')
            
            # Update the product first
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            product = serializer.save()

            # Then create the new product images
            for image in images:
                ProductImage.objects.create(
                    product=product,
                    image=image
                )

            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_update(self, serializer):
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_products = Product.objects.filter(is_feature=True).prefetch_related('images')
        serializer = self.get_serializer(featured_products, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def delete_image(self, request,):
        image_id = request.data.get('image_id')
        try:
            image = ProductImage.objects.get(id=image_id)
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
                Q(description__icontains=(query) |
                Q(category__name__icontains=query)
            )).distinct()
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

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            slug = instance.slug
            self.perform_destroy(instance)
            return Response(
                {"message": f"Product '{slug}' deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )
        except Http404:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting product: {str(e)}")
            return Response(
                {"error": "Failed to delete product"},
                status=status.HTTP_400_BAD_REQUEST
            )

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    
    def get_permissions(self):
        """
        Set custom permissions:
        - Allow anonymous access for guest cart operations
        - Require authentication for user cart operations
        """
        if self.action in ['current', 'add_item', 'update_item', 'remove_item', 'clear_cart', 'migrate_cart']:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def current(self, request):
        """Get current cart based on authentication status"""
        try:
            cart = self._get_or_create_cart(request)
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_or_create_cart(self, request):
        """Helper method to get or create appropriate cart"""
        try:
            if request.user.is_authenticated:
                cart, _ = Cart.objects.get_or_create(
                    user=request.user,
                    cart_type='authenticated'
                )
            else:
                session_id = request.query_params.get('user_session_id') or request.data.get('user_session_id')
                if not session_id:
                    raise ValueError("Session ID required for guest cart")
                cart, _ = Cart.objects.get_or_create(
                    session_id=session_id,
                    cart_type='guest',
                    defaults={'user': None}
                )
            return cart
        except Exception as e:
            logger.error(f"Error in _get_or_create_cart: {str(e)}")
            raise

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """Add item to current cart"""
        try:
            cart = self._get_or_create_cart(request)
            product_id = request.data.get('product_id')
            quantity = int(request.data.get('quantity', 1))

            product = Product.objects.get(id=product_id)
            if not product.is_available or product.stock < quantity:
                return Response(
                    {'error': 'Product is out of stock or unavailable'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )

            if not created:
                cart_item.quantity += quantity
                cart_item.save()

            cart.refresh_from_db()
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def get_cart(self, request):
        """Get current cart based on authentication status"""
        try:
            cart = self._get_or_create_cart(request)
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def update_item(self, request):
        """Update cart item quantity"""
        try:
            cart = self._get_or_create_cart(request)
            cart_item_id = request.data.get('cart_item_id')
            quantity = int(request.data.get('quantity', 1))

            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
            
            if not cart_item.product.has_sufficient_stock(quantity):
                return Response(
                    {'error': f'Only {cart_item.product.stock} items available'},
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

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """Remove item from cart"""
        try:
            cart = self._get_or_create_cart(request)
            cart_item_id = request.data.get('cart_item_id')
            
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
            cart_item.delete()
            
            cart.refresh_from_db()
            serializer = self.get_serializer(cart)
            return Response(serializer.data)

        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'], url_path='clear')
    def clear_cart(self, request):
        """Clear all items from cart"""
        try:
            cart = self._get_or_create_cart(request)
            cart.items.all().delete()
            
            cart.refresh_from_db()
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error clearing cart: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    
    @action(detail=False, methods=['post'], url_path='migrate')
    def migrate_cart(self, request):
        """Migrate guest cart to authenticated user cart"""
        try:
            if not request.user.is_authenticated:
                return Response(
                    {"error": "Authentication required"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            session_id = request.data.get('user_session_id')
            if not session_id:
                return Response(
                    {"error": "Session ID required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                # Get guest cart
                guest_cart = Cart.objects.filter(
                    session_id=session_id,
                    cart_type='guest'
                ).first()

                if not guest_cart:
                    return Response({
                        "message": "No guest cart found",
                        "cart_migrated": False
                    })

                # Get or create user cart
                user_cart, _ = Cart.objects.get_or_create(
                    user=request.user,
                    cart_type='authenticated',
                    defaults={'session_id': None}
                )

                # Transfer items
                for item in guest_cart.items.all():
                    cart_item, created = CartItem.objects.get_or_create(
                        cart=user_cart,
                        product=item.product,
                        defaults={'quantity': item.quantity}
                    )
                    if not created:
                        cart_item.quantity += item.quantity
                        cart_item.save()

                # Delete guest cart
                guest_cart.delete()

                serializer = self.get_serializer(user_cart)
                return Response({
                    "message": "Cart migrated successfully",
                    "cart_migrated": True,
                    "cart": serializer.data
                })

        except Exception as e:
            logger.error(f"Cart migration error: {str(e)}")
            return Response({
                "error": str(e),
                "cart_migrated": False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        try:
            # Get time ranges
            today = timezone.now()
            start_of_month = today.replace(day=1, hour=0, minute=0, second=0)
            
            # Sales Overview Data
            monthly_sales = Order.objects.filter(
                created_at__gte=start_of_month,
                payment_status='COMPLETED'
            ).values('created_at__date').annotate(
                orders=Count('id'),
                revenue=Sum('order_total')
            ).order_by('created_at__date')

            # Product Performance Data - Modified to handle missing cost_price
            top_products = OrderItem.objects.values(
                'product__id',
                'product__name',
                'product__price'  # Use price instead of cost_price
            ).annotate(
                sales=Count('id'),
                profit=Sum(Case(
                    When(
                        order__payment_status='COMPLETED',
                        then=F('total') * Value(0.2)  # Assume 20% profit margin
                    ),
                    default=Value(0),
                    output_field=DecimalField()
                )),
                returns=Count('id', filter=Q(order__order_status='CANCELLED')),
                total_revenue=Sum(Case(
                    When(
                        order__payment_status='COMPLETED',
                        then=F('total')
                    ),
                    default=Value(0),
                    output_field=DecimalField()
                ))
            ).filter(
                product__isnull=False
            ).order_by('-sales')[:5]

            # Category Distribution Data
            category_distribution = OrderItem.objects.values(
                'product__category__name'
            ).annotate(
                value=Count('id'),
                total_sales=Sum('total')
            ).order_by('-value')

            # Calculate percentages for category distribution
            total_orders = sum(cat['value'] for cat in category_distribution)
            for cat in category_distribution:
                cat['percentage'] = round((cat['value'] / total_orders * 100), 2)

            # Additional stats
            total_revenue = Order.objects.filter(
                payment_status='COMPLETED'
            ).aggregate(
                total=Sum('order_total')
            )['total'] or 0

            total_orders = Order.objects.filter(
                payment_status='COMPLETED'
            ).count()

            low_stock_products = Product.objects.filter(
                stock__lte=5  # Using fixed value instead of minimum_stock
            ).count()

            dashboard_data = {
                'sales_overview': list(monthly_sales),
                'product_performance': list(top_products),
                'category_distribution': category_distribution,
                'summary': {
                    'total_revenue': float(total_revenue),
                    'total_orders': total_orders,
                    'low_stock_products': low_stock_products
                }
            }

            return Response(dashboard_data)
            
        except Exception as e:
            logger.error(f"Dashboard data error: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to fetch dashboard data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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

# Add these classes to your views.py file
class ForgotPasswordView(GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = CustomUser.objects.get(email=email)
            
            # Generate password reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Create reset URL
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            
            # Send password reset email
            html_message = render_to_string('emails/password_reset.html', {
                'user': user,
                'reset_url': reset_url,
                'valid_hours': 24
            })
            
            plain_message = strip_tags(html_message)
            
            send_mail(
                'Password Reset Request',
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            return Response({
                'message': 'Password reset email has been sent.',
                'email': email
            }, status=status.HTTP_200_OK)
            
        except CustomUser.DoesNotExist:
            # Return success even if email doesn't exist for security
            return Response({
                'message': 'If an account exists with this email, a password reset link will be sent.',
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Password reset email error: {str(e)}")
            return Response({
                'error': 'Failed to send password reset email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutView(APIView):
    permission_classes = (AllowAny,)

    def create_guest_session(self):
        """Create a new guest session ID"""
        return str(uuid.uuid4())

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Blacklist the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            # Create new guest session and cart
            new_session_id = self.create_guest_session()
            expires_at = timezone.now() + timedelta(hours=24)
            
            guest_cart = Cart.objects.create(
                user_session_id=new_session_id,
                session_id=new_session_id,
                expires_at=expires_at
            )
            
            return Response({
                "message": "Successfully logged out",
                "guest_session_id": new_session_id
            }, status=status.HTTP_200_OK)
            
        except TokenError as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response(
                {"error": "Failed to logout"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST
import json

@ensure_csrf_cookie
def set_csrf_token(request):
    """
    This view does nothing but ensure that the CSRF cookie is set.
    This is useful for the React app to have the CSRF token.
    """
    return JsonResponse({'message': 'CSRF cookie set'})

@require_POST
def set_user_preferences(request):
    """
    Set user preferences in cookies.
    Expects a JSON body with preference key-value pairs.
    """
    try:
        data = json.loads(request.body)
        preferences = data.get('preferences', {})
        
        response = JsonResponse({'status': 'success', 'message': 'Preferences saved'})
        
        # Set each preference as a cookie
        for key, value in preferences.items():
            response.set_cookie(
                key=f'pref_{key}',
                value=value,
                max_age=31536000,  # 1 year in seconds
                httponly=False,  # Allow JavaScript access
                secure=request.is_secure(),  # Only secure in production
                samesite='Lax'
            )
        
        return response
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@require_POST
def set_user_session(request):
    """
    Set session data for authenticated users.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Not authenticated'}, status=401)
    
    try:
        data = json.loads(request.body)
        
        # Store data in session
        for key, value in data.items():
            request.session[key] = value
        
        return JsonResponse({'status': 'success', 'message': 'Session updated'})
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

def get_user_preferences(request):
    """
    Get all user preferences from cookies.
    """
    preferences = {}
    
    for key in request.COOKIES:
        if key.startswith('pref_'):
            clean_key = key[5:]  # Remove 'pref_' prefix
            preferences[clean_key] = request.COOKIES[key]
    
    return JsonResponse({'preferences': preferences})

def delete_user_preference(request, preference_key):
    """
    Delete a specific user preference cookie.
    """
    response = JsonResponse({'status': 'success', 'message': f'Preference {preference_key} deleted'})
    
    cookie_key = f'pref_{preference_key}'
    if cookie_key in request.COOKIES:
        response.delete_cookie(cookie_key)
    
    return response

# Add this to your existing views.py

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Wishlist.objects.filter(user=self.request.user).select_related('product')
        return Wishlist.objects.none()

    @action(detail=False, methods=['get'])
    def items(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=400)

        try:
            wishlist_item = Wishlist.objects.filter(
                user=request.user,
                product_id=product_id
            ).first()

            if wishlist_item:
                wishlist_item.delete()
                return Response({'status': 'removed'})
            else:
                Wishlist.objects.create(
                    user=request.user,
                    product_id=product_id
                )
                return Response({'status': 'added'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['post'])
    def migrate(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)

        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'Session ID is required'}, status=400)

        try:
            # Move guest wishlist items to user's wishlist
            guest_items = Wishlist.objects.filter(session_id=session_id)
            for item in guest_items:
                Wishlist.objects.get_or_create(
                    user=request.user,
                    product=item.product
                )
            guest_items.delete()
            return Response({'status': 'migrated'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    def get_permissions(self):
        if self.action in ['items', 'toggle', 'migrate']:
            return [IsAuthenticated()]
        return super().get_permissions()