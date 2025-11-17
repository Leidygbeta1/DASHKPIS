from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_usuario"),
    ]

    operations = [
        migrations.AddField(
            model_name='userformatpreference',
            name='fondo',
            field=models.CharField(max_length=255, null=True, blank=True),
        ),
    ]
