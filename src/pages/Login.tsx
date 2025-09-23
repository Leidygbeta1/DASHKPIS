import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [introActiva, setIntroActiva] = useState(true); // true = mostrando video

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // después de login, ir al dashboard
    navigate('/dashboard');
  };

  const handleEnd = () => setIntroActiva(false);
  const handleError = () => setIntroActiva(false);
  const saltarIntro = () => {
    setIntroActiva(false);
    // pausa el video si sigue corriendo
    videoRef.current?.pause();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Video de fondo (reproduce una vez) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleEnd}
        onError={handleError}
      >
        <source src={`${import.meta.env.BASE_URL}assets/video2.webm`} type="video/webm" />
      </video>

      {/* Capa para aclarar el fondo cuando termina la intro */}
      <div
        className={
          `absolute inset-0 transition-colors duration-700 ` +
          (introActiva ? 'bg-transparent' : 'bg-white/55 backdrop-blur-md')
        }
      />

      {/* Botón para saltar la intro (solo visible mientras el video está activo) */}
      {introActiva && (
        <button
          onClick={saltarIntro}
          className="absolute z-20 bottom-6 right-6 bg-white/80 hover:bg-white text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium shadow transition-colors"
        >
          Saltar intro
        </button>
      )}

      {/* Contenido: aparece al finalizar la intro con fade + slide */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div
          className={
            `w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8
             transition-all duration-700
             ${introActiva ? 'opacity-0 translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'}`
          }
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">DASHKPIS</h1>
            <p className="text-gray-600">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <input
                type="email"
                className="w-full rounded-lg border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                placeholder="tu@correo.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                className="w-full rounded-lg border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2.5 transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;