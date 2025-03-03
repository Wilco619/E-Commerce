# serializers.py
from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'checkout_id', 'mpesa_code', 'phone_number', 'status', 'timestamp']
        read_only_fields = ['id', 'checkout_id', 'mpesa_code', 'status', 'timestamp']

class PaymentSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

class STKQuerySerializer(serializers.Serializer):
    checkout_request_id = serializers.CharField(max_length=100)