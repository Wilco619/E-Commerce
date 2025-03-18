from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.shortcuts import redirect

# # Simple view function for the root URL
# def api_root(request):
#     # return redirect('https://shop.jemsa.co.ke')
#     return HttpResponse("PAGE NOT FOUND")
#     # Or redirect to your React frontend:
#     # return redirect('https://shop.jemsa.co.ke')

urlpatterns = [
    # path('', api_root, name='api_root'),  # Add this line for the root URL
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/', include('mpesaconfig.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
