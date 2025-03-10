from django.contrib import admin
from django.utils.html import format_html
from .models import (
    CustomUser, Category, Product, ProductImage, 
    Cart, CartItem, GuestCart, GuestCartItem,
    Order, OrderItem, NewsletterSubscriber
)

# CustomUser Admin
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'user_type', 'phone_number', 'is_staff', 'is_active')
    list_filter = ('user_type', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'phone_number')
    fieldsets = (
        ('User Information', {'fields': ('username', 'email', 'password', 'user_type')}),
        ('Contact Information', {'fields': ('phone_number', 'address')}),
        ('OTP Information', {'fields': ('otp', 'otp_generated_at')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    ordering = ('-date_joined',)

# Category Admin
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'display_image')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    
    def display_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" />', obj.image.url)
        return "No Image"
    display_image.short_description = 'Image'

# Product Admin
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'discount_price', 'stock', 'is_available', 'is_feature')
    list_filter = ('is_available', 'is_feature', 'category')
    search_fields = ('name', 'description', 'sku')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]
    list_editable = ('is_available', 'is_feature', 'stock')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {'fields': ('name', 'slug', 'description', 'category')}),
        ('Pricing & Stock', {'fields': ('price', 'discount_price', 'stock')}),
        ('Status', {'fields': ('is_available', 'is_feature')}),
        ('Additional Info', {'fields': ('sku', 'created_at', 'updated_at')}),
    )

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'display_image', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('product__name',)
    
    def display_image(self, obj):
        return format_html('<img src="{}" width="50" height="50" />', obj.image.url)
    display_image.short_description = 'Image'

# Cart Admin
class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('total_price',)

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'session_id', 'cart_type', 'total_items', 'total_price')
    list_filter = ('cart_type',)
    search_fields = ('user__username', 'user__email', 'session_id')
    inlines = [CartItemInline]
    
    def total_items(self, obj):
        return obj.total_items
    total_items.short_description = 'Total Items'
    
    def total_price(self, obj):
        return obj.total_price
    total_price.short_description = 'Total Price'

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity', 'total_price', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('cart__user__username', 'product__name')
    
    def total_price(self, obj):
        return obj.total_price
    total_price.short_description = 'Total Price'

# Guest Cart Admin
class GuestCartItemInline(admin.TabularInline):
    model = GuestCartItem
    extra = 0

@admin.register(GuestCart)
class GuestCartAdmin(admin.ModelAdmin):
    list_display = ('user_session_id', 'session_id', 'created_at', 'expires_at', 'is_expired')
    list_filter = ('created_at',)
    search_fields = ('user_session_id', 'session_id')
    inlines = [GuestCartItemInline]
    readonly_fields = ('is_expired',)
    
    def is_expired(self, obj):
        return obj.is_expired()
    is_expired.boolean = True
    is_expired.short_description = 'Expired'

@admin.register(GuestCartItem)
class GuestCartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity', 'added_at')
    list_filter = ('added_at',)
    search_fields = ('cart__user_session_id', 'product__name')

# Order Admin
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price', 'total')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'email', 'order_status', 'payment_status', 'order_total', 'created_at')
    list_filter = ('order_status', 'payment_status', 'payment_method', 'created_at')
    search_fields = ('full_name', 'email', 'phone_number', 'tracking_number')
    inlines = [OrderItemInline]
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Customer Information', {'fields': ('user', 'full_name', 'email', 'phone_number')}),
        ('Shipping Information', {
            'fields': ('address', 'city', 'postal_code', 'country', 'delivery_location', 
                      'location_type', 'is_pickup', 'tracking_number', 'special_instructions')
        }),
        ('Order Details', {'fields': ('order_total', 'delivery_fee', 'order_notes', 'order_status')}),
        ('Payment Information', {'fields': ('payment_status', 'payment_method')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    actions = ['mark_as_processing', 'mark_as_shipped', 'mark_as_delivered', 'mark_as_cancelled']
    
    def mark_as_processing(self, request, queryset):
        queryset.update(order_status='PROCESSING')
    mark_as_processing.short_description = "Mark selected orders as Processing"
    
    def mark_as_shipped(self, request, queryset):
        queryset.update(order_status='SHIPPED')
    mark_as_shipped.short_description = "Mark selected orders as Shipped"
    
    def mark_as_delivered(self, request, queryset):
        queryset.update(order_status='DELIVERED')
    mark_as_delivered.short_description = "Mark selected orders as Delivered"
    
    def mark_as_cancelled(self, request, queryset):
        queryset.update(order_status='CANCELLED')
    mark_as_cancelled.short_description = "Mark selected orders as Cancelled"

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'price', 'total')
    list_filter = ('order__order_status',)
    search_fields = ('order__full_name', 'product__name')

@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ('email', 'created_at', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('email',)
    actions = ['activate_subscribers', 'deactivate_subscribers']
    
    def activate_subscribers(self, request, queryset):
        queryset.update(is_active=True)
    activate_subscribers.short_description = "Mark selected subscribers as active"
    
    def deactivate_subscribers(self, request, queryset):
        queryset.update(is_active=False)
    deactivate_subscribers.short_description = "Mark selected subscribers as inactive"