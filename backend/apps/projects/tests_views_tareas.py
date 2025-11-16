from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone


def fake_tarea(**kwargs):
    """Devuelve un fake con todos los campos esperados por TareaSerializer"""
    m = MagicMock()
    m.id_tarea = kwargs.get("id_tarea", 1)
    m.id_proyecto = kwargs.get("id_proyecto", 1)
    m.titulo = kwargs.get("titulo", "Demo tarea")
    m.descripcion = kwargs.get("descripcion", "Descripción demo")
    m.fecha_vencimiento = kwargs.get("fecha_vencimiento", timezone.now().date())
    m.id_usuario_asignado = kwargs.get("id_usuario_asignado", 1)
    m.prioridad = kwargs.get("prioridad", "Media")
    m.estado = kwargs.get("estado", "Pendiente")
    m.progreso = kwargs.get("progreso", 0.0)
    return m


class ViewsTareasTests(APITestCase):
    def setUp(self):
        # Endpoints definidos en urls.py
        self.list_url = lambda pid: reverse("tarea-list", args=[pid])
        self.create_url = reverse("tarea-create")
        self.update_url = lambda tid: reverse("tarea-update", args=[tid])
        self.assign_url = lambda tid: reverse("tarea-assign", args=[tid])
        self.due_date_url = lambda tid: reverse("tarea-duedate", args=[tid])
        self.tiempo_url = lambda tid: reverse("tarea-tiempo", args=[tid])
        self.complete_url = lambda tid: reverse("tarea-complete", args=[tid])
        self.delete_url = lambda tid: reverse("tarea-delete", args=[tid])
        self.progress_url = lambda tid: reverse("tarea-progress", args=[tid])

    # ---------- UC-10 Listar tareas ----------
    @patch("apps.projects.models.Tarea.objects")
    def test_listar_tareas_por_proyecto(self, mock_objects):
        mock_objects.filter.return_value = [fake_tarea()]
        resp = self.client.get(self.list_url(1))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    # ---------- UC-01 Crear tarea ----------
    @patch("apps.projects.models.Tarea.objects")
    @patch("apps.projects.views_tareas.connection.cursor")
    def test_crear_tarea(self, mock_cursor, mock_objects):
        mock_cur = MagicMock()
        mock_cursor.return_value.__enter__.return_value = mock_cur
        mock_cur.fetchone.return_value = [1]
        mock_objects.get.return_value = fake_tarea(id_tarea=1, titulo="Nueva")

        resp = self.client.post(self.create_url, {
            "id_proyecto": 1,
            "titulo": "Nueva",
            "descripcion": "Prueba",
            "fecha_vencimiento": "2025-10-01",
            "id_usuario_asignado": 1,
            "prioridad": "Alta"
        }, format="json")

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    # ---------- UC-12 Editar tarea ----------
    @patch("apps.projects.models.Tarea.objects")
    @patch("apps.projects.views_tareas.connection.cursor")
    def test_actualizar_tarea(self, mock_cursor, mock_objects):
        mock_cursor.return_value.__enter__.return_value = MagicMock()
        mock_objects.get.side_effect = [fake_tarea(), fake_tarea(titulo="Editada")]

        resp = self.client.put(self.update_url(1), {
            "id_proyecto": 1,
            "titulo": "Editada",
            "descripcion": "Act",
            "fecha_vencimiento": "2025-10-02",
            "id_usuario_asignado": 2,
            "prioridad": "Baja"
        }, format="json")

        self.assertEqual(resp.status_code, 200)

    # ---------- UC-02 Asignar ----------
    @patch("apps.projects.models.Tarea.objects")
    @patch("apps.projects.views_tareas.connection.cursor")
    def test_asignar_tarea(self, mock_cursor, mock_objects):
        mock_cursor.return_value.__enter__.return_value = MagicMock()
        mock_objects.get.return_value = fake_tarea(id_usuario_asignado=99)

        resp = self.client.post(self.assign_url(1), {"id_usuario_asignado": 99}, format="json")
        self.assertEqual(resp.status_code, 200)

    # ---------- UC-03 Cambiar fecha límite ----------
    @patch("apps.projects.models.Tarea.objects")
    @patch("apps.projects.views_tareas.connection.cursor")
    def test_cambiar_fecha_vencimiento(self, mock_cursor, mock_objects):
        mock_cursor.return_value.__enter__.return_value = MagicMock()
        mock_objects.get.return_value = fake_tarea(fecha_vencimiento=timezone.now().date())

        resp = self.client.post(self.due_date_url(1), {"fecha_vencimiento": "2025-11-01"}, format="json")
        self.assertEqual(resp.status_code, 200)

    # ---------- UC-04 Registrar tiempo ----------
    @patch("apps.projects.models.TiempoTarea.objects")
    @patch("apps.projects.views_tareas.connection.cursor")
    def test_registrar_tiempo(self, mock_cursor, mock_objects):
        mock_cursor.return_value.__enter__.return_value = MagicMock()
        mock_objects.filter.return_value.aggregate.return_value = {"total": 5}

        resp = self.client.post(self.tiempo_url(1), {
            "id_usuario": 1,
            "horas": 3
        }, format="json")

        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["total_horas"], 5.0)

    # ---------- UC-05 Marcar completada ----------
    @patch("apps.projects.models.Tarea.objects")
    @patch("apps.projects.views_tareas.connection.cursor")
    def test_completar_tarea(self, mock_cursor, mock_objects):
        mock_cursor.return_value.__enter__.return_value = MagicMock()
        mock_objects.get.return_value = fake_tarea(estado="Completada", progreso=100.0)

        resp = self.client.post(self.complete_url(1))
        self.assertEqual(resp.status_code, 200)

    # ---------- UC-18 Eliminar ----------
    @patch("apps.projects.views_tareas.connection.cursor")
    def test_eliminar_tarea(self, mock_cursor):
        mock_cursor.return_value.__enter__.return_value = MagicMock()
        resp = self.client.delete(self.delete_url(1))
        self.assertEqual(resp.status_code, 204)

    # ---------- UC-Actualizar progreso ----------
    @patch("apps.projects.models.Tarea.objects")
    @patch("apps.projects.views_tareas.connection.cursor")
    def test_actualizar_progreso(self, mock_cursor, mock_objects):
        mock_cursor.return_value.__enter__.return_value = MagicMock()
        mock_objects.get.return_value = fake_tarea(progreso=50.0, estado="En progreso")

        resp = self.client.post(self.progress_url(1), {"progreso": 50}, format="json")
        self.assertEqual(resp.status_code, 200)
