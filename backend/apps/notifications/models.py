from django.db import models


class Notificacion(models.Model):
    class Meta:
        db_table = 'notificaciones'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'

    id_notificacion = models.AutoField(primary_key=True)
    id_usuario = models.IntegerField()
    tipo = models.CharField(max_length=50)
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField(null=True, blank=True)
    link = models.CharField(max_length=300, null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    leida = models.BooleanField(default=False)

    def __str__(self) -> str:  # pragma: no cover
        return f"[{self.tipo}] {self.titulo}"


class ConfigNotificacion(models.Model):
    class Meta:
        managed = False
        db_table = 'config_notificaciones'
        unique_together = (('id_usuario', 'tipo'),)

    id_usuario = models.IntegerField(primary_key=True)
    tipo = models.CharField(max_length=50)
    activo = models.BooleanField()
