from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SongViewset


router = DefaultRouter()
router.register(r'songs', SongViewset)

urlpatterns = [
    path('', include(router.urls)),
]