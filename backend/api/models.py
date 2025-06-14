from uuid import uuid4
from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import MinValueValidator
from django.utils.text import slugify
from django.utils import timezone
from datetime import timedelta
import random
from django.db.models import Count
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError

class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, password, **extra_fields)

class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('CUSTOMER', 'Customer'),
    )
    
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='CUSTOMER')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # OTP fields for registration and login verification
    otp = models.CharField(max_length=6, null=True, blank=True)
    otp_generated_at = models.DateTimeField(null=True, blank=True)
    
    # Add related_name to avoid clash with auth.User
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        related_name='custom_user_set',
        related_query_name='custom_user'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        related_name='custom_user_set',
        related_query_name='custom_user'
    )

    objects = CustomUserManager()
    
    def __str__(self):
        return self.username
    
    def generate_otp(self):
        """Generate a random 6-digit OTP and save it"""
        self.otp = str(random.randint(100000, 999999))
        self.otp_generated_at = timezone.now()
        self.save()
        return self.otp
    
    def verify_otp(self, otp):
        """Verify the OTP and its validity"""
        if not self.otp or not self.otp_generated_at:
            return False
        
        # Check if OTP is expired (2 hours validity)
        time_difference = timezone.now() - self.otp_generated_at
        if time_difference.total_seconds() > 7200:  # 2 hours in seconds
            return False
        
        return self.otp == otp

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_feature = models.BooleanField(default=False)
    stock = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)

    def get_reserved_quantity(self):
        """Get quantity reserved in active carts"""
        active_window = timezone.now() - timedelta(hours=1)  # Consider carts active in last hour
        return CartItem.objects.filter(
            product=self,
            cart__status='active',
            cart__updated_at__gte=active_window
        ).aggregate(
            total=models.Sum('quantity')
        )['total'] or 0

    def get_available_stock(self):
        """Get actual available stock minus reserved quantities"""
        return max(0, self.stock - self.get_reserved_quantity())

    def is_available_for_quantity(self, requested_quantity, current_cart=None):
        """Check if requested quantity is available considering current reservations"""
        current_cart_quantity = 0
        if current_cart:
            cart_item = current_cart.items.filter(product=self).first()
            current_cart_quantity = cart_item.quantity if cart_item else 0
        
        # Exclude current cart's quantity from reserved count
        other_reservations = self.get_reserved_quantity() - current_cart_quantity
        actual_available = self.stock - other_reservations
        
        return self.is_available and actual_available >= requested_quantity

    def save(self, *args, **kwargs):
        
        if not self.slug:
            # Generate base slug from name
            base_slug = slugify(self.name)
            
            # Check for existing slugs
            unique_slug = base_slug
            n = 1
            while Product.objects.filter(slug=unique_slug).exists():
                # If exists, append a number but keep it clean
                unique_slug = f"{base_slug}-{n}"
                n += 1
            self.slug = unique_slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def weekly_order_count(self):
        one_week_ago = timezone.now() - timedelta(days=7)
        return self.orderitem_set.filter(
            order__created_at__gte=one_week_ago,
            order__order_status='DELIVERED'  # Changed to match Order model's status
        ).aggregate(
            total_orders=Count('id')
        )['total_orders'] or 0  # Added default value of 0

    @property
    def is_in_stock(self):
        return self.stock > 0 and self.is_available

    def has_sufficient_stock(self, requested_quantity):
        return self.stock >= requested_quantity

class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Image for {self.product.name}"

class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='cart'
    )

    CART_STATUS = (
        ('active', 'Active'),
        ('abandoned', 'Abandoned'),
        ('converted', 'Converted to Order')
    )

    status = models.CharField(
        max_length=20,
        choices=CART_STATUS,
        default='active'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def mark_abandoned(self):
        """Mark cart as abandoned and release reserved stock"""
        self.status = 'abandoned'
        self.save()

    session_id = models.CharField(max_length=100, null=True, blank=True)
    cart_type = models.CharField(
        max_length=20,
        choices=(
            ('guest', 'Guest Cart'),
            ('authenticated', 'Authenticated Cart')
        ),
        default='guest'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user'],
                condition=models.Q(user__isnull=False),
                name='unique_user_cart'
            ),
            models.UniqueConstraint(
                fields=['session_id'],
                condition=models.Q(session_id__isnull=False),
                name='unique_guest_cart'
            )
        ]

    @classmethod
    def cleanup_expired_carts(cls):
        """Clean up guest carts older than 24 hours"""
        expiry_time = timezone.now() - timedelta(hours=24)
        cls.objects.filter(
            cart_type='guest',
            created_at__lt=expiry_time
        ).delete()

    @property
    def total(self):
        return sum(item.total_price for item in self.items.all())

    def __str__(self):
        return f"Cart {'User: ' + self.user.username if self.user else 'Guest: ' + str(self.session_id)}"

    def save(self, *args, **kwargs):
        if self.user:
            self.cart_type = 'authenticated'
            self.session_id = None
        super().save(*args, **kwargs)

    @property
    def total_price(self):
        return sum(item.total_price for item in self.items.all())

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_price(self):
        return self.quantity * (self.product.discount_price or self.product.price)

def get_expiry_time():
    return timezone.now() + timedelta(hours=24)


class Order(models.Model):
    ORDER_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    
    PAYMENT_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )
    
    PAYMENT_METHOD_CHOICES = (
        ('CREDIT_CARD', 'Credit Card'),
        ('PAYPAL', 'PayPal'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('M-Pesa', 'M-Pesa'),  # Updated to consistent format
    )
    
    # User Information
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone_number = models.CharField(max_length=15)
    
    # Shipping Information
    address = models.TextField()
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    delivery_location = models.CharField(max_length=255, blank=True, null=True)
    is_pickup = models.BooleanField(default=False)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    
    # Order Information
    order_total = models.DecimalField(max_digits=10, decimal_places=2)
    order_notes = models.TextField(blank=True, null=True)
    order_status = models.CharField(
        max_length=20,
        choices=ORDER_STATUS_CHOICES,
        default='PENDING'
    )
    
    # Payment Information
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='PENDING'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class DeliveryAreaChoices(models.TextChoices):
        # Add PICKUP as the first choice
        PICKUP = 'PICKUP', _('Pickup')
        
        # CBD Areas
        KENCOM = 'KENCOM', _('Kencom')
        KENYATTA_AVE = 'KENYATTA_AVE', _('Kenyatta Avenue')
        MOI_AVE = 'MOI_AVE', _('Moi Avenue')
        TOM_MBOYA = 'TOM_MBOYA', _('Tom Mboya Street')
        MAMA_NGINA = 'MAMA_NGINA', _('Mama Ngina Street')
        KIMATHI = 'KIMATHI', _('Kimathi Street')
        STANDARD_ST = 'STANDARD_ST', _('Standard Street')
        BAZAAR_ST = 'BAZAAR_ST', _('Bazaar Street')
        BIASHARA_ST = 'BIASHARA_ST', _('Biashara Street')

        # Government CBD Areas
        PARLIAMENT_RD = 'PARLIAMENT_RD', _('Parliament Road')
        HARAMBEE_AVE = 'HARAMBEE_AVE', _('Harambee Avenue')
        WABERA = 'WABERA', _('Wabera Street')
        CENTRAL_POLICE = 'CENTRAL_POLICE', _('Central Police Station Area')
        PARLIAMENT_BUILDINGS = 'PARLIAMENT_BUILDINGS', _('Parliament Buildings')
        SUPREME_COURT = 'SUPREME_COURT', _('Supreme Court Area')
        CITY_HALL = 'CITY_HALL', _('Nairobi City Hall')

        # Financial and Administrative CBD Areas
        NSE = 'NSE', _('Nairobi Securities Exchange')
        KICC = 'KICC', _('Kenyatta International Convention Centre')
        CENTRAL_BANK = 'CENTRAL_BANK', _('Central Bank of Kenya')

        # Outskirts - Residential and Satellite Towns
        # Kiambu County
        KIAMBU = 'KIAMBU', _('Kiambu Town')
        RUIRU = 'RUIRU', _('Ruiru')
        THIKA = 'THIKA', _('Thika')
        LIMURU = 'LIMURU', _('Limuru')
        KIKUYU = 'KIKUYU', _('Kikuyu')
        GITHUNGURI = 'GITHUNGURI', _('Githunguri')
        
        # Machakos County
        MACHAKOS = 'MACHAKOS', _('Machakos Town')
        ATHI_RIVER = 'ATHI_RIVER', _('Athi River (Mavoko)')
        SYOKIMAU = 'SYOKIMAU', _('Syokimau')
        KATANI = 'KATANI', _('Katani')
        
        # Kajiado County
        KITENGELA = 'KITENGELA', _('Kitengela')
        ONGATA_RONGAI = 'ONGATA_RONGAI', _('Ongata Rongai')
        KISERIAN = 'KISERIAN', _('Kiserian')
        NGONG = 'NGONG', _('Ngong')

    class LocationType(models.TextChoices):
        CBD = 'CBD', _('Central Business District')
        COMMERCIAL = 'COMMERCIAL', _('Commercial Area')
        GOVERNMENT = 'GOVERNMENT', _('Government Area')
        RESIDENTIAL = 'RESIDENTIAL', _('Residential Area')
        INDUSTRIAL = 'INDUSTRIAL', _('Industrial Area')
        SATELLITE_TOWN = 'SATELLITE_TOWN', _('Satellite Town')
        SUBURBAN = 'SUBURBAN', _('Suburban Area')
        RURAL = 'RURAL', _('Rural Area')

    # Add new delivery-related fields
    delivery_location = models.CharField(
        max_length=50,
        choices=DeliveryAreaChoices.choices,
        help_text='Delivery destination',
        default='KENCOM'
    )
    location_type = models.CharField(
        max_length=20,
        choices=LocationType.choices,
        help_text='Type of location',
        default=LocationType.CBD
        
    )
    delivery_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    special_instructions = models.TextField(
        blank=True,
        null=True,
        help_text='Any special delivery instructions'
    )

    # Add the location type mapping
    AREA_LOCATION_TYPE_MAP = {
        # Add Pickup mapping
        DeliveryAreaChoices.PICKUP: LocationType.COMMERCIAL,  # or another appropriate type
        
        # Existing mappings
        DeliveryAreaChoices.KENCOM: LocationType.COMMERCIAL,
        DeliveryAreaChoices.KENYATTA_AVE: LocationType.COMMERCIAL,
        DeliveryAreaChoices.MOI_AVE: LocationType.COMMERCIAL,
        DeliveryAreaChoices.TOM_MBOYA: LocationType.COMMERCIAL,
        DeliveryAreaChoices.MAMA_NGINA: LocationType.COMMERCIAL,
        DeliveryAreaChoices.KIMATHI: LocationType.COMMERCIAL,
        DeliveryAreaChoices.STANDARD_ST: LocationType.COMMERCIAL,
        DeliveryAreaChoices.BAZAAR_ST: LocationType.COMMERCIAL,
        DeliveryAreaChoices.BIASHARA_ST: LocationType.COMMERCIAL,

        # Government Areas
        DeliveryAreaChoices.PARLIAMENT_RD: LocationType.GOVERNMENT,
        DeliveryAreaChoices.HARAMBEE_AVE: LocationType.GOVERNMENT,
        DeliveryAreaChoices.WABERA: LocationType.GOVERNMENT,
        DeliveryAreaChoices.CENTRAL_POLICE: LocationType.GOVERNMENT,
        DeliveryAreaChoices.PARLIAMENT_BUILDINGS: LocationType.GOVERNMENT,
        DeliveryAreaChoices.SUPREME_COURT: LocationType.GOVERNMENT,
        DeliveryAreaChoices.CITY_HALL: LocationType.GOVERNMENT,

        # Financial Areas
        DeliveryAreaChoices.NSE: LocationType.COMMERCIAL,
        DeliveryAreaChoices.KICC: LocationType.COMMERCIAL,
        DeliveryAreaChoices.CENTRAL_BANK: LocationType.GOVERNMENT,

        # Outskirts - Residential
        DeliveryAreaChoices.KIAMBU: LocationType.RESIDENTIAL,
        DeliveryAreaChoices.RUIRU: LocationType.RESIDENTIAL,
        DeliveryAreaChoices.THIKA: LocationType.RESIDENTIAL,
        DeliveryAreaChoices.LIMURU: LocationType.RESIDENTIAL,
        DeliveryAreaChoices.KIKUYU: LocationType.RESIDENTIAL,
        DeliveryAreaChoices.GITHUNGURI: LocationType.RESIDENTIAL,

        # Machakos County
        DeliveryAreaChoices.MACHAKOS: LocationType.RESIDENTIAL,
        DeliveryAreaChoices.ATHI_RIVER: LocationType.SUBURBAN,
        DeliveryAreaChoices.SYOKIMAU: LocationType.SUBURBAN,
        DeliveryAreaChoices.KATANI: LocationType.RESIDENTIAL,

        # Kajiado County
        DeliveryAreaChoices.KITENGELA: LocationType.SUBURBAN,
        DeliveryAreaChoices.ONGATA_RONGAI: LocationType.RESIDENTIAL,
        DeliveryAreaChoices.KISERIAN: LocationType.RESIDENTIAL,
        DeliveryAreaChoices.NGONG: LocationType.RESIDENTIAL,
    }

    def calculate_delivery_fee(self):
        """Calculate delivery fee based on location type"""
        if self.delivery_location == self.DeliveryAreaChoices.PICKUP:
            return 0.00  # No delivery fee for pickup
        elif self.location_type in ['CBD', 'COMMERCIAL', 'GOVERNMENT']:
            return 150.00
        elif self.location_type in ['RESIDENTIAL', 'SUBURBAN']:
            return 300.00
        return 500.00  # Rural or other areas

    def save(self, *args, **kwargs):
        # Set location type based on delivery location
        self.location_type = self.AREA_LOCATION_TYPE_MAP.get(
            self.delivery_location,
            self.LocationType.RESIDENTIAL
        )
        # Calculate delivery fee
        if not self.delivery_fee:
            self.delivery_fee = self.calculate_delivery_fee()
        # Update order total to include delivery fee
        self.order_total = float(self.order_total) + float(self.delivery_fee)
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Order {self.id} - {self.full_name}"
    
    @property
    def total_items(self):
        return self.items.aggregate(
            total_items=models.Sum('quantity')
        )['total_items'] or 0
    
    @property
    def status_display(self):
        return dict(self.ORDER_STATUS_CHOICES)[self.order_status]
    
    @property
    def payment_status_display(self):
        return dict(self.PAYMENT_STATUS_CHOICES)[self.payment_status]
    
    def mark_as_paid(self):
        self.payment_status = 'COMPLETED'
        self.save()
    
    def mark_as_delivered(self):
        self.order_status = 'DELIVERED'
        self.save()

    def complete_order(self):
        """
        Mark order as complete and trigger stock update
        """
        self.status = 'COMPLETED'
        self.save()

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of purchase
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

class Wishlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['user', 'product'], ['session_id', 'product']]
        
    def __str__(self):
        return f"Wishlist item for {self.user or self.session_id}"

class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.email

    class Meta:
        ordering = ['-created_at']