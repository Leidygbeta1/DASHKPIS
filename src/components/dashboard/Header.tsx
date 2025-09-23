import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">DASHKPIS</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 17h5l-5 5-5-5h5v-12h0z" />
              </svg>
            </button>
          </div>
          
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 17h5l-5 5-5-5h5v-12h0z" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center">
            <img 
              className="w-8 h-8 rounded-full" 
              src="https://via.placeholder.com/32" 
              alt="Avatar" 
            />
            <span className="ml-2 text-sm font-medium text-gray-700">Usuario</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;