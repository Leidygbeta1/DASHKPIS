from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import PanelLayoutPreference


class PanelLayoutPreferenceTests(APITestCase):
    def setUp(self):
        self.url = reverse('dashboard-layout')
        self.panel_state = {
            'panels': [
                {'id': 'stats', 'order': 0, 'colSpan': 12},
                {'id': 'kpiByType', 'order': 1, 'colSpan': 6},
                {'id': 'tasksStatus', 'order': 2, 'colSpan': 6},
                {'id': 'progressByProject', 'order': 3, 'colSpan': 12},
                {'id': 'kpiTrend', 'order': 4, 'colSpan': 12},
            ]
        }

    def test_get_returns_default_when_no_preference(self):
        resp = self.client.get(f'{self.url}?id_usuario=1')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['layout_code'], 'grid-2')
        self.assertTrue(resp.data['panel_state']['panels'])

    def test_post_creates_or_updates_preference(self):
        payload = {
            'id_usuario': 5,
            'id_proyecto': 0,
            'layout_code': 'focus-kpi',
            'panel_state': self.panel_state,
            'pinned_panels': ['stats'],
        }
        resp = self.client.post(self.url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['layout_code'], 'focus-kpi')
        self.assertEqual(resp.data['pinned_panels'], ['stats'])
        self.assertTrue(PanelLayoutPreference.objects.filter(id_usuario=5).exists())

        # Update - change layout code
        payload['layout_code'] = 'progress-focus'
        resp = self.client.post(self.url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['layout_code'], 'progress-focus')

    def test_delete_resets_preference(self):
        PanelLayoutPreference.objects.create(
            id_usuario=9,
            id_proyecto=0,
            layout_code='grid-3',
            panel_state=self.panel_state,
            pinned_panels=[],
        )
        resp = self.client.delete(f'{self.url}?id_usuario=9')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['layout_code'], 'grid-2')
        self.assertFalse(PanelLayoutPreference.objects.filter(id_usuario=9).exists())
