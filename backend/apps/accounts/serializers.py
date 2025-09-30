from rest_framework import serializers
from .models import Usuario

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    rol = serializers.ChoiceField(choices=['PM','Colaborador','Stakeholder'])
    nombre = serializers.CharField(required=False, allow_blank=True, max_length=150)

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id_usuario', 'email', 'nombre', 'rol', 'fecha_registro', 'activo']
