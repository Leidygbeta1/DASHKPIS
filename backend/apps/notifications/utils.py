from .models import Notificacion, ConfigNotificacion


def create_notification_if_enabled(id_usuario: int, tipo: str, titulo: str, mensaje: str | None = None, link: str | None = None) -> bool:
    """
    Crea una notificación si el usuario tiene activa la preferencia para ese tipo.
    Si no existe configuración para ese tipo, se asume activa por defecto.
    Retorna True si se creó, False si se omitió por configuración.
    """
    try:
        conf = ConfigNotificacion.objects.filter(id_usuario=id_usuario, tipo=tipo).first()
        if conf is not None and not conf.activo:
            return False
    except Exception:
        # Si falla leer config (tabla unmanaged / permisos), no bloqueamos la notificación
        pass
    Notificacion.objects.create(
        id_usuario=id_usuario,
        tipo=tipo,
        titulo=titulo,
        mensaje=mensaje,
        link=link,
    )
    return True
