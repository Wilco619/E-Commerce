from django.core.management.base import BaseCommand
from api.tasks import cleanup_abandoned_carts

class Command(BaseCommand):
    help = 'Cleanup abandoned shopping carts'

    def handle(self, *args, **kwargs):
        cleanup_abandoned_carts()
        self.stdout.write(self.style.SUCCESS('Successfully cleaned up abandoned carts'))