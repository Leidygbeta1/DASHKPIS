from rest_framework import serializers
from .models import Tarea, TiempoTarea
from django.db.models import Sum
from apps.accounts.models import Usuario
from .models import Proyecto


class TareaSerializer(serializers.ModelSerializer):
    total_horas = serializers.SerializerMethodField()
    class Meta:
        model = Tarea
        fields = [
            'id_tarea', 'id_proyecto', 'id_usuario_asignado', 'titulo', 'descripcion',
            'fecha_creacion', 'fecha_vencimiento', 'prioridad', 'progreso', 'estado',
            'total_horas'
        ]
        read_only_fields = ('id_tarea', 'fecha_creacion', 'progreso', 'estado', 'total_horas')

    def validate(self, attrs):
        # proyecto debe existir
        pid = attrs.get('id_proyecto') or getattr(self.instance, 'id_proyecto', None)
        if not Proyecto.objects.filter(id_proyecto=pid).exists():
            raise serializers.ValidationError({'id_proyecto': 'Proyecto no existe'})
        # usuario asignado si viene debe existir y estar activo
        uid = attrs.get('id_usuario_asignado')
        if uid is not None and not Usuario.objects.filter(id_usuario=uid, activo=True).exists():
            raise serializers.ValidationError({'id_usuario_asignado': 'Usuario no válido'})
        # fecha vencimiento opcional; no validar rango con creación porque viene por DB
        return attrs

    def get_total_horas(self, obj):
        agg = TiempoTarea.objects.filter(id_tarea=obj.id_tarea).aggregate(total=Sum('horas'))
        return float(agg.get('total') or 0)


class TareaCreateSerializer(serializers.Serializer):
    id_proyecto = serializers.IntegerField()
    titulo = serializers.CharField(max_length=150)
    descripcion = serializers.CharField(allow_blank=True, required=False)
    fecha_vencimiento = serializers.DateField(required=False, allow_null=True)
    id_usuario_asignado = serializers.IntegerField(required=False, allow_null=True)
    prioridad = serializers.ChoiceField(choices=['Alta','Media','Baja'], required=False)

    def validate_id_usuario_asignado(self, value):
        if value is None:
            return value
        if not Usuario.objects.filter(id_usuario=value, activo=True).exists():
            raise serializers.ValidationError('Usuario no válido')
        return value


class TareaAssignSerializer(serializers.Serializer):
    id_usuario_asignado = serializers.IntegerField(allow_null=True)

    def validate_id_usuario_asignado(self, value):
        if value is None:
            return value
        if not Usuario.objects.filter(id_usuario=value, activo=True).exists():
            raise serializers.ValidationError('Usuario no válido')
        return value


class TareaDueDateSerializer(serializers.Serializer):
    fecha_vencimiento = serializers.DateField(allow_null=True)


class TareaProgressSerializer(serializers.Serializer):
    progreso = serializers.DecimalField(max_digits=5, decimal_places=2)
    estado = serializers.ChoiceField(choices=['Pendiente','En progreso','Completada'], required=False, allow_null=True)


class TiempoCreateSerializer(serializers.Serializer):
    id_tarea = serializers.IntegerField()
    id_usuario = serializers.IntegerField()
    horas = serializers.DecimalField(max_digits=5, decimal_places=2)
    nota = serializers.CharField(required=False, allow_blank=True)

    def validate_horas(self, value):
        if value <= 0:
            raise serializers.ValidationError('Las horas deben ser > 0')
        return value

    def validate_id_usuario(self, value):
        if not Usuario.objects.filter(id_usuario=value, activo=True).exists():
            raise serializers.ValidationError('Usuario no válido')
        return value
