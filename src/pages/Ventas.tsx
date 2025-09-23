import React from 'react';

const Ventas: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ventas</h1>
        <p className="text-gray-600">Gestión y análisis de ventas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas del Mes</h3>
          <div className="text-3xl font-bold text-green-600 mb-2">$45,892</div>
          <p className="text-sm text-gray-600">+12% vs mes anterior</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos Vendidos</h3>
          <div className="text-3xl font-bold text-blue-600 mb-2">1,247</div>
          <p className="text-sm text-gray-600">+8% vs mes anterior</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Promedio</h3>
          <div className="text-3xl font-bold text-purple-600 mb-2">$36.80</div>
          <p className="text-sm text-gray-600">+5% vs mes anterior</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimas Ventas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#12345</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Juan Pérez</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Producto A</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$125.00</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Completado
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ventas;