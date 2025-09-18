import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Users, Car, FileText, QrCode, User as UserIcon, FileSignature } from 'lucide-react';

const MobileNav: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isConductor = user?.role === 'conductor';
  const isAdmin = user?.role === 'admin';
  const isRoot = user?.role === 'root';

  const handleFab = () => {
    if (isConductor) {
      navigate('/scan-qr');
      return;
    }
    navigate('/reports');
  };

  return (
    <div className="md:hidden">
      {/* Bottom bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200">
        <div className="px-3 py-2 grid grid-cols-5 text-xs">
          {/* Left slots depend on role */}
          {isConductor ? (
            <>
              <NavLink to="/scan-qr" className={({ isActive }) => `flex flex-col items-center justify-center py-2 ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                <QrCode className="h-5 w-5" />
                <span>Scan</span>
              </NavLink>
              <NavLink to="/my-trips" className={({ isActive }) => `flex flex-col items-center justify-center py-2 ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                <FileText className="h-5 w-5" />
                <span>Viajes</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center py-2 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                <Home className="h-5 w-5" />
                <span>Inicio</span>
              </NavLink>
              <NavLink to="/passengers" className={({ isActive }) => `flex flex-col items-center justify-center py-2 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                <Users className="h-5 w-5" />
                <span>Pasaj.</span>
              </NavLink>
            </>
          )}

          {/* Spacer for FAB */}
          <div className="relative" />

          {/* Right slots depend on role */}
          {isConductor ? (
            <>
              <NavLink to="/reports" className={({ isActive }) => `flex flex-col items-center justify-center py-2 ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                <FileText className="h-5 w-5" />
                <span>Reportes</span>
              </NavLink>
              <NavLink to="/scan-qr" className={({ isActive }) => `flex flex-col items-center justify-center py-2 ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                <QrCode className="h-5 w-5" />
                <span>QR</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/conductors" className={({ isActive }) => `flex flex-col items-center justify-center py-2 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                <Car className="h-5 w-5" />
                <span>Cond.</span>
              </NavLink>
              {(isAdmin || isRoot) ? (
                <NavLink to="/users" className={({ isActive }) => `flex flex-col items-center justify-center py-2 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                  <UserIcon className="h-5 w-5" />
                  <span>Usuarios</span>
                </NavLink>
              ) : (
                <NavLink to="/reports" className={({ isActive }) => `flex flex-col items-center justify-center py-2 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                  <FileText className="h-5 w-5" />
                  <span>Reportes</span>
                </NavLink>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Center Floating Action Button */}
      <button
        onClick={handleFab}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-full shadow-xl text-white ${isConductor ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-600 hover:bg-primary-700'} w-14 h-14 flex items-center justify-center border-4 border-white`}
        aria-label="Acción principal"
      >
        {isConductor ? <QrCode className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default MobileNav;





