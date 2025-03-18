from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Cart
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Clean up expired guest carts'

    def handle(self, *args, **kwargs):
        try:
            expiry_time = timezone.now() - timedelta(hours=24)
            expired_carts = Cart.objects.filter(
                cart_type='guest',
                created_at__lt=expiry_time
            )
            
            count = expired_carts.count()
            expired_carts.delete()

            success_message = f'Successfully cleaned up {count} expired guest carts'
            self.stdout.write(self.style.SUCCESS(success_message))
            logger.info(success_message)
            
        except Exception as e:
            error_message = f'Error cleaning up guest carts: {str(e)}'
            self.stdout.write(self.style.ERROR(error_message))
            logger.error(error_message)