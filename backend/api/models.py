from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import MinValueValidator
from django.utils.text import slugify
from django.utils import timezone
import random
from django.db.models import Count
from datetime import timedelta
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
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def get_product_count(self):
        """Method to get product count instead of property"""
        return self.products.filter(is_available=True).count()

class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)
    is_feature = models.BooleanField(default=False)  # Remove null=True
    category = models.ForeignKey('Category', on_delete=models.CASCADE, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
            if not self.slug:
                self.slug = slugify(self.name)
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
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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

class GuestCart(models.Model):
    session_id = models.CharField(max_length=100, unique=True)
    user_session_id = models.CharField(
        max_length=100,
        default='legacy_session',
        help_text='Unique identifier for guest user session'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(default=get_expiry_time)

    class Meta:
        unique_together = ['session_id', 'user_session_id']

    def save(self, *args, **kwargs):
        if not self.pk:  # Only set expires_at for new instances
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"Guest Cart {self.session_id}"

    @classmethod
    def cleanup_expired_carts(cls):
        """Remove expired guest carts"""
        cls.objects.filter(expires_at__lt=timezone.now()).delete()

class GuestCartItem(models.Model):
    cart = models.ForeignKey(GuestCart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cart', 'product')

class Order(models.Model):
    ORDER_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
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
        # CBD Areas
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
        if self.location_type in ['CBD', 'COMMERCIAL', 'GOVERNMENT']:
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

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of purchase
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name}"