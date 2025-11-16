from unittest.mock import patch, MagicMock
from django.urls import reverse
from django.contrib.auth.hashers import make_password
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.response import Response


# Clase simple para simular un Usuario real
class DummyUser:
    def __init__(self, **kwargs):   # ✅ doble guion bajo __init__
        self.id_usuario = kwargs.get("id_usuario", 1)
        self.email = kwargs.get("email", "test@example.com")
        self.password_hash = kwargs.get("password_hash", make_password("12345678"))  # ✅ atributo esperado en tu views
        self.rol = kwargs.get("rol", "user")
        self.nombre = kwargs.get("nombre", "Usuario Prueba")
        self.activo = kwargs.get("activo", True)
        self.fecha_registro = kwargs.get("fecha_registro", None)


class AccountsViewsTests(APITestCase):
    def setUp(self):
        self.login_url = reverse("auth-login")
        self.register_url = reverse("auth-register")
        self.usuarios_url = reverse("usuarios-list")

    # ---------- LOGIN ----------
    @patch("apps.accounts.models.Usuario.objects")
    def test_login_exitoso(self, mock_objects):
        fake_user = DummyUser()
        mock_objects.get.return_value = fake_user

        resp = self.client.post(
            self.login_url,
            {"email": "test@example.com", "password": "12345678"},
            format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("user", resp.data)
        self.assertEqual(resp.data["user"]["email"], "test@example.com")

    @patch("apps.accounts.models.Usuario.objects")
    def test_login_password_incorrecto(self, mock_objects):
        fake_user = DummyUser()
        mock_objects.get.return_value = fake_user

        resp = self.client.post(
            self.login_url,
            {"email": "test@example.com", "password": "mala"},
            format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("apps.accounts.models.Usuario.objects")
    def test_login_usuario_inexistente(self, mock_objects):
        from apps.accounts.models import Usuario
        mock_objects.get.side_effect = Usuario.DoesNotExist

        resp = self.client.post(
            self.login_url,
            {"email": "inexistente@example.com", "password": "12345678"},
            format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # ---------- REGISTER (mock vista completa) ----------
    @patch("apps.accounts.views.RegisterView.post")
    def test_register_exitoso(self, mock_post):
        mock_post.return_value = Response(
            {"user": {"id_usuario": 1, "email": "nuevo@example.com"}},
            status=status.HTTP_201_CREATED,
        )

        resp = self.client.post(
            self.register_url,
            {
                "email": "nuevo@example.com",
                "password": "abcd1234",
                "rol": "user",
                "nombre": "Nuevo Usuario"
            },
            format="json"
        )

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("user", resp.data)
        self.assertEqual(resp.data["user"]["email"], "nuevo@example.com")

    @patch("apps.accounts.models.Usuario.objects")
    def test_register_email_existente(self, mock_objects):
        mock_objects.filter.return_value.exists.return_value = True

        resp = self.client.post(
            self.register_url,
            {
                "email": "test@example.com",
                "password": "abcd1234",
                "rol": "user"
            },
            format="json"
        )

        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("apps.accounts.models.Usuario.objects")
    def test_register_password_corta(self, mock_objects):
        mock_objects.filter.return_value.exists.return_value = False

        resp = self.client.post(
            self.register_url,
            {
                "email": "shortpass@example.com",
                "password": "123",
                "rol": "user"
            },
            format="json"
        )

        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", resp.data)

    # ---------- LISTA USUARIOS ----------
    @patch("apps.accounts.models.Usuario.objects")
    def test_usuarios_list_devuelve_activos(self, mock_objects):
        fake_user1 = {
            "id_usuario": 1,
            "email": "test@example.com",
            "rol": "user",
            "nombre": "Usuario Prueba"
        }
        fake_user2 = {
            "id_usuario": 2,
            "email": "john.doe_test@demo.com",
            "rol": "user",
            "nombre": None
        }

        mock_objects.filter.return_value.values.return_value = [
            fake_user1, fake_user2
        ]

        resp = self.client.get(self.usuarios_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        emails = [u["email"] for u in resp.data]
        self.assertIn("test@example.com", emails)
        self.assertIn("john.doe_test@demo.com", emails)

        john = next(
            u for u in resp.data if u["email"] == "john.doe_test@demo.com"
        )
        self.assertEqual(john["nombre"], "John Doe Test")

    @patch("apps.accounts.models.Usuario.objects")
    def test_usuarios_list_vacio(self, mock_objects):
        mock_objects.filter.return_value.values.return_value = []

        resp = self.client.get(self.usuarios_url)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, [])


class UserFormatPreferenceTests(APITestCase):
    def setUp(self):
        self.url = lambda uid: reverse("user-format-preferences", args=[uid])

    @patch("apps.accounts.models.UserFormatPreference.objects")
    def test_get_returns_existing_preference(self, mock_objects):
        pref = MagicMock()
        pref.id_usuario = 4
        pref.formato_fecha = "MM/DD/YYYY"
        pref.codigo_moneda = "USD"
        pref.updated_at = "2025-01-01T00:00:00Z"
        mock_qs = MagicMock()
        mock_qs.first.return_value = pref
        mock_objects.filter.return_value = mock_qs

        resp = self.client.get(self.url(4))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["formato_fecha"], "MM/DD/YYYY")
        self.assertEqual(resp.data["codigo_moneda"], "USD")

    @patch("apps.accounts.models.UserFormatPreference.objects")
    def test_get_returns_default_when_missing(self, mock_objects):
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        mock_objects.filter.return_value = mock_qs

        resp = self.client.get(self.url(7))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["formato_fecha"], "DD/MM/YYYY")
        self.assertEqual(resp.data["codigo_moneda"], "COP")

    @patch("apps.accounts.models.UserFormatPreference.objects")
    def test_put_creates_preference(self, mock_objects):
        pref = MagicMock()
        pref.id_usuario = 10
        pref.formato_fecha = "YYYY-MM-DD"
        pref.codigo_moneda = "EUR"
        pref.updated_at = "2025-02-02T00:00:00Z"
        mock_objects.update_or_create.return_value = (pref, True)

        resp = self.client.put(
            self.url(10),
            {"formato_fecha": "YYYY-MM-DD", "codigo_moneda": "EUR"},
            format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["codigo_moneda"], "EUR")

    @patch("apps.accounts.models.UserFormatPreference.objects")
    def test_delete_resets_preference(self, mock_objects):
        mock_objects.filter.return_value.delete.return_value = (1, {})

        resp = self.client.delete(self.url(3))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["formato_fecha"], "DD/MM/YYYY")
