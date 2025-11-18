from django.urls import path
from .views import (
    ProyectoListCreateView,
    ProyectoRetrieveUpdateDestroyView,
    PanelLayoutPreferenceView,
    ReportExportPDFView,
    ReportItemsView,
    ReportListCreateView,
    ReportRetrieveDeleteView,
    ReportPDFDetailView,
    ReportExportCSVView,
    ReportCSVDetailView,
)
from .views_tareas import (
    TareaListView, TareaCreateView, TareaUpdateView,
    TareaAssignView, TareaDueDateView, TareaTiempoView,
    TareaCompleteView, TareaDeleteView, TareaProgressView
)

urlpatterns = [
    path('proyectos/', ProyectoListCreateView.as_view(), name='proyecto-list-create'),
    path('proyectos/<int:id_proyecto>/', ProyectoRetrieveUpdateDestroyView.as_view(), name='proyecto-rud'),
    path('dashboard/layout/', PanelLayoutPreferenceView.as_view(), name='dashboard-layout'),
    path('reportes/export/pdf/', ReportExportPDFView.as_view(), name='report-export-pdf'),
    path('reportes/items/', ReportItemsView.as_view(), name='report-items'),
    path('reportes/', ReportListCreateView.as_view(), name='report-list-create'),
    path('reportes/<int:id_reporte>/', ReportRetrieveDeleteView.as_view(), name='report-rd'),
    path('reportes/<int:id_reporte>/pdf/', ReportPDFDetailView.as_view(), name='report-pdf'),
    path('reportes/export/csv/', ReportExportCSVView.as_view(), name='report-export-csv'),
    path('reportes/<int:id_reporte>/csv/', ReportCSVDetailView.as_view(), name='report-csv'),
    # Tareas
    path('proyectos/<int:id_proyecto>/tareas/', TareaListView.as_view(), name='tarea-list'),
    path('tareas/', TareaCreateView.as_view(), name='tarea-create'),
    path('tareas/<int:id_tarea>/', TareaUpdateView.as_view(), name='tarea-update'),
    path('tareas/<int:id_tarea>/assign/', TareaAssignView.as_view(), name='tarea-assign'),
    path('tareas/<int:id_tarea>/duedate/', TareaDueDateView.as_view(), name='tarea-duedate'),
    path('tareas/<int:id_tarea>/tiempo/', TareaTiempoView.as_view(), name='tarea-tiempo'),
    path('tareas/<int:id_tarea>/complete/', TareaCompleteView.as_view(), name='tarea-complete'),
    path('tareas/<int:id_tarea>/delete/', TareaDeleteView.as_view(), name='tarea-delete'),
    path('tareas/<int:id_tarea>/progress/', TareaProgressView.as_view(), name='tarea-progress'),
]
