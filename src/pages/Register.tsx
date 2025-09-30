import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRegister } from "../services/auth";

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"PM" | "Colaborador" | "Stakeholder">("Colaborador");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 👇 Animación de entrada
  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 100); // pequeño delay
    return () => clearTimeout(timer);
  }, []);

  const validatePassword = (pwd: string) => {
    const regex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    return regex.test(pwd);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

  const missing: string[] = [];
  if (!fullName.trim()) missing.push("Nombre completo");
  if (!email.trim()) missing.push("Correo");
  if (!password.trim()) missing.push("Contraseña");
  if (!confirmPassword.trim()) missing.push("Confirmación de contraseña");

    if (missing.length > 0) {
      setErrorMsg("Completar el campo: " + missing.join(", "));
      return;
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailValid) {
      setErrorMsg("Por favor ingresa un correo válido.");
      return;
    }

    if (!validatePassword(password)) {
      setErrorMsg(
        "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, un número y un caracter especial."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    // Llamar a API backend
    setLoading(true);
    apiRegister({ email: email.trim(), password, rol: role })
      .then(() => {
        setSuccessMsg("Registro exitoso. Ahora puedes iniciar sesión.");
        setTimeout(() => navigate("/login"), 1500);
      })
      .catch((err: any) => {
        const msg = (err?.message || "Error al registrar").trim();
        setErrorMsg(msg);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#DEE4FA" }}
    >
      <div
        className={`w-full max-w-md bg-white rounded-2xl shadow-xl p-8
          transition-all duration-700
          ${showForm ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        `}
      >
        {/* Encabezado */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Empieza la aventura 🚀!
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            Crea tu cuenta para gestionar tus KPIs fácilmente
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 text-sm"
              required
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Rol
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="mt-1 block w-full rounded-md border border-gray-300 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 text-sm"
            >
              <option value="PM">PM</option>
              <option value="Colaborador">Colaborador</option>
              <option value="Stakeholder">Stakeholder</option>
            </select>
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 text-sm"
              required
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 text-sm"
              required
            />
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 text-sm"
              required
            />
          </div>

          {/* Mensajes */}
          {errorMsg && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-100 rounded p-2">
              {successMsg}
            </div>
          )}

          {/* Botón principal */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-medium rounded-lg py-2.5 transition-colors ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Registrando…" : "Registrarse"}
          </button>

          {/* Link para ir a login */}
          <p className="text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-blue-600 font-medium cursor-pointer hover:underline"
            >
              Inicia sesión
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
