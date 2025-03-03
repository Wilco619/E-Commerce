from django.contrib import admin
from .models import (
    Transaction,
)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('mpesa_code', 'amount', 'phone_number', 'status', 'checkout_id', 'timestamp')
    search_fields = ('mpesa_code', 'phone_number', 'checkout_id')
    list_filter = ('status',)
    

