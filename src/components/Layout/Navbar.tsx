import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg border-b border-primary-200 sticky top-0 z-40">
      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img 
                src="https://www.webcincodev.com/blog/wp-content/uploads/2025/08/Diseno-sin-titulo-27.png" 
                alt="Logo Sistema de Reportes JF"
                className="h-10 w-auto"
              />
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
                <span className="text-primary-500">Sistema de Reportes</span> <span className="text-secondary-500">JF</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="hidden xs:flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {user?.name}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                user?.role === 'root' 
                  ? 'bg-secondary-100 text-secondary-800'
                  : user?.role === 'admin'
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {user?.role === 'root' ? 'Super Admin' : 
                 user?.role === 'admin' ? 'Administrador' : 'Conductor'}
              </span>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;