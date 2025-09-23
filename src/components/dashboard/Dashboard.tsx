import React from 'react';
import KPICard from '../kpi/KPICard';
import Header from './Header';
import Sidebar from './Sidebar';


const Dashboard: React.FC = () => {
  const kpiData = [
    {
      title: 'Ventas Totales',
      value: '$124,592',
      change: 12.5,
      icon: '💰',
      color: 'bg-green-500'
    },
    {
      title: 'Nuevos Clientes',
      value: '1,247',
      change: 8.2,
      icon: '👥',
      color: 'bg-blue-500'
      // hola, esta es otra prueba
    },
    {
      title: 'Pedidos',
      value: '892',
      change: -3.1,
      icon: '📦',
      color: 'bg-purple-500'
    },
    {
      title: 'Satisfacción',
      value: '94.2%',
      change: 2.1,
      icon: '⭐',
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de KPIs</h1>
            <p className="text-gray-600">Resumen general de métricas importantes</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiData.map((kpi, index) => (
              <KPICard key={index} {...kpi} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gráfico de Ventas</h3>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Gráfico de ventas aquí</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Nueva venta: $1,250</span>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Cliente nuevo registrado</span>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Pedido #12345 completado</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;