import React, { useState } from 'react';
import { Truck, LogIn, User, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [loginType, setLoginType] = useState<'admin' | 'conductor'>('conductor');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando proceso de login...');
    
    setLoading(true);
    setError('');
    
    let success = false;
    
    if (loginType === 'admin') {
      if (!username.trim() || !password.trim()) {
        setError('Usuario y contraseña son requeridos');
        setLoading(false);
        return;
      }
      
      console.log('Login de administrador con:', username.trim(), password.trim());
      success = await login(username.trim(), password.trim(), 'admin');
      
      if (!success) {
        setError('Usuario o contraseña incorrectos');
      }
    } else {
      if (!username.trim() || !password.trim()) {
        setError('Usuario y contraseña son requeridos');
        setLoading(false);
        return;
      }
      
      console.log('Intentando login de conductor con:', username.trim());
      success = await login(username.trim(), password.trim(), 'conductor');
      
      if (!success) {
        setError('Usuario o contraseña incorrectos');
      }
    }
    
    console.log('Resultado del login:', success);
    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: 'url(https://www.webcincodev.com/blog/wp-content/uploads/2025/09/Diseno-sin-titulo-30.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay oscuro para mejorar legibilidad */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg space-y-8 relative z-10 mx-auto">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="https://www.webcincodev.com/blog/wp-content/uploads/2025/09/Diseno-sin-titulo-25e.png" 
              alt="Logo Sistema de Reportes JF"
              className="h-20 w-auto"
            />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Sistema de Reportes JF
          </h2>
          <p className="mt-2 text-sm text-gray-200">
            Bienvenido al portal. Seleccione su tipo de acceso para continuar y gestionar los reportes de viajes diarios de manera eficiente.
          </p>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm py-8 px-6 shadow-2xl rounded-xl border border-white/20">
          {/* Selector de tipo de login */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row rounded-lg bg-gray-100 p-1 space-y-1 sm:space-y-0 sm:space-x-1">
              <button
                type="button"
                onClick={() => {
                  setLoginType('admin');
                  setError('');
                  setUsername('');
                  setPassword('');
                }}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-2 sm:px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  loginType === 'admin'
                    ? 'bg-primary text-white shadow-lg transform scale-[1.02]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Administrador</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType('conductor');
                  setError('');
                  setUsername('');
                  setPassword('');
                }}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-2 sm:px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  loginType === 'conductor'
                    ? 'bg-secondary text-white shadow-lg transform scale-[1.02]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Conductor</span>
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`mt-2 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-all duration-200 ${
                  loginType === 'admin' 
                    ? 'focus:ring-primary focus:border-primary' 
                    : 'focus:ring-secondary focus:border-secondary'
                }`}
                placeholder="Ingrese su usuario"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-2 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-all duration-200 ${
                  loginType === 'admin' 
                    ? 'focus:ring-primary focus:border-primary' 
                    : 'focus:ring-secondary focus:border-secondary'
                }`}
                placeholder="Ingrese su contraseña"
              />
            </div>

            {loginType === 'conductor' && (
              <div>
                <div className="text-xs text-gray-500 bg-secondary/10 p-3 rounded-md border border-secondary/20">
                  <p>Solicite sus credenciales de acceso al administrador del sistema</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                  loginType === 'admin'
                    ? 'bg-primary hover:bg-primary-hover focus:ring-primary shadow-lg'
                    : 'bg-secondary hover:bg-secondary-hover focus:ring-secondary shadow-lg'
                }`}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LogIn className={`h-6 w-6 ${
                    loginType === 'admin' ? 'text-primary-300 group-hover:text-primary-200' : 'text-secondary-300 group-hover:text-secondary-200'
                  }`} />
                </span>
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              2025 Corporación JF C.A. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;