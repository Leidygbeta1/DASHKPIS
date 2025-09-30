from django.db import connection
from django.contrib.auth.hashers import check_password, make_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Usuario
from .serializers import LoginSerializer, RegisterSerializer, UsuarioSerializer


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
