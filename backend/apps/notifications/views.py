from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404

from .models import Notificacion, ConfigNotificacion
from .serializers import NotificacionSerializer, NotificacionMarkReadSerializer, ConfigNotificacionSerializer
from django.db import connection


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


class UserNotificationsView(APIView):
    def get(self, request, id_usuario: int):
        # Optional filters: ?leida=true|false&limit=20
        qs = Notificacion.objects.filter(id_usuario=id_usuario).order_by('-fecha')
        leida = request.query_params.get('leida')
        if leida in ("true", "false"):
            qs = qs.filter(leida=(leida == 'true'))
        limit = request.query_params.get('limit')
        if limit and str(limit).isdigit():
            qs = qs[: int(limit)]
        return Response(NotificacionSerializer(qs, many=True).data)


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
    def get(self, request, id_usuario: int):
        # Return all config rows for user
        qs = ConfigNotificacion.objects.filter(id_usuario=id_usuario)
        return Response(ConfigNotificacionSerializer(qs, many=True).data)

    def put(self, request, id_usuario: int):
        # Upsert (id_usuario, tipo) rows via raw SQL (unmanaged composite key)
        # Payload: [{tipo, activo}]
        data = request.data
        if not isinstance(data, list):
            return Response({'detail': 'Se espera una lista'}, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cur:
            for item in data:
                tipo = item.get('tipo')
                activo = item.get('activo')
                if not isinstance(tipo, str) or not isinstance(activo, bool):
                    return Response({'detail': 'Cada item debe tener tipo (str) y activo (bool)'}, status=status.HTTP_400_BAD_REQUEST)
                # Try update; if 0 rows affected, insert
                cur.execute("UPDATE config_notificaciones SET activo=%s WHERE id_usuario=%s AND tipo=%s", [1 if activo else 0, id_usuario, tipo])
                if cur.rowcount == 0:
                    cur.execute("INSERT INTO config_notificaciones (id_usuario, tipo, activo) VALUES (%s, %s, %s)", [id_usuario, tipo, 1 if activo else 0])

        qs = ConfigNotificacion.objects.filter(id_usuario=id_usuario)
        return Response(ConfigNotificacionSerializer(qs, many=True).data)
