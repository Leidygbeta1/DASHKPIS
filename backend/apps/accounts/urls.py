from django.urls import path
from .views import LoginView, RegisterView, UsuariosListView, UserFormatPreferenceView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('usuarios/', UsuariosListView.as_view(), name='usuarios-list'),
    path('usuarios/<int:id_usuario>/preferencias/formato/', UserFormatPreferenceView.as_view(), name='user-format-preferences'),
]
