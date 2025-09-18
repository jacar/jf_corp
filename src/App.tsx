import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import MobileNav from './components/Layout/MobileNav';

// Pages
import Dashboard from './pages/Dashboard';
import Passengers from './pages/Passengers';
import Conductors from './pages/Conductors';
import Reports from './pages/Reports';
import ScanQR from './pages/ScanQR';
import ConductorFlow from './pages/ConductorFlow';
import ConductorProfile from './pages/ConductorProfile';
import Users from './pages/Users';
import Signatures from './pages/Signatures';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallMessage, setShowInstallMessage] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallMessage(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setDeferredPrompt(null);
        setShowInstallMessage(false);
      });
    }
  };

  const handleDismissClick = () => {
    setShowInstallMessage(false);
  };
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="w-full">
              {children}
            </div>
          </main>
          {showInstallMessage && (
            <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg flex items-center space-x-3 z-50">
              <span>¿Deseas instalar esta aplicación en tu escritorio?</span>
              <button
                onClick={handleInstallClick}
                className="bg-white text-blue-600 px-3 py-1 rounded-md font-semibold hover:bg-gray-100 transition-colors"
              >
                Instalar
              </button>
              <button
                onClick={handleDismissClick}
                className="text-white hover:text-gray-200 transition-colors"
              >
                &times;
              </button>
            </div>
          )}
          <Footer />
          <MobileNav />
        </div>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to={user?.role === 'conductor' ? '/scan-qr' : '/dashboard'} replace /> : <LoginForm />} 
      />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to={user?.role === 'conductor' ? '/scan-qr' : '/dashboard'} replace />
          </ProtectedRoute>
        }
      />
      
      {/* Admin/Root Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              {user?.role !== 'conductor' ? <Dashboard /> : <Navigate to="/scan-qr" replace />}
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/passengers"
        element={
          <ProtectedRoute>
            <AppLayout>
              {user?.role !== 'conductor' ? <Passengers /> : <Navigate to="/scan-qr" replace />}
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/conductors"
        element={
          <ProtectedRoute>
            <AppLayout>
              {user?.role !== 'conductor' ? <Conductors /> : <Navigate to="/scan-qr" replace />}
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Reports />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AppLayout>
              {user?.role === 'root' ? <Users /> : <Navigate to="/dashboard" replace />}
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/signatures"
        element={
          <ProtectedRoute>
            <AppLayout>
              {user?.role !== 'conductor' ? <Signatures /> : <Navigate to="/scan-qr" replace />}
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/scan-qr"
        element={
          <ProtectedRoute>
            <AppLayout>
              {user?.role === 'conductor' ? <ConductorFlow /> : <ScanQR />}
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/conductor-flow"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ConductorFlow />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/conductor-profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ConductorProfile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/my-trips"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Reports />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;