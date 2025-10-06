from django.db import migrations


SQL = r"""
-- Ensure required columns exist on 'notificaciones'
IF COL_LENGTH('notificaciones', 'tipo') IS NULL
BEGIN
    ALTER TABLE notificaciones ADD tipo NVARCHAR(50) NOT NULL CONSTRAINT DF_notificaciones_tipo DEFAULT('general') WITH VALUES;
END

IF COL_LENGTH('notificaciones', 'titulo') IS NULL
BEGIN
    ALTER TABLE notificaciones ADD titulo NVARCHAR(200) NOT NULL CONSTRAINT DF_notificaciones_titulo DEFAULT('') WITH VALUES;
END

IF COL_LENGTH('notificaciones', 'mensaje') IS NULL
BEGIN
    ALTER TABLE notificaciones ADD mensaje NVARCHAR(MAX) NULL;
END

IF COL_LENGTH('notificaciones', 'link') IS NULL
BEGIN
    ALTER TABLE notificaciones ADD link NVARCHAR(300) NULL;
END

IF COL_LENGTH('notificaciones', 'fecha') IS NULL
BEGIN
    ALTER TABLE notificaciones ADD fecha DATETIME2 NOT NULL CONSTRAINT DF_notificaciones_fecha DEFAULT(SYSDATETIME()) WITH VALUES;
END

IF COL_LENGTH('notificaciones', 'leida') IS NULL
BEGIN
    ALTER TABLE notificaciones ADD leida BIT NOT NULL CONSTRAINT DF_notificaciones_leida DEFAULT(0) WITH VALUES;
END
"""


class Migration(migrations.Migration):
    dependencies = [
        ('notifications', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(sql=SQL, reverse_sql=migrations.RunSQL.noop),
    ]
