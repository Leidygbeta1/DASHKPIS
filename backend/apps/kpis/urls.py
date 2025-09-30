from django.urls import path
from .views import health, KPIList

urlpatterns = [
    path('health/', health, name='health'),
    path('kpis/', KPIList.as_view(), name='kpi-list'),
]
