import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const mockUsers = [{ email: "admin@g.com" }]; // correo de prueba

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  // Animación inicial
  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Control de pasos
  const [step, setStep] = useState(1);
  const [transitioning, setTransitioning] = useState(false);

  // Estados
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [visibleCode, setVisibleCode] = useState("");

  const [generatedCode, setGeneratedCode] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validatePassword = (pwd: string) => {
    const regex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    return regex.test(pwd);
  };

  // Manejo de transición entre pasos
  const goToStep = (nextStep: number) => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      setTransitioning(false);
    }, 300); // duración salida
  };

  // Paso 1: enviar código
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailValid) {
      setErrorMsg("Por favor ingresa un correo válido.");
      return;
    }

    const exists = mockUsers.some((u) => u.email === email);
    if (!exists) {
      setErrorMsg("El correo no está registrado.");
      return;
    }

    const codeGen = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(codeGen);
    setVisibleCode(codeGen);
    console.log("Código enviado (simulado):", codeGen);

    setSuccessMsg("Se ha enviado un código a tu correo.");
    goToStep(2);
  };

  // Paso 2: verificar código
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (code !== generatedCode) {
      setErrorMsg("El código ingresado no es correcto.");
      return;
    }
    goToStep(3);
  };

  // Paso 3: resetear contraseña
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!validatePassword(newPassword)) {
      setErrorMsg(
        "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, un número y un caracter especial."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }
    setSuccessMsg("Contraseña restablecida con éxito.");
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#DEE4FA" }}
    >
      <div
        className={`w-full max-w-md bg-white rounded-xl shadow-lg p-8 transition-all duration-700 ${
          showForm ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Contenedor de pasos con animación */}
        <div
          className={`transition-all duration-500 ${
            transitioning
              ? "opacity-0 translate-y-6 pointer-events-none"
              : "opacity-100 translate-y-0"
          }`}
        >
          {/* Paso 1 */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  ¿Olvidaste tu contraseña? 🔒
                </h1>
                <p className="text-gray-600 text-sm mt-2">
                  Ingresa tu correo y te enviaremos un código
                </p>
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 text-sm"
                placeholder="tu@correo.com"
                required
              />

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

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2.5 transition-colors"
              >
                Enviar código
              </button>

              <p
                onClick={() => navigate("/login")}
                className="text-sm text-blue-600 cursor-pointer hover:underline mt-4 text-center"
              >
                ← Volver al login
              </p>
            </form>
          )}

          {/* Paso 2 */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Verifica tu correo 📩
                </h1>
                <p className="text-gray-600 text-sm mt-2">
                  Ingresa el código que enviamos a tu correo
                </p>
              </div>

              {/* Mostrar código de prueba */}
              {visibleCode && (
                <div className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded p-2 text-center font-mono">
                  Código de prueba: <strong>{visibleCode}</strong>
                </div>
              )}

              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 text-sm"
                placeholder="123456"
                required
              />

              {errorMsg && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2.5 transition-colors"
              >
                Verificar código
              </button>
            </form>
          )}

          {/* Paso 3 */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Nueva contraseña 🔑
                </h1>
                <p className="text-gray-600 text-sm mt-2">
                  Ingresa tu nueva contraseña segura
                </p>
              </div>

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 text-sm"
                placeholder="Nueva contraseña"
                required
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 text-sm"
                placeholder="Confirmar contraseña"
                required
              />

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

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2.5 transition-colors"
              >
                Guardar nueva contraseña
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
