from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='PanelLayoutPreference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('id_usuario', models.IntegerField()),
                ('id_proyecto', models.IntegerField(default=0)),
                ('layout_code', models.CharField(default='grid-2', max_length=50)),
                ('panel_state', models.JSONField(blank=True, default=dict)),
                ('pinned_panels', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'dashboard_panel_layouts',
                'verbose_name': 'Preferencia de layout',
                'verbose_name_plural': 'Preferencias de layout',
            },
        ),
        migrations.AddConstraint(
            model_name='panellayoutpreference',
            constraint=models.UniqueConstraint(fields=('id_usuario', 'id_proyecto'), name='uniq_panel_layout_usuario_proyecto'),
        ),
    ]

