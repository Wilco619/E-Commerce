from django.core.management.base import BaseCommand
from api.models import GuestCart

class Command(BaseCommand):
    help = 'Clean up expired guest carts'

    def handle(self, *args, **options):
        GuestCart.cleanup_expired_carts()
        self.stdout.write(self.style.SUCCESS('Successfully cleaned up expired guest carts'))