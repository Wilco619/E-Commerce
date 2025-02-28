from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, 
    Category, 
    Product, 
    ProductImage, 
    Cart, 
    CartItem, 
    Order, 
    OrderItem
)

# CustomUser Admin
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'phone_number')
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Information', {'fields': ('user_type', 'phone_number', 'address', 'otp', 'otp_generated_at')}),
    )
    search_fields = ('username', 'email', 'phone_number')
    list_filter = ('user_type',) + UserAdmin.list_filter

# ProductImage Inline for Product admin
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

# CartItem Inline for Cart admin
class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 1

# OrderItem Inline for Order admin
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1

# Category Admin
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}

# Product Admin
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'discount_price', 'stock', 'is_available')
    list_filter = ('category', 'is_available')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]

# Cart Admin
@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_price', 'total_items', 'created_at')
    search_fields = ('user__username', 'session_id')
    inlines = [CartItemInline]

# Order Admin
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'order_total', 'order_status', 'payment_status', 'created_at')
    list_filter = ('order_status', 'payment_status', 'payment_method')
    search_fields = ('full_name', 'email', 'phone_number', 'tracking_number')
    inlines = [OrderItemInline]

# Register the models that don't need custom admin classes
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(ProductImage)
admin.site.register(CartItem)
admin.site.register(OrderItem)