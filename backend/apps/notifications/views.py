from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from django.db.models import Q
from apps.accounts.models import Usuario
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.serializers import ModelSerializer

from .models import Notificacion, ConfigNotificacion
from .serializers import NotificacionSerializer, NotificacionMarkReadSerializer
from django.db import connection


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


class UserNotificationsView(APIView):
    def get(self, request, id_usuario: int):
        # Optional filters: ?leida=true|false&limit=20&tipo=...&q=search&desde=YYYY-MM-DD&hasta=YYYY-MM-DD
        qs = Notificacion.objects.filter(id_usuario=id_usuario).order_by('-fecha')
        leida = request.query_params.get('leida')
        if leida in ("true", "false"):
            qs = qs.filter(leida=(leida == 'true'))
        tipo = request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(tipo=tipo)
        q = request.query_params.get('q')
        if q:
            qs = qs.filter(Q(titulo__icontains=q) | Q(mensaje__icontains=q))
        desde = request.query_params.get('desde')
        hasta = request.query_params.get('hasta')
        if desde:
            try:
                from django.utils.dateparse import parse_date

                d = parse_date(desde)
                if d:
                    qs = qs.filter(fecha__date__gte=d)
            except Exception:
                pass
        if hasta:
            try:
                from django.utils.dateparse import parse_date

                h = parse_date(hasta)
                if h:
                    qs = qs.filter(fecha__date__lte=h)
            except Exception:
                pass
        limit = request.query_params.get('limit')
        if limit and str(limit).isdigit():
            qs = qs[: int(limit)]
        return Response(NotificacionSerializer(qs, many=True).data)


class NotificationDeleteView(APIView):
    def delete(self, request, id_notificacion: int):
        notif = get_object_or_404(Notificacion, pk=id_notificacion)
        notif.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationMarkReadView(APIView):
    def post(self, request, id_notificacion: int):
        notif = get_object_or_404(Notificacion, pk=id_notificacion)
        ser = NotificacionMarkReadSerializer(data=request.data)
        if ser.is_valid():
            notif.leida = ser.validated_data['leida']
            notif.save(update_fields=['leida'])
            return Response(NotificacionSerializer(notif).data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationConfigView(APIView):
    CHANNEL_OPTIONS = [
        {
            'tipo': 'canal_inapp',
            'nombre': 'Notificaciones en la app',
            'descripcion': 'Alertas emergentes dentro del dashboard en tiempo real.',
            'categoria': 'canal',
            'default': True,
        },
        {
            'tipo': 'canal_email',
            'nombre': 'Correo electrónico',
            'descripcion': 'Resumen detallado enviado a tu bandeja de entrada.',
            'categoria': 'canal',
            'default': True,
        },
        {
            'tipo': 'canal_resumen',
            'nombre': 'Resumen diario',
            'descripcion': 'Un correo consolidado al final del día con los cambios más importantes.',
            'categoria': 'canal',
            'default': False,
        },
    ]

    TYPE_OPTIONS = [
        {
            'tipo': 'tipo_tareas',
            'nombre': 'Tareas asignadas y vencimientos',
            'descripcion': 'Recibe avisos cuando te asignan una tarea o está por vencer.',
            'categoria': 'tipo',
            'default': True,
        },
        {
            'tipo': 'tipo_kpis',
            'nombre': 'Cambios en KPIs',
            'descripcion': 'Alertas cuando un KPI cambia de estado o se aleja del objetivo.',
            'categoria': 'tipo',
            'default': True,
        },
        {
            'tipo': 'tipo_reportes',
            'nombre': 'Reportes generados',
            'descripcion': 'Notificaciones cuando un reporte programado está listo.',
            'categoria': 'tipo',
            'default': False,
        },
    ]

    OPTIONS = CHANNEL_OPTIONS + TYPE_OPTIONS
    OPTIONS_MAP = {opt['tipo']: opt for opt in OPTIONS}

    def _fetch_existing(self, id_usuario: int):
        with connection.cursor() as cur:
            cur.execute(
                "SELECT tipo, activo FROM config_notificaciones WHERE id_usuario=%s",
                [id_usuario]
            )
            rows = cur.fetchall()
        return {tipo: bool(activo) for tipo, activo in rows}

    def _build_response(self, id_usuario: int):
        existing = self._fetch_existing(id_usuario)
        data = []
        for opt in self.OPTIONS:
            data.append({
                'id_usuario': id_usuario,
                'tipo': opt['tipo'],
                'nombre': opt['nombre'],
                'descripcion': opt['descripcion'],
                'categoria': opt['categoria'],
                'activo': existing.get(opt['tipo'], opt['default']),
            })
        return data

    def get(self, request, id_usuario: int):
        return Response(self._build_response(id_usuario))

    def put(self, request, id_usuario: int):
        data = request.data
        if not isinstance(data, list):
            return Response({'detail': 'Se espera una lista'}, status=status.HTTP_400_BAD_REQUEST)

        for item in data:
            tipo = item.get('tipo')
            if tipo not in self.OPTIONS_MAP:
                return Response({'detail': f'El tipo {tipo} no es válido'}, status=status.HTTP_400_BAD_REQUEST)
            if not isinstance(item.get('activo'), bool):
                return Response({'detail': 'activo debe ser booleano'}, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cur:
            for item in data:
                tipo = item['tipo']
                activo = 1 if item['activo'] else 0
                cur.execute(
                    "UPDATE config_notificaciones SET activo=%s WHERE id_usuario=%s AND tipo=%s",
                    [activo, id_usuario, tipo]
                )
                if cur.rowcount == 0:
                    cur.execute(
                        "INSERT INTO config_notificaciones (id_usuario, tipo, activo) VALUES (%s, %s, %s)",
                        [id_usuario, tipo, activo]
                    )

        return Response(self._build_response(id_usuario))

    def delete(self, request, id_usuario: int):
        with connection.cursor() as cur:
            cur.execute("DELETE FROM config_notificaciones WHERE id_usuario=%s", [id_usuario])
        return Response(self._build_response(id_usuario))


class UserProfileSerializer(ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id_usuario', 'email', 'nombre', 'rol', 'profile_image']


class UserProfileUpdateView(APIView):


    def put(self, request):
        id_usuario = request.data.get('id_usuario')
        if not id_usuario:
            return Response({'detail': 'id_usuario requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = Usuario.objects.get(id_usuario=id_usuario)
        except Usuario.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        # Si profile_image viene en el request, debe ser base64
        data = request.data.copy()
        profile_image = data.get('profile_image')
        if profile_image is not None:
            user.profile_image = profile_image
        if 'nombre' in data:
            user.nombre = data['nombre']
        if 'email' in data:
            user.email = data['email']
        user.save(update_fields=['profile_image', 'nombre', 'email'])
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
