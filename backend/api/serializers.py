# serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from datetime import timedelta
from django.utils import timezone
from django.conf import settings

import logging

from .models import (
    CustomUser, Category, Product, ProductImage, 
    Cart, CartItem, Order, OrderItem, GuestCart, GuestCartItem
)


logger = logging.getLogger(__name__)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'phone_number', 'address']
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True}
        }

    def validate(self, data):
        # Check if passwords match
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Passwords don't match."
            })
        
        # Remove password_confirm from the data
        if 'password_confirm' in data:
            data.pop('password_confirm')

        return data

    def validate_email(self, value):
        # Check if email already exists
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        # Check if username already exists
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            address=validated_data.get('address', ''),
            user_type='CUSTOMER',
        )
        return user

class UserLoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        logger.info("=== SERIALIZER VALIDATION STARTED ===")
        
        username_or_email = data.get('username_or_email')
        password = data.get('password')
        
        logger.info(f"Attempting login with username_or_email: {username_or_email}")
        
        # Try to authenticate with username
        logger.info("Trying authentication with username")
        user = authenticate(username=username_or_email, password=password)
        
        # If authentication with username fails, try with email
        if not user:
            logger.info("Username authentication failed, trying email")
            try:
                user_obj = CustomUser.objects.get(email=username_or_email)
                logger.info(f"Found user with email: {username_or_email}, username: {user_obj.username}")
                
                username = user_obj.username
                user = authenticate(username=username, password=password)
                logger.info(f"Email authentication result: {'Success' if user else 'Failed'}")
            except CustomUser.DoesNotExist:
                logger.error(f"No user found with email: {username_or_email}")
                pass
        
        if user and user.is_active:
            logger.info(f"Authentication successful for user: {user.username} (ID: {user.id})")
            # Return user directly for DEBUG purposes (this should be fixed in production)
            # Instead of returning user, you should return {'user': user}
            logger.info("Returning user object directly - this should be fixed in production")
            return user
        
        logger.error("Authentication failed: Incorrect Credentials")
        raise serializers.ValidationError("Incorrect Credentials")

class OTPSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    otp = serializers.CharField()

    def validate(self, data):
        user_id = data.get('user_id')
        otp = data.get('otp')

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User not found")

        # Check if OTP is expired
        if user.otp_generated_at and (timezone.now() - user.otp_generated_at) > timedelta(hours=2):
            raise serializers.ValidationError("OTP has expired")

        # Check if OTP is correct
        if user.otp != otp:
            raise serializers.ValidationError("Invalid OTP")

        return data

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct.")
        return value

    def validate_new_password(self, value):
        user = self.context['request'].user
        try:
            validate_password(value, user)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone_number', 'address', 'user_type']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        username = validated_data['username']
        if CustomUser.objects.filter(username=username).exists():
            raise ValidationError({"username": "This username is already taken."})

        user = CustomUser.objects.create_user(
            username=username,
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            address=validated_data.get('address', ''),
            user_type=validated_data.get('user_type', 'CUSTOMER'),
        )
        return user
    
    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.address = validated_data.get('address', instance.address)
        
        # Password update should be handled separately
        if 'password' in validated_data:
            instance.set_password(validated_data['password'])
        
        instance.save()
        return instance

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'address', 'user_type')
        read_only_fields = ('id', 'username', 'email', 'user_type')

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image')

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    feature_image = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    is_feature = serializers.BooleanField(required=False, default=False)
    is_available = serializers.BooleanField(required=False, default=True)
    weekly_orders = serializers.IntegerField(read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    stock = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 
            'discount_price', 'stock', 'is_in_stock', 
            'feature_image', 'category_name', 'is_available','is_feature','weekly_orders','images'
        ]

    def get_feature_image(self, obj):
        first_image = obj.images.first()
        if (first_image):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        return None

    def to_internal_value(self, data):
        # Convert string boolean values to actual booleans
        if 'is_feature' in data:
            data = data.copy()
            data['is_feature'] = str(data['is_feature']).lower() in ('true', '1', 't')
        if 'is_available' in data:
            data = data.copy()
            data['is_available'] = str(data['is_available']).lower() in ('true', '1', 't')
        return super().to_internal_value(data)

    def update(self, instance, validated_data):
        # Ensure is_feature is properly handled
        is_feature = validated_data.get('is_feature', instance.is_feature)
        validated_data['is_feature'] = bool(is_feature)
        
        instance = super().update(instance, validated_data)

        # Handle image uploads if any
        if self.context['request'].FILES:
            images_data = self.context['request'].FILES.getlist('images')
            for image in images_data:
                ProductImage.objects.create(product=instance, image=image)

        return instance

class ProductDetailSerializer(serializers.ModelSerializer):
    category = serializers.ReadOnlyField(source='category.name')
    images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)
    slug = serializers.SlugField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'product_count']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        print(f"Debug - Serializing category: {representation}")
        return representation

class CategoryDetailSerializer(CategorySerializer):
    products = ProductListSerializer(many=True, read_only=True, source='products.all')

    class Meta(CategorySerializer.Meta):
        fields = CategorySerializer.Meta.fields + ['products']

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    
    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_id', 'quantity', 'total_price')

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    total_items = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Cart
        fields = ('id', 'items', 'total_price', 'total_items', 'created_at', 'updated_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Calculate totals
        total_price = sum(item.total_price for item in instance.items.all())
        total_items = sum(item.quantity for item in instance.items.all())
        
        data['total_price'] = float(total_price)
        data['total_items'] = total_items
        return data

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'quantity', 'price', 'total')
        read_only_fields = ('price', 'total')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = ('id', 'full_name', 'email', 'phone_number', 'address', 'city', 
                  'postal_code', 'country', 'order_notes', 'order_total', 
                  'order_status', 'payment_status', 'payment_method', 
                  'tracking_number', 'created_at', 'updated_at', 'items',
                  'delivery_location', 'location_type', 'delivery_fee', 'special_instructions')
        read_only_fields = ('order_total', 'order_status', 'payment_status', 'tracking_number')

class CheckoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        exclude = ['user']  # exclude user field as it's set in the view
    
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request.user.is_authenticated else None
        
        # Get user's cart
        try:
            cart = Cart.objects.get(user=user)
        except Cart.DoesNotExist:
            raise serializers.ValidationError("No cart found for this user")
        
        if cart.items.count() == 0:
            raise serializers.ValidationError("Cart is empty")
        
        # Create order
        order_data = {
            'user': user,
            'order_total': cart.total_price,
            **validated_data
        }
        order = Order.objects.create(**order_data)
        
        # Create order items from cart items
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                price=cart_item.product.discount_price or cart_item.product.price,
                total=cart_item.total_price
            )
            
            # Reduce the stock quantity
            cart_item.product.stock -= cart_item.quantity
            cart_item.product.save()
        
        # Clear the cart
        cart.items.all().delete()
        
        return order

class GuestCartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuestCartItem
        fields = ['id', 'product', 'quantity']

class GuestCartSerializer(serializers.ModelSerializer):
    items = GuestCartItemSerializer(many=True, read_only=True)

    class Meta:
        model = GuestCart
        fields = ['id', 'session_id', 'items']