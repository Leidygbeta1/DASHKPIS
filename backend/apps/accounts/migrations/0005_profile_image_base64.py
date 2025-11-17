from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0003_add_fondo_pref'),
    ]

    operations = [
        migrations.AlterField(
            model_name='usuario',
            name='profile_image',
            field=models.TextField(null=True, blank=True),
        ),
    ]
