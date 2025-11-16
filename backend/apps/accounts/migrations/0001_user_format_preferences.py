from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='UserFormatPreference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('id_usuario', models.IntegerField()),
                ('formato_fecha', models.CharField(default='DD/MM/YYYY', max_length=20)),
                ('codigo_moneda', models.CharField(default='COP', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'dashboard_user_format_prefs',
            },
        ),
        migrations.AddConstraint(
            model_name='userformatpreference',
            constraint=models.UniqueConstraint(fields=('id_usuario',), name='uniq_formato_usuario'),
        ),
    ]

