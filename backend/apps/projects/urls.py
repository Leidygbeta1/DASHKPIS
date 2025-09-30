from django.urls import path
from .views import ProyectoListCreateView, ProyectoRetrieveUpdateDestroyView
from .views_tareas import (
    TareaListView, TareaCreateView, TareaUpdateView,
    TareaAssignView, TareaDueDateView, TareaTiempoView,
    TareaCompleteView, TareaDeleteView, TareaProgressView
)

urlpatterns = [
    path('proyectos/', ProyectoListCreateView.as_view(), name='proyecto-list-create'),
    path('proyectos/<int:id_proyecto>/', ProyectoRetrieveUpdateDestroyView.as_view(), name='proyecto-rud'),
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
