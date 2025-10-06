from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404

from .models import KPI
from apps.projects.models import Proyecto
from apps.notifications.utils import create_notification_if_enabled
from .serializers import KPISerializer, KPICreateUpdateSerializer


@api_view(["GET"])
def health(request):
	return Response({"status": "ok"})


class KPIListCreateView(APIView):
	def get(self, request):
		# Optional filter by project id: ?id_proyecto=123
		id_proyecto = request.query_params.get('id_proyecto')
		qs = KPI.objects.all().order_by('-id_kpi')
		if id_proyecto:
			qs = qs.filter(id_proyecto=id_proyecto)
		return Response(KPISerializer(qs, many=True).data)

	def post(self, request):
		ser = KPICreateUpdateSerializer(data=request.data)
		if ser.is_valid():
			kpi = ser.save()
			# Notificación al PM del proyecto si existe
			try:
				proj = Proyecto.objects.filter(id_proyecto=kpi.id_proyecto).first()
				if proj and proj.id_pm:
					create_notification_if_enabled(
						id_usuario=proj.id_pm,
						tipo='kpi_creada',
						titulo=f"KPI creada: {kpi.nombre}",
						mensaje=(kpi.descripcion or ''),
						link=f"/dashboard/kpi"
					)
			except Exception:
				pass
			return Response(KPISerializer(kpi).data, status=status.HTTP_201_CREATED)
		return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


class KPIDetailView(APIView):
	def get(self, request, id_kpi: int):
		kpi = get_object_or_404(KPI, pk=id_kpi)
		return Response(KPISerializer(kpi).data)

	def put(self, request, id_kpi: int):
		kpi = get_object_or_404(KPI, pk=id_kpi)
		ser = KPICreateUpdateSerializer(kpi, data=request.data)
		if ser.is_valid():
			kpi = ser.save()
			return Response(KPISerializer(kpi).data)
		return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

	def delete(self, request, id_kpi: int):
		kpi = get_object_or_404(KPI, pk=id_kpi)
		kpi.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)


class KPIProgressView(APIView):
	def post(self, request, id_kpi: int):
		# Allows updating only valor_actual quickly
		kpi = get_object_or_404(KPI, pk=id_kpi)
		valor_actual = request.data.get('valor_actual')
		try:
			valor = float(valor_actual)
		except (TypeError, ValueError):
			return Response({'valor_actual': 'Debe ser numérico'}, status=status.HTTP_400_BAD_REQUEST)
		if valor < 0:
			return Response({'valor_actual': 'Debe ser >= 0'}, status=status.HTTP_400_BAD_REQUEST)
		kpi.valor_actual = valor
		kpi.save(update_fields=['valor_actual'])
		return Response(KPISerializer(kpi).data)
