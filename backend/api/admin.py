from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Category, Product, ProductImage, Cart, CartItem, 
    Order, OrderItem, Wishlist, NewsletterSubscriber
)

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'email', 'user_type', 'phone_number', 'is_staff', 'date_joined')
    list_filter = ('user_type', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'phone_number')
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('user_type', 'phone_number', 'address', 'otp', 'otp_generated_at')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('user_type', 'phone_number', 'address')
        }),
    )

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'discount_price', 'stock', 'is_available', 'is_feature', 'weekly_order_count')
    list_filter = ('category', 'is_available', 'is_feature')
    search_fields = ('name', 'slug')  # Changed from 'sku' to 'slug' since sku field isn't in your model
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('weekly_order_count',)
    inlines = [ProductImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'category', 'description')
        }),
        ('Pricing', {
            'fields': ('price', 'discount_price')
        }),
        ('Inventory', {
            'fields': ('stock', 'is_available', 'is_feature')
        }),
        ('Statistics', {
            'fields': ('weekly_order_count',),
            'classes': ('collapse',)
        })
    )

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('product__name',)

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('total_price',)

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'session_id', 'cart_type', 'status', 'total_items', 'total_price', 'created_at')
    list_filter = ('cart_type', 'status', 'created_at')
    search_fields = ('user__username', 'user__email', 'session_id')
    readonly_fields = ('total_price', 'total_items')
    inlines = [CartItemInline]

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity', 'total_price', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('cart__user__username', 'product__name')
    readonly_fields = ('total_price',)

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('total',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'full_name', 'email', 'order_status', 'payment_status', 
        'payment_method', 'delivery_location', 'order_total', 'created_at'
    )
    list_filter = (
        'order_status', 'payment_status', 'payment_method', 
        'delivery_location', 'location_type', 'is_pickup', 'created_at'
    )
    search_fields = ('full_name', 'email', 'phone_number', 'id')
    readonly_fields = ('total_items', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Customer Information', {
            'fields': ('user', 'full_name', 'email', 'phone_number')
        }),
        ('Shipping Information', {
            'fields': (
                'address', 'city', 'postal_code', 'country', 
                'delivery_location', 'location_type', 'is_pickup', 
                'tracking_number', 'delivery_fee', 'special_instructions'
            )
        }),
        ('Order Information', {
            'fields': ('order_total', 'order_notes', 'order_status', 'total_items')
        }),
        ('Payment Information', {
            'fields': ('payment_status', 'payment_method')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    inlines = [OrderItemInline]

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'price', 'total')
    list_filter = ('order__created_at',)
    search_fields = ('order__id', 'product__name', 'order__full_name')

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'session_id', 'product', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'product__name', 'session_id')

@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('email',)
    actions = ['make_active', 'make_inactive']
    
    def make_active(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f'{queryset.count()} subscribers marked as active.')
    make_active.short_description = "Mark selected subscribers as active"
    
    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f'{queryset.count()} subscribers marked as inactive.')
    make_inactive.short_description = "Mark selected subscribers as inactive"