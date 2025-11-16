from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class ReportExportPDFTests(APITestCase):
    def setUp(self):
        self.url = reverse('report-export-pdf')

    def test_export_pdf_success(self):
        payload = {
            'titulo': 'Reporte Semanal',
            'filtros': {'Periodo': 'Q1', 'Estado': 'En objetivo'},
            'resumen': {'Promedio': '85%', 'KPIs en riesgo': '2'},
            'items': [
                {'initiative': 'Automatizacion', 'status': 'on-track', 'progress': '90%', 'owner': 'Ana'},
                {'initiative': 'Campaña', 'status': 'at-risk', 'progress': '65%', 'owner': 'Luis'},
            ],
            'secciones': [{'label': 'Resumen ejecutivo', 'description': 'Resultados clave.'}],
            'nota': 'Generado desde pruebas automáticas.',
        }
        resp = self.client.post(self.url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp['Content-Type'], 'application/pdf')
        self.assertTrue(resp.content.startswith(b'%PDF'))

    def test_requires_title(self):
        resp = self.client.post(self.url, {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
