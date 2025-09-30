from rest_framework import serializers
from .models import Proyecto
from apps.accounts.models import Usuario


class ProyectoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proyecto
        fields = [
            'id_proyecto', 'nombre', 'descripcion', 'fecha_inicio', 'fecha_fin', 'id_pm'
        ]

    def validate_id_pm(self, value):
        if value is None:
            return value
        # ensure pm exists and is active
        if not Usuario.objects.filter(id_usuario=value, activo=True).exists():
            raise serializers.ValidationError('El PM seleccionado no existe o no está activo.')
        return value
