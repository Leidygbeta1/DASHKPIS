from django.db import models

class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    email = models.CharField(max_length=150, unique=True)
    password_hash = models.CharField(max_length=255)
    rol = models.CharField(max_length=20)
    nombre = models.CharField(max_length=150, null=True)
    fecha_registro = models.DateTimeField()
    activo = models.BooleanField()

    class Meta:
        managed = False  # tabla ya existe en Azure SQL
        db_table = 'usuarios'
        app_label = 'accounts'
