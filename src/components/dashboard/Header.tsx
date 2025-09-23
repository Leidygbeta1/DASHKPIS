import React from 'react';

type Props = { onMenuClick?: () => void };

const Header: React.FC<Props> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
        {/* Hamburguesa móvil */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700"
          aria-label="Abrir menú"
          onClick={onMenuClick}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Search */}
        <div className="flex-1">
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Buscar (Ctrl + K)"
              className="w-full rounded-xl border-gray-200 pl-11 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          {/* Icono de búsqueda en móvil */}
          <button className="sm:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14v-2A6 6 0 1 0 6 12v2a2 2 0 0 1-.6 1.4L4 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] leading-4 rounded-full text-center">3</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-2">
            <img className="w-8 h-8 rounded-full" src="https://i.pravatar.cc/40" alt="Avatar" />
            <div className="leading-4">
              <p className="text-sm font-semibold text-gray-900">Usuario</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;