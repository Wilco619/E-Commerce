from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order, OrderItem

@receiver(post_save, sender=Order)
def update_stock_after_order(sender, instance, created, **kwargs):
    """
    Updates product stock quantities only when an order is marked as paid/completed
    """
    if instance.status == 'COMPLETED':  # or whatever status you use for successful orders
        order_items = OrderItem.objects.filter(order=instance)
        for item in order_items:
            product = item.product
            product.stock -= item.quantity
            product.save()