from django.core.management.base import BaseCommand
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Cleanup expired sessions and manage session data'

    def handle(self, *args, **kwargs):
        try:
            # Clean expired sessions from the database
            expired_sessions = Session.objects.filter(expire_date__lt=timezone.now())
            count = expired_sessions.count()
            expired_sessions.delete()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {count} expired sessions')
            )
            
            # Log the cleanup
            logger.info(f'Session cleanup completed. Removed {count} expired sessions.')
            
        except Exception as e:
            logger.error(f'Error during session cleanup: {str(e)}')
            self.stdout.write(
                self.style.ERROR(f'Error cleaning up sessions: {str(e)}')
            )
