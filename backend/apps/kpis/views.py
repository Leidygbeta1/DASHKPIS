from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view


@api_view(["GET"])
def health(request):
	return Response({"status": "ok"})


class KPIList(APIView):
	def get(self, request):
		# Sample data; replace with DB models later
		data = [
			{"id": 1, "name": "Ventas", "value": 1200},
			{"id": 2, "name": "Usuarios", "value": 453},
		]
		return Response(data)
