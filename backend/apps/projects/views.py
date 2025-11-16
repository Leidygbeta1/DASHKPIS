from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import connection
from .models import Proyecto, PanelLayoutPreference
from .serializers import ProyectoSerializer, PanelLayoutPreferenceSerializer
from apps.notifications.utils import create_notification_if_enabled
from .layouts import DEFAULT_LAYOUT_CODE, safe_default_panel_state


class ProyectoListCreateView(generics.ListCreateAPIView):
    queryset = Proyecto.objects.all()
    serializer_class = ProyectoSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO dbo.proyectos (nombre, descripcion, fecha_inicio, fecha_fin, id_pm)
                OUTPUT INSERTED.id_proyecto
                VALUES (%s, %s, %s, %s, %s)
                """,
                [
                    data.get('nombre'),
                    data.get('descripcion'),
                    data.get('fecha_inicio'),
                    data.get('fecha_fin'),
                    data.get('id_pm'),
                ]
            )
            new_id = cursor.fetchone()[0]
        instance = Proyecto.objects.get(id_proyecto=new_id)
        output = self.get_serializer(instance).data
        # Notificación: proyecto creado (si hay PM asignado)
        try:
            if output.get('id_pm'):
                create_notification_if_enabled(
                    id_usuario=output['id_pm'],
                    tipo='proyecto_creado',
                    titulo=f"Proyecto creado: {output.get('nombre')}",
                    mensaje=output.get('descripcion'),
                    link=f"/dashboard/proyectos"
                )
        except Exception:
            pass
        headers = self.get_success_headers(output)
        return Response(output, status=status.HTTP_201_CREATED, headers=headers)


class ProyectoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Proyecto.objects.all()
    serializer_class = ProyectoSerializer
    lookup_field = 'id_proyecto'

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE dbo.proyectos
                SET nombre = %s, descripcion = %s, fecha_inicio = %s, fecha_fin = %s, id_pm = %s
                WHERE id_proyecto = %s
                """,
                [
                    data.get('nombre'),
                    data.get('descripcion'),
                    data.get('fecha_inicio'),
                    data.get('fecha_fin'),
                    data.get('id_pm'),
                    instance.id_proyecto,
                ]
            )
        instance = Proyecto.objects.get(id_proyecto=instance.id_proyecto)
        return Response(self.get_serializer(instance).data)


class PanelLayoutPreferenceView(APIView):
    """
    UC-04: Configurar disposición de paneles del dashboard principal.
    Soporta lectura, guardado y restablecimiento del layout por usuario/proyecto.
    """

    def _parse_scope(self, request):
        raw_user = request.query_params.get('id_usuario')
        if raw_user in (None, ''):
            raise serializers.ValidationError('id_usuario es requerido')
        try:
            user_id = int(raw_user)
        except (TypeError, ValueError):
            raise serializers.ValidationError('id_usuario debe ser entero')
        if user_id <= 0:
            raise serializers.ValidationError('id_usuario debe ser positivo')
        raw_project = request.query_params.get('id_proyecto', 0)
        if raw_project in (None, ''):
            project_id = 0
        else:
            try:
                project_id = int(raw_project)
            except (TypeError, ValueError):
                raise serializers.ValidationError('id_proyecto debe ser entero')
            if project_id < 0:
                raise serializers.ValidationError('id_proyecto debe ser positivo')
        return user_id, project_id

    def get(self, request):
        user_id, project_id = self._parse_scope(request)

        pref = PanelLayoutPreference.objects.filter(id_usuario=user_id, id_proyecto=project_id).first()
        if pref:
            data = PanelLayoutPreferenceSerializer(pref).data
        else:
            data = {
                'id': None,
                'id_usuario': user_id,
                'id_proyecto': project_id,
                'layout_code': DEFAULT_LAYOUT_CODE,
                'panel_state': safe_default_panel_state(),
                'pinned_panels': [],
                'updated_at': None,
            }
        return Response(data)

    def post(self, request):
        serializer = PanelLayoutPreferenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        pref, created = PanelLayoutPreference.objects.update_or_create(
            id_usuario=payload['id_usuario'],
            id_proyecto=payload.get('id_proyecto', 0),
            defaults={
                'layout_code': payload['layout_code'],
                'panel_state': payload['panel_state'],
                'pinned_panels': payload.get('pinned_panels', []),
            }
        )
        return Response(
            PanelLayoutPreferenceSerializer(pref).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def delete(self, request):
        user_id, project_id = self._parse_scope(request)

        PanelLayoutPreference.objects.filter(id_usuario=user_id, id_proyecto=project_id).delete()
        data = {
            'id': None,
            'id_usuario': user_id,
            'id_proyecto': project_id,
            'layout_code': DEFAULT_LAYOUT_CODE,
            'panel_state': safe_default_panel_state(),
            'pinned_panels': [],
            'updated_at': None,
        }
        return Response(data, status=status.HTTP_200_OK)


