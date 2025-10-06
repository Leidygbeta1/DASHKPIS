from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import connection
from .models import Tarea, TiempoTarea
from .serializers_tareas import (
    TareaSerializer, TareaCreateSerializer, TareaAssignSerializer,
    TareaDueDateSerializer, TareaProgressSerializer, TiempoCreateSerializer
)
from apps.notifications.utils import create_notification_if_enabled

# UC-10: Listar tareas por proyecto
class TareaListView(generics.ListAPIView):
    serializer_class = TareaSerializer

    def get_queryset(self):
        id_proyecto = self.kwargs.get('id_proyecto')
        return Tarea.objects.filter(id_proyecto=id_proyecto)

# UC-01: Crear tarea
class TareaCreateView(APIView):
    def post(self, request):
        s = TareaCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data
        with connection.cursor() as cur:
            cur.execute(
                """
                INSERT INTO dbo.tareas (id_proyecto, titulo, descripcion, fecha_vencimiento, id_usuario_asignado, prioridad, progreso, estado)
                OUTPUT INSERTED.id_tarea
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                [
                    data['id_proyecto'],
                    data['titulo'],
                    data.get('descripcion'),
                    data.get('fecha_vencimiento'),
                    data.get('id_usuario_asignado'),
                    data.get('prioridad') or 'Media',
                    0,
                    'Pendiente',
                ]
            )
            new_id = cur.fetchone()[0]
        instance = Tarea.objects.get(id_tarea=new_id)
        # Notificación al asignado (si viene en el payload)
        try:
            if data.get('id_usuario_asignado'):
                create_notification_if_enabled(
                    id_usuario=data['id_usuario_asignado'],
                    tipo='tarea_asignada',
                    titulo=f"Tarea asignada: {data['titulo']}",
                    mensaje=(data.get('descripcion') or ''),
                    link=f"/dashboard/tarea"
                )
        except Exception:
            pass
        return Response(TareaSerializer(instance).data, status=status.HTTP_201_CREATED)

# UC-12: Editar tarea (título, descripción, fecha)
class TareaUpdateView(APIView):
    def put(self, request, id_tarea: int):
        try:
            Tarea.objects.get(id_tarea=id_tarea)
        except Tarea.DoesNotExist:
            return Response({'detail': 'No existe'}, status=404)
        s = TareaCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        with connection.cursor() as cur:
            cur.execute(
                """
                UPDATE dbo.tareas
                SET id_proyecto=%s, titulo=%s, descripcion=%s, fecha_vencimiento=%s, id_usuario_asignado=%s, prioridad=%s
                WHERE id_tarea=%s
                """,
                [
                    d['id_proyecto'],
                    d['titulo'],
                    d.get('descripcion'),
                    d.get('fecha_vencimiento'),
                    d.get('id_usuario_asignado'),
                    d.get('prioridad') or 'Media',
                    id_tarea
                ]
            )
        inst = Tarea.objects.get(id_tarea=id_tarea)
        # Notificación al nuevo asignado
        try:
            new_uid = d.get('id_usuario_asignado')
            if new_uid:
                create_notification_if_enabled(
                    id_usuario=new_uid,
                    tipo='tarea_asignada',
                    titulo=f"Te asignaron una tarea: {inst.titulo}",
                    mensaje=(inst.descripcion or ''),
                    link=f"/dashboard/tarea"
                )
        except Exception:
            pass
        return Response(TareaSerializer(inst).data)

# UC-02: Asignar tarea a usuario
class TareaAssignView(APIView):
    def post(self, request, id_tarea: int):
        s = TareaAssignSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        uid = s.validated_data.get('id_usuario_asignado')
        with connection.cursor() as cur:
            cur.execute(
                """
                UPDATE dbo.tareas SET id_usuario_asignado=%s WHERE id_tarea=%s
                """,
                [uid, id_tarea]
            )
        inst = Tarea.objects.get(id_tarea=id_tarea)
        # Notificar al nuevo asignado
        try:
            if uid:
                create_notification_if_enabled(
                    id_usuario=uid,
                    tipo='tarea_asignada',
                    titulo=f"Te asignaron una tarea: {inst.titulo}",
                    mensaje=(inst.descripcion or ''),
                    link=f"/dashboard/tarea"
                )
        except Exception:
            pass
        return Response(TareaSerializer(inst).data)

# UC-03: Cambiar fecha límite
class TareaDueDateView(APIView):
    def post(self, request, id_tarea: int):
        s = TareaDueDateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        fv = s.validated_data.get('fecha_vencimiento')
        with connection.cursor() as cur:
            cur.execute(
                "UPDATE dbo.tareas SET fecha_vencimiento=%s WHERE id_tarea=%s",
                [fv, id_tarea]
            )
        inst = Tarea.objects.get(id_tarea=id_tarea)
        return Response(TareaSerializer(inst).data)

# UC-04 y UC-14: Registrar tiempo y ver progreso (progreso derivado opcional)
class TareaTiempoView(APIView):
    def get(self, request, id_tarea: int):
        """
        Listar registros de tiempo de una tarea.
        Filtros opcionales (query params):
          - fecha=YYYY-MM-DD (muestra solo ese día)
          - desde=YYYY-MM-DD&hasta=YYYY-MM-DD (rango por fecha - ambos opcionales)
        """
        fecha = request.query_params.get('fecha')
        desde = request.query_params.get('desde')
        hasta = request.query_params.get('hasta')
        qs = TiempoTarea.objects.filter(id_tarea=id_tarea)
        # Filtrar por fecha usando la parte de fecha de fecha_registro
        from datetime import datetime
        def parse_date(s: str):
            return datetime.strptime(s, "%Y-%m-%d").date()

        try:
            if fecha:
                d = parse_date(fecha)
                qs = qs.filter(fecha_registro__date=d)
            else:
                if desde:
                    qs = qs.filter(fecha_registro__date__gte=parse_date(desde))
                if hasta:
                    qs = qs.filter(fecha_registro__date__lte=parse_date(hasta))
        except Exception:
            # Si el formato es inválido, ignorar filtros y devolver todo
            pass

        qs = qs.order_by('-fecha_registro')
        data = []
        for r in qs:
            item = {
                'id_registro': r.id_registro,
                'id_usuario': r.id_usuario,
                'horas': float(r.horas),
                'fecha_registro': r.fecha_registro.isoformat() if r.fecha_registro else None,
            }
            # Algunas BD podrían tener columna opcional 'nota'; si existe en instancia, incluirla
            if hasattr(r, 'nota'):
                item['nota'] = getattr(r, 'nota')
            data.append(item)
        return Response(data)

    def post(self, request, id_tarea: int):
        s = TiempoCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        # Insertar registro de tiempo
        with connection.cursor() as cur:
            if 'nota' in d and d.get('nota'):
                # si existe columna nota, incluirla; si no, ignorar
                try:
                    cur.execute(
                        """
                        INSERT INTO dbo.tiempo_tareas (id_tarea, id_usuario, horas, nota)
                        VALUES (%s, %s, %s, %s)
                        """,
                        [id_tarea, d['id_usuario'], d['horas'], d.get('nota')]
                    )
                except Exception:
                    cur.execute(
                        """
                        INSERT INTO dbo.tiempo_tareas (id_tarea, id_usuario, horas)
                        VALUES (%s, %s, %s)
                        """,
                        [id_tarea, d['id_usuario'], d['horas']]
                    )
            else:
                cur.execute(
                    """
                    INSERT INTO dbo.tiempo_tareas (id_tarea, id_usuario, horas)
                    VALUES (%s, %s, %s)
                    """,
                    [id_tarea, d['id_usuario'], d['horas']]
                )
        # devolver nuevo total de horas
        from .models import TiempoTarea
        from django.db.models import Sum
        agg = TiempoTarea.objects.filter(id_tarea=id_tarea).aggregate(total=Sum('horas'))
        return Response({'ok': True, 'total_horas': float(agg.get('total') or 0)}, status=status.HTTP_201_CREATED)

# UC-05: Marcar como completada
class TareaCompleteView(APIView):
    def post(self, request, id_tarea: int):
        with connection.cursor() as cur:
            cur.execute(
                "UPDATE dbo.tareas SET estado=%s, progreso=%s WHERE id_tarea=%s",
                ['Completada', 100, id_tarea]
            )
        inst = Tarea.objects.get(id_tarea=id_tarea)
        return Response(TareaSerializer(inst).data)

# UC-18: Eliminar tarea
class TareaDeleteView(APIView):
    def delete(self, request, id_tarea: int):
        with connection.cursor() as cur:
            cur.execute("DELETE FROM dbo.tareas WHERE id_tarea=%s", [id_tarea])
        return Response(status=204)

# Actualizar progreso/estado
class TareaProgressView(APIView):
    def post(self, request, id_tarea: int):
        s = TareaProgressSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        progreso = d.get('progreso')
        estado = d.get('estado')
        if estado is None:
            # Derivar estado según progreso si no se envía explícito
            prog = float(progreso)
            if prog >= 100:
                estado = 'Completada'
                progreso = 100
            elif prog <= 0:
                estado = 'Pendiente'
                progreso = 0
            else:
                estado = 'En progreso'
        with connection.cursor() as cur:
            cur.execute(
                "UPDATE dbo.tareas SET progreso=%s, estado=%s WHERE id_tarea=%s",
                [progreso, estado, id_tarea]
            )
        inst = Tarea.objects.get(id_tarea=id_tarea)
        return Response(TareaSerializer(inst).data)
