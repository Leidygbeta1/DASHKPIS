import React from 'react';
import { NavLink } from 'react-router-dom';

type Props = { onNavigate?: () => void; className?: string };

const Sidebar: React.FC<Props> = ({ onNavigate, className }) => {
  const menu = [
    { name: 'Dashboard', path: '/dashboard', end: true, icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" className="fill-current"/>
      </svg>
    )},
    { name: 'KPI', path: '/dashboard/kpi', end: false, icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M4 13l4-4 4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 7v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )},
    { name: 'Tarea', path: '/dashboard/tarea', end: false, icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="3" width="14" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )},
    { name: 'Reportes', path: '/dashboard/reportes', end: false, icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M3 4h13l5 5v11a2 2 0 0 1-2 2H3V4z" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 4v6h6" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )},
    { name: 'Configuración', path: '/dashboard/configuracion', end: false, icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="2"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4 1.65 1.65 0 0 0 3.49 14H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 3.3l.06.06c.46.46 1.13.6 1.72.39.59-.22 1.01-.76 1.09-1.38V2a2 2 0 1 1 4 0v.09c.08.62.5 1.16 1.09 1.38.59.21 1.26.07 1.72-.39l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.46.46-.6 1.13-.39 1.72.22.59.76 1.01 1.38 1.09H22a2 2 0 1 1 0 4h-.09c-.62.08-1.16.5-1.38 1.09z" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    )},
  ];

  return (
    <aside className={className ?? 'w-64 h-full bg-white shadow-sm border-r border-gray-200'}>
      <div className="p-6">
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-lg">✓</span>
          </div>
          <span className="text-xl font-bold text-gray-900">DashKPIs</span>
        </div>

        <nav>
          <ul className="space-y-2">
            {menu.map(item => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="mr-3 text-gray-500">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="px-6 pb-6 hidden sm:block">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <h4 className="font-semibold text-blue-900 mb-1">¿Necesitas ayuda?</h4>
          <p className="text-sm text-blue-700 mb-3">Consulta la guía del proyecto.</p>
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow">
            Ver Guía
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;