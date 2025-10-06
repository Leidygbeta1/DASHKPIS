from django.urls import path
from .views import health, KPIListCreateView, KPIDetailView, KPIProgressView

urlpatterns = [
    path('health/', health, name='health'),
    path('kpis/', KPIListCreateView.as_view(), name='kpi-list-create'),
    path('kpis/<int:id_kpi>/', KPIDetailView.as_view(), name='kpi-detail'),
    path('kpis/<int:id_kpi>/progress/', KPIProgressView.as_view(), name='kpi-progress'),
]
