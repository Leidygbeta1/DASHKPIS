import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Usuario de prueba
const TEST_EMAIL = "admin@g.com";
const TEST_PASSWORD = "admin";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Estado de intro → inicia en true solo en escritorio
  const [introActiva, setIntroActiva] = useState(() => window.innerWidth >= 768);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Cargar correo recordado
  useEffect(() => {
    const remembered = localStorage.getItem("rememberedEmail");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (email === TEST_EMAIL && password === TEST_PASSWORD) {
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      navigate("/dashboard");
    } else {
      setErrorMsg("Correo o contraseña incorrectos.");
    }
  };

  const handleEnd = () => setIntroActiva(false);
  const handleError = () => setIntroActiva(false);
  const saltarIntro = () => {
    setIntroActiva(false);
    videoRef.current?.pause();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Video escritorio */}
      <video
        ref={videoRef}
        className="hidden md:block absolute inset-0 w-full h-full object-cover pointer-events-none"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleEnd}
        onError={handleError}
      >
        <source
          src={`${import.meta.env.BASE_URL}assets/video2.webm`}
          type="video/webm"
        />
      </video>

      {/* Fondo azul móvil */}
      <div
        className="block md:hidden absolute inset-0"
        style={{ backgroundColor: "#DEE4FA" }}
      />

      {/* Fondo blur escritorio */}
      <div
        className={`hidden md:block absolute inset-0 transition-colors duration-700 ${
          introActiva ? "bg-transparent" : "bg-white/55 backdrop-blur-md"
        }`}
      />

      {/* Botón saltar intro */}
      {introActiva && (
        <button
          onClick={saltarIntro}
          className="hidden md:block absolute z-20 bottom-6 right-6 bg-white/80 hover:bg-white text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium shadow transition-colors"
        >
          Saltar intro
        </button>
      )}

      {/* Contenido */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div
          className={`w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transition-all duration-700 ${
            introActiva
              ? "opacity-0 translate-y-6 pointer-events-none"
              : "opacity-100 translate-y-0"
          }`}
        >
          {/* Header centrado */}
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              ¡Bienvenido a <span className="text-blue-600">DashKPIs</span>! 👋
            </h1>
            <p className="text-gray-600 text-sm mt-2">
              Inicia sesión en tu cuenta y empieza la aventura
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Correo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border-gray-300 focus:border-blue-600 focus:ring-blue-600 py-2 px-3"
                placeholder="tu@correo.com"
                required
              />
            </div>

            {/* Contraseña + ojo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-600 focus:ring-blue-600 py-2 px-3 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Recordarme */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-700"
              >
                Recordarme
              </label>
            </div>

            {errorMsg && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
                {errorMsg}
              </div>
            )}

            {/* Botón login */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2.5 transition-colors"
            >
              Iniciar sesión
            </button>

            {/* Links de navegación */}
            <p className="text-sm text-gray-600 text-center">
              ¿Nuevo en la plataforma?{" "}
              <span
                onClick={() => navigate("/register")}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Crear cuenta
              </span>
            </p>

            <p
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-blue-600 hover:underline cursor-pointer text-center mt-2"
            >
              ¿Olvidaste tu contraseña?
            </p>

            {/* Usuario de prueba */}
            <p className="text-xs text-gray-400 text-center mt-4">
              Usuario de prueba: <br />
              <strong>{TEST_EMAIL}</strong> / <strong>{TEST_PASSWORD}</strong>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
