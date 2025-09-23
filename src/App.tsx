import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Kpi from './pages/KPI';
import Tarea from './pages/Tarea';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Inicio → login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Rutas del dashboard */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="kpi" element={<Kpi />} />
        <Route path="tarea" element={<Tarea />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>

      {/* Cualquier otra → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
