from rest_framework import serializers
from .models import Usuario, UserFormatPreference


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    rol = serializers.ChoiceField(choices=['PM', 'Colaborador', 'Stakeholder'])
    nombre = serializers.CharField(required=False, allow_blank=True, max_length=150)


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id_usuario', 'email', 'nombre', 'rol', 'fecha_registro', 'activo']


DATE_FORMAT_CHOICES = ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')
CURRENCY_CHOICES = ('COP', 'USD', 'EUR')


class UserFormatPreferenceInputSerializer(serializers.Serializer):
    formato_fecha = serializers.ChoiceField(choices=[(c, c) for c in DATE_FORMAT_CHOICES])
    codigo_moneda = serializers.ChoiceField(choices=[(c, c) for c in CURRENCY_CHOICES])


class UserFormatPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFormatPreference
        fields = ['id_usuario', 'formato_fecha', 'codigo_moneda', 'updated_at']
