from django.db import models


class KPI(models.Model):
	TIPOS = (
		("Financiero", "Financiero"),
		("Operacional", "Operacional"),
		("Cliente", "Cliente"),
		("Marketing", "Marketing"),
	)

	class Meta:
		managed = False  # existing table in Azure SQL
		db_table = 'kpis'
		verbose_name = 'KPI'
		verbose_name_plural = 'KPIs'

	id_kpi = models.AutoField(primary_key=True)
	nombre = models.CharField(max_length=150)
	descripcion = models.TextField(null=True, blank=True)
	valor_objetivo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
	valor_actual = models.DecimalField(max_digits=10, decimal_places=2, default=0)
	tipo = models.CharField(max_length=20, choices=TIPOS)
	id_proyecto = models.IntegerField()
	fecha_creacion = models.DateTimeField(auto_now_add=True)

	def __str__(self) -> str:  # pragma: no cover
		return f"{self.nombre} ({self.tipo})"
