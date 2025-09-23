import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';

const DashboardLayout: React.FC = () => {
  const [openMobile, setOpenMobile] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar móvil (drawer) */}
      <div className={`fixed inset-0 z-40 lg:hidden ${openMobile ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${openMobile ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpenMobile(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 w-72 max-w-[80%] transform transition-transform duration-300
                      ${openMobile ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <Sidebar onNavigate={() => setOpenMobile(false)} />
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setOpenMobile(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;