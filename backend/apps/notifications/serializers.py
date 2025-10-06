from rest_framework import serializers
from .models import Notificacion, ConfigNotificacion


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = ['id_notificacion', 'id_usuario', 'tipo', 'titulo', 'mensaje', 'link', 'fecha', 'leida']


class NotificacionMarkReadSerializer(serializers.Serializer):
    leida = serializers.BooleanField()


class ConfigNotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigNotificacion
        fields = ['id_usuario', 'tipo', 'activo']