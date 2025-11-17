from django.db import migrations


SQL_ADD = """
IF OBJECT_ID(N'dbo.dashboard_user_format_prefs', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.dashboard_user_format_prefs', N'fondo') IS NULL
    BEGIN
        ALTER TABLE [dbo].[dashboard_user_format_prefs] ADD [fondo] NVARCHAR(255) NULL;
    END
END
"""

SQL_DROP = """
IF OBJECT_ID(N'dbo.dashboard_user_format_prefs', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.dashboard_user_format_prefs', N'fondo') IS NOT NULL
    BEGIN
        ALTER TABLE [dbo].[dashboard_user_format_prefs] DROP COLUMN [fondo];
    END
END
"""


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_add_fondo_pref"),
    ]

    operations = [
        migrations.RunSQL(SQL_ADD, SQL_DROP),
    ]
