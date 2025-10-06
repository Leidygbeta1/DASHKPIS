from django.urls import path
from .views import health, UserNotificationsView, NotificationMarkReadView, NotificationConfigView

urlpatterns = [
    path('notifications/health/', health),
    path('usuarios/<int:id_usuario>/notificaciones/', UserNotificationsView.as_view(), name='user-notifications'),
    path('notificaciones/<int:id_notificacion>/leida/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('usuarios/<int:id_usuario>/notificaciones/config/', NotificationConfigView.as_view(), name='notification-config'),
]
