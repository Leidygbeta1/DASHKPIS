import React from 'react';

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: string;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon, color }) => {
  const isPositive = change > 0;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white text-xl`}>
          {icon}
        </div>
        <div className={`flex items-center text-sm font-medium ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          <span className="mr-1">
            {isPositive ? '↗' : '↘'}
          </span>
          {Math.abs(change)}%
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-gray-600 text-sm">{title}</p>
      </div>
    </div>
  );
};

export default KPICard;