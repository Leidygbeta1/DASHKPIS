from rest_framework import serializers
from .models import Proyecto, PanelLayoutPreference
from apps.accounts.models import Usuario
from .layouts import PANEL_IDS, LAYOUT_PRESETS, DEFAULT_LAYOUT_CODE, safe_default_panel_state


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


LAYOUT_CODES = tuple(LAYOUT_PRESETS.keys())


class PanelLayoutPreferenceSerializer(serializers.ModelSerializer):
    id_proyecto = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = PanelLayoutPreference
        fields = [
            'id', 'id_usuario', 'id_proyecto', 'layout_code',
            'panel_state', 'pinned_panels', 'updated_at'
        ]
        read_only_fields = ('id', 'updated_at')
        validators = []

    def validate_layout_code(self, value):
        if value not in LAYOUT_CODES:
            raise serializers.ValidationError('layout_code inválido')
        return value

    def validate_id_proyecto(self, value):
        if value in (None, ''):
            return 0
        if not isinstance(value, int):
            raise serializers.ValidationError('id_proyecto debe ser entero')
        if value < 0:
            raise serializers.ValidationError('id_proyecto debe ser positivo')
        return value

    def validate_panel_state(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('panel_state debe ser un objeto')
        panels = value.get('panels')
        if not isinstance(panels, list) or not panels:
            raise serializers.ValidationError('panel_state.panels debe ser una lista')
        seen = set()
        for panel in panels:
            pid = panel.get('id')
            if pid not in PANEL_IDS:
                raise serializers.ValidationError(f'Panel inválido: {pid}')
            if pid in seen:
                raise serializers.ValidationError('panel duplicado detectado')
            seen.add(pid)
            try:
                order = int(panel.get('order', 0))
                col_span = int(panel.get('colSpan', 12))
            except (TypeError, ValueError):
                raise serializers.ValidationError('order y colSpan deben ser enteros')
            if order < 0:
                raise serializers.ValidationError('order debe ser positivo')
            if col_span not in (4, 6, 8, 12):
                raise serializers.ValidationError('colSpan no soportado')
        return value

    def validate_pinned_panels(self, value):
        if value in (None, ''):
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError('pinned_panels debe ser una lista')
        clean = []
        for pid in value:
            if pid not in PANEL_IDS:
                raise serializers.ValidationError(f'Panel inválido para pin: {pid}')
            if pid not in clean:
                clean.append(pid)
        return clean

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('panel_state') is None:
            data['panel_state'] = safe_default_panel_state()
        if data.get('pinned_panels') is None:
            data['pinned_panels'] = []
        return data
