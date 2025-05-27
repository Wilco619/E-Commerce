from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_newsletter_confirmation(email):
    subject = 'Welcome to Jemsa Techs Newsletter!'
    html_message = render_to_string('emails/newsletter_confirmation.html')
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def send_otp_email(email, otp):
    """
    Send OTP email to user using HTML template
    """
    try:
        html_message = render_to_string('emails/otp_email.html', {
            'otp': otp
        })
        
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject='Your OTP Code - JEMSA TECHS',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"OTP email sent successfully to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        return False

def test_email_settings():
    try:
        send_mail(
            'Test Email',
            'This is a test email from your Django application.',
            settings.DEFAULT_FROM_EMAIL,
            [settings.DEFAULT_FROM_EMAIL],
            fail_silently=False,
        )
        return True, "Email test successful"
    except Exception as e:
        logger.error(f"Email test failed: {str(e)}")
        return False, str(e)

def send_welcome_email(user):
    """
    Send welcome email to newly registered users
    """
    try:
        context = {
            'user': user,
            'login_url': f"{settings.FRONTEND_URL}/login"
        }
        
        html_message = render_to_string('emails/welcome_email.html', context)
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject='Welcome to Jemsa Techs!',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Welcome email sent successfully to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
        return False