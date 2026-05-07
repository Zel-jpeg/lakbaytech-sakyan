from django.http import JsonResponse
from django.urls import path, include

def health(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('api/health/', health),   # ← must be BEFORE api/ include
    path('api/', include('api.urls')),
]