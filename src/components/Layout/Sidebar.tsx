import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Route, 
  FileText,
  QrCode,
  Car,
  Users as UsersIcon,
  FileSignature
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  // Rutas para administradores (admin y root)
  const getAdminRoutes = () => {
    const baseRoutes = [
      { path: '/dashboard', name: 'Dashboard', icon: FileText },
      { path: '/passengers', name: 'Pasajeros', icon: Users },
      { path: '/conductors', name: 'Conductores', icon: Car },
      { path: '/reports', name: 'Reportes', icon: FileText },
    ];

    // Agregar rutas específicas para root
    if (user?.role === 'root') {
      baseRoutes.push(
        { path: '/users', name: 'Usuarios', icon: UsersIcon },
        { path: '/signatures', name: 'Firmas', icon: FileSignature }
      );
    }

    // Agregar firmas para admin también
    if (user?.role === 'admin') {
      baseRoutes.push({ path: '/signatures', name: 'Firmas', icon: FileSignature });
    }

    return baseRoutes;
  };

  // Rutas para conductores
  const conductorRoutes = [
    { path: '/scan-qr', name: 'Escanear QR', icon: QrCode },
    { path: '/my-trips', name: 'Mis Viajes', icon: Route },
  ];

  // Determinar qué rutas mostrar según el rol
  const getRoutes = () => {
    if (user?.role === 'conductor') {
      return conductorRoutes;
    } else if (user?.role === 'admin' || user?.role === 'root') {
      return getAdminRoutes();
    }
    return [];
  };

  const routes = getRoutes();

  return (
    <div className="w-64 bg-gradient-to-b from-primary-800 to-primary-900 min-h-screen sidebar-mobile">
      <div className="p-2 sm:p-4">
        {/* Mostrar información del usuario */}
        <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-primary-700/50 rounded-lg border border-primary-600/30">
          <p className="text-white text-xs sm:text-sm font-medium">{user?.name}</p>
          <p className="text-primary-200 text-xs">
            {user?.role === 'root' ? 'Super Administrador' : 
             user?.role === 'admin' ? 'Administrador' : 'Conductor'}
          </p>
        </div>
        
        <nav className="space-y-2">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? (user?.role === 'conductor' ? 'bg-green-600 text-white shadow-lg' : 'bg-secondary-600 text-white shadow-lg')
                      : 'text-primary-200 hover:text-white hover:bg-primary-700/50'
                  }`
                }
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{route.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;