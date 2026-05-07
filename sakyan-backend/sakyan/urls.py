from django.http import JsonResponse
from django.urls import path, include

def health(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('api/', include('api.urls')),
    path('api/health/', health),   # ← add this
]