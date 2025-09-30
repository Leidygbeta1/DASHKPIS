from django.urls import path
from .views import LoginView, RegisterView, UsuariosListView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('usuarios/', UsuariosListView.as_view(), name='usuarios-list'),
]
