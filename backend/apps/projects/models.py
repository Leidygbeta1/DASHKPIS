from django.db import models


class Proyecto(models.Model):
    class Meta:
        managed = False
        db_table = 'proyectos'
        verbose_name = 'Proyecto'
        verbose_name_plural = 'Proyectos'

    id_proyecto = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(null=True, blank=True)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    id_pm = models.IntegerField(null=True, blank=True)


class Tarea(models.Model):
    class Meta:
        managed = False
        db_table = 'tareas'

    id_tarea = models.AutoField(primary_key=True)
    id_proyecto = models.IntegerField()
    id_usuario_asignado = models.IntegerField(null=True, blank=True)
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(null=True, blank=True)
    fecha_creacion = models.DateTimeField()
    fecha_vencimiento = models.DateField(null=True, blank=True)
    prioridad = models.CharField(max_length=10)
    progreso = models.DecimalField(max_digits=5, decimal_places=2)
    estado = models.CharField(max_length=15)


class TiempoTarea(models.Model):
    class Meta:
        managed = False
        db_table = 'tiempo_tareas'

    id_registro = models.AutoField(primary_key=True)
    id_tarea = models.IntegerField()
    id_usuario = models.IntegerField()
    horas = models.DecimalField(max_digits=5, decimal_places=2)
    fecha_registro = models.DateTimeField()


class PanelLayoutPreference(models.Model):
    id_usuario = models.IntegerField()
    id_proyecto = models.IntegerField(default=0)
    layout_code = models.CharField(max_length=50, default='grid-2')
    panel_state = models.JSONField(default=dict, blank=True)
    pinned_panels = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'dashboard_panel_layouts'
        verbose_name = 'Preferencia de layout'
        verbose_name_plural = 'Preferencias de layout'
        constraints = [
            models.UniqueConstraint(fields=['id_usuario', 'id_proyecto'], name='uniq_panel_layout_usuario_proyecto')
        ]
