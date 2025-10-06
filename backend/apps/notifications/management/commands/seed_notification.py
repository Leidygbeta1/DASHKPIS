from django.core.management.base import BaseCommand, CommandError
from apps.notifications.models import Notificacion


class Command(BaseCommand):
    help = "Crea una notificación de prueba para un usuario: seed_notification <id_usuario> [mensaje]"

    def add_arguments(self, parser):
        parser.add_argument('id_usuario', type=int, help='ID de usuario receptor')
        parser.add_argument('--mensaje', type=str, default='Notificación de prueba', help='Mensaje opcional')

    def handle(self, *args, **options):
        uid = options['id_usuario']
        msg = options['mensaje']
        try:
            n = Notificacion.objects.create(
                id_usuario=uid,
                tipo='prueba',
                titulo='Hola 👋',
                mensaje=msg,
                link='/dashboard',
            )
            self.stdout.write(self.style.SUCCESS(f'Notificación creada con id={n.id_notificacion} para usuario {uid}'))
        except Exception as e:
            raise CommandError(str(e))
