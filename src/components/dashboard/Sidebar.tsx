import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/' },
    { name: 'Ventas', icon: '💰', path: '/ventas' },
    { name: 'Clientes', icon: '👥', path: '/clientes' },
    { name: 'Productos', icon: '📦', path: '/productos' },
    { name: 'Reportes', icon: '📈', path: '/reportes' },
    { name: 'Configuración', icon: '⚙️', path: '/configuracion' },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="text-xl font-bold text-gray-900">DASHKAPIS</span>
        </div>
        
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={index}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-1">¿Necesitas ayuda?</h4>
          <p className="text-sm text-blue-700 mb-3">Consulta nuestra documentación</p>
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Ver Guía
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;