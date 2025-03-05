from django.shortcuts import redirect
from django.urls import reverse

class CheckoutMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path == '/api/checkout/' and not request.user.is_authenticated:
            # Store the checkout attempt in session
            request.session['checkout_attempted'] = True
            return redirect(reverse('register'))
        
        response = self.get_response(request)
        return response