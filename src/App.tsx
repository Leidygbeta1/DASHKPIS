import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/dashboard/Header';
import Sidebar from './components/dashboard/Sidebar';
import DashboardHome from './pages/DashboardHome';
import Ventas from './pages/Ventas';
import Clientes from './pages/Clientes';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/clientes" element={<Clientes />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App
