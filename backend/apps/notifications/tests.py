from unittest.mock import MagicMock, patch
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status


class NotificationConfigViewTests(APITestCase):
    def setUp(self):
        self.url = lambda uid: reverse('notification-config', args=[uid])

    @patch('apps.notifications.views.connection.cursor')
    def test_get_returns_defaults_when_no_rows(self, mock_cursor):
        mock_cur = MagicMock()
        mock_cur.__enter__.return_value = mock_cur
        mock_cur.fetchall.return_value = []
        mock_cursor.return_value = mock_cur

        resp = self.client.get(self.url(5))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(any(item['categoria'] == 'canal' for item in resp.data))

    @patch('apps.notifications.views.connection.cursor')
    def test_put_upserts_preferences(self, mock_cursor):
        mock_cur = MagicMock()
        mock_cur.__enter__.return_value = mock_cur
        mock_cur.fetchall.return_value = [('canal_email', 0)]

        def execute_side_effect(query, params):
            if 'UPDATE' in query:
                mock_cur.rowcount = 0
            else:
                mock_cur.rowcount = 1

        mock_cur.execute.side_effect = execute_side_effect
        mock_cursor.return_value = mock_cur

        payload = [{'tipo': 'canal_email', 'activo': False}]
        resp = self.client.put(self.url(2), payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        tipos = [item['tipo'] for item in resp.data]
        self.assertIn('canal_email', tipos)

    @patch('apps.notifications.views.connection.cursor')
    def test_delete_resets_preferences(self, mock_cursor):
        mock_cur = MagicMock()
        mock_cur.__enter__.return_value = mock_cur
        mock_cur.fetchall.return_value = []
        mock_cursor.return_value = mock_cur

        resp = self.client.delete(self.url(9))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(all('activo' in item for item in resp.data))
