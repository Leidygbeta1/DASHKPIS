import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword"; 
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import Kpi from "./pages/KPI";
import Proyectos from "./pages/Proyectos";
import Tarea from "./pages/Tarea";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import Notificaciones from "./pages/Notificaciones";

const App: React.FC = () => {
  return (
    <Routes>
      {/* Inicio → login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} /> 

      {/* Rutas del dashboard */}
      <Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<DashboardHome />} />
  <Route path="proyectos" element={<Proyectos />} />
        <Route path="kpi" element={<Kpi />} />
        <Route path="tarea" element={<Tarea />} />
        <Route path="reportes" element={<Reportes />} />
  <Route path="notificaciones" element={<Notificaciones />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>

      {/* Cualquier otra → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
