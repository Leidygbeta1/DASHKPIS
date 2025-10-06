from rest_framework import serializers
from .models import KPI


class KPISerializer(serializers.ModelSerializer):
    class Meta:
        model = KPI
        fields = [
            'id_kpi', 'nombre', 'descripcion', 'valor_objetivo', 'valor_actual',
            'tipo', 'id_proyecto', 'fecha_creacion'
        ]


class KPICreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = KPI
        fields = ['nombre', 'descripcion', 'valor_objetivo', 'valor_actual', 'tipo', 'id_proyecto']
        extra_kwargs = {
            'valor_objetivo': {'required': False, 'allow_null': True},
            'descripcion': {'required': False, 'allow_null': True},
            'id_proyecto': {'required': False, 'allow_null': True},
        }

    def validate(self, attrs):
        objetivo = attrs.get('valor_objetivo')
        valor_actual = attrs.get('valor_actual', 0)
        if objetivo is not None and float(objetivo) < 0:
            raise serializers.ValidationError({'valor_objetivo': 'Debe ser >= 0'})
        if valor_actual is not None and float(valor_actual) < 0:
            raise serializers.ValidationError({'valor_actual': 'Debe ser >= 0'})
        return attrs
