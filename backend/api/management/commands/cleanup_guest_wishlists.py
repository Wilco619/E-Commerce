from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Wishlist

class Command(BaseCommand):
    help = 'Cleanup old guest wishlists'

    def handle(self, *args, **kwargs):
        # Delete guest wishlists older than 30 days
        cutoff_date = timezone.now() - timedelta(days=30)
        old_items = Wishlist.objects.filter(
            user__isnull=True,
            created_at__lt=cutoff_date
        )
        count = old_items.count()
        old_items.delete()
        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {count} old guest wishlist items')
        )