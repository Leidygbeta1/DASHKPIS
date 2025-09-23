import React from 'react';

const MiniTrend = () => (
  <div className="flex items-end gap-1 h-10">
    {[6, 10, 4, 12, 8, 14, 9].map((h, i) => (
      <div key={i} className="w-1.5 rounded-sm bg-gradient-to-t from-blue-200 to-blue-500" style={{ height: `${h * 4}px` }} />
    ))}
  </div>
);

const StatCard = ({ title, value, delta, trendColor }:{
  title: string; value: string|number; delta: number; trendColor: 'green'|'rose'|'amber';
}) => {
  const map = {
    green: 'text-green-600 bg-green-50',
    rose: 'text-rose-600 bg-rose-50',
    amber: 'text-amber-600 bg-amber-50',
  } as const;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className={`text-xs px-2 py-1 rounded ${map[trendColor]}`}>
          {delta >= 0 ? '+' : ''}{delta}%
        </span>
      </div>
      <div className="mt-4"><MiniTrend /></div>
    </div>
  );
};

const DashboardHome: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 rounded-2xl p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-semibold">¡Bienvenido a DashKPIs!</h2>
            <p className="text-white/80 mt-1">Has mejorado 72% tu rendimiento esta semana. Revisa tus insignias.</p>
            <button className="mt-3 sm:mt-4 bg-white text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50">
              Ver insignias
            </button>
          </div>
          <div className="hidden md:block">
            <img src="https://illustrations.popsy.co/blue/online-reporting.svg" alt="" className="h-24 opacity-95" />
          </div>
        </div>
      </div>

      {/* Cards superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Órdenes" value="276k" delta={12.4} trendColor="green" />
        <StatCard title="Ventas" value="$4,679" delta={28.42} trendColor="green" />
        <StatCard title="Pagos" value="$2,456" delta={-14.82} trendColor="rose" />
        <StatCard title="Ingresos" value="425k" delta={6.5} trendColor="amber" />
      </div>

      {/* Grillas inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Ingresos Totales</h3>
            <select className="text-sm border-gray-200 rounded-md">
              <option>2024</option>
              <option>2023</option>
            </select>
          </div>
          <div className="h-48 sm:h-64 bg-gradient-to-b from-gray-50 to-white border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
            Gráfico próximamente
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Reporte de Perfil</h3>
            <MiniTrend />
            <div className="mt-4 text-xl sm:text-2xl font-bold text-gray-900">$84,686</div>
            <p className="text-sm text-green-600">+68.2% este mes</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Transacciones</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-gray-700">Paypal</span>
                <span className="text-gray-900 font-medium">+82.6 USD</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-gray-700">Stripe</span>
                <span className="text-gray-900 font-medium">+56.1 USD</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-gray-700">Transfer</span>
                <span className="text-gray-900 font-medium">-12.0 USD</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;