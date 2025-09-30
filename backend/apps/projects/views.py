from rest_framework import generics, status
from rest_framework.response import Response
from django.db import connection
from .models import Proyecto
from .serializers import ProyectoSerializer


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


