from django.db import connection
from django.contrib.auth.hashers import check_password, make_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Usuario, UserFormatPreference
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    UsuarioSerializer,
    UserFormatPreferenceSerializer,
    UserFormatPreferenceInputSerializer,
    DATE_FORMAT_CHOICES,
    CURRENCY_CHOICES,
)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = Usuario.objects.get(email=email, activo=True)
        except Usuario.DoesNotExist:
            return Response({'detail': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        # password_hash en DB puede ser hash Django o bcrypt/otro; aquí uso check_password de Django
        if check_password(password, user.password_hash):
            data = UsuarioSerializer(user).data
            return Response({'user': data}, status=status.HTTP_200_OK)
        return Response({'detail': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)


class RegisterView(APIView):
    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data['email']
        password = s.validated_data['password']
        rol = s.validated_data['rol']
        nombre = s.validated_data.get('nombre', '')

        if Usuario.objects.filter(email=email).exists():
            return Response({'detail': 'El correo ya está registrado'}, status=status.HTTP_400_BAD_REQUEST)

        # Insert directo con hash seguro usando la función de Django
        hashed = make_password(password)
        with connection.cursor() as cur:
            cur.execute(
                """
                INSERT INTO dbo.usuarios (email, password_hash, rol, fecha_registro, activo, nombre)
                VALUES (%s, %s, %s, SYSUTCDATETIME(), 1, %s)
                """,
                [email, hashed, rol, nombre]
            )
        user = Usuario.objects.get(email=email)
        return Response({'user': UsuarioSerializer(user).data}, status=status.HTTP_201_CREATED)


class UsuariosListView(APIView):
    def get(self, request):
        usuarios = Usuario.objects.filter(activo=True).values('id_usuario', 'email', 'rol', 'nombre')
        listado = []
        for u in usuarios:
            email = u['email'] or ''
            nombre = u.get('nombre') or ''
            if not nombre:
                base = email.split('@')[0] if '@' in email else email
                # Derivar nombre amigable si la columna viene vacía
                nombre = base.replace('.', ' ').replace('_', ' ').strip()
                nombre = ' '.join(s.capitalize() for s in nombre.split()) if nombre else email
            listado.append({
                'id_usuario': u['id_usuario'],
                'email': email,
                'rol': u['rol'],
                'nombre': nombre,
            })
        return Response(listado)


class UserFormatPreferenceView(APIView):
    """
    UC-05: Configurar formato de fechas y moneda.
    """

    DEFAULT_FORMAT = DATE_FORMAT_CHOICES[0]
    DEFAULT_CURRENCY = CURRENCY_CHOICES[0]

    def _build_default(self, user_id: int):
        return {
            'id_usuario': user_id,
            'formato_fecha': self.DEFAULT_FORMAT,
            'codigo_moneda': self.DEFAULT_CURRENCY,
            'fondo': None,
            'updated_at': None,
        }

    def get(self, request, id_usuario: int):
        pref = UserFormatPreference.objects.filter(id_usuario=id_usuario).first()
        if pref:
            return Response(UserFormatPreferenceSerializer(pref).data)
        return Response(self._build_default(id_usuario))

    def put(self, request, id_usuario: int):
        serializer = UserFormatPreferenceInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        defaults = {
            'formato_fecha': serializer.validated_data['formato_fecha'],
            'codigo_moneda': serializer.validated_data['codigo_moneda'],
        }
        if 'fondo' in serializer.validated_data:
            defaults['fondo'] = serializer.validated_data['fondo']

        pref, created = UserFormatPreference.objects.update_or_create(
            id_usuario=id_usuario,
            defaults=defaults,
        )
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(UserFormatPreferenceSerializer(pref).data, status=status_code)

    def delete(self, request, id_usuario: int):
        UserFormatPreference.objects.filter(id_usuario=id_usuario).delete()
        return Response(self._build_default(id_usuario))
