from django.utils import timezone
from datetime import timedelta

from backend.api.models import Cart

def cleanup_abandoned_carts():
    """Mark carts as abandoned if inactive for more than 1 hour"""
    expire_time = timezone.now() - timedelta(hours=1)
    Cart.objects.filter(
        status='active',
        updated_at__lt=expire_time
    ).update(status='abandoned')