import React, { useState } from 'react';
import { Info, Shield, FileText, X } from 'lucide-react';

const Footer: React.FC = () => {
  const [showInfo, setShowInfo] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const InfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-600">Información de la Aplicación</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Sistema de Reportes JF</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Versión:</strong> 1.0.0</p>
                <p><strong>Fecha de lanzamiento:</strong> Enero 2025</p>
                <p><strong>Desarrollado por:</strong> Corporación JF C.A</p>
              </div>
              <div>
                <p><strong>Tipo:</strong> Sistema Web Interno</p>
                <p><strong>Plataforma:</strong> React + TypeScript</p>
                <p><strong>Estado:</strong> Producción</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Funcionalidades Principales</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Gestión integral de pasajeros con códigos QR únicos</li>
              <li>Administración completa de conductores y vehículos</li>
              <li>Control de viajes en tiempo real</li>
              <li>Generación de reportes detallados en PDF y Excel</li>
              <li>Sistema de autenticación por roles (Administrador/Conductor)</li>
              <li>Interfaz responsive para dispositivos móviles y desktop</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Soporte Técnico</h3>
            <div className="bg-primary-50 p-4 rounded-lg">
              <p className="text-sm text-primary-800">
                Para soporte técnico o reportar problemas, contacte al departamento de IT de Corporación JF C.A
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 text-center">
              © 2025 Corporación JF C.A. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const PolicyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-secondary-600">Política de Uso del Sistema</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-6 text-sm">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <h3 className="font-bold text-red-800 mb-2">⚠️ INFORMACIÓN CONFIDENCIAL - USO INTERNO ÚNICAMENTE</h3>
            <p className="text-red-700">
              Este sistema contiene información confidencial de Corporación JF C.A y está destinado exclusivamente 
              para uso interno por personal autorizado (Administradores y Conductores).
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Alcance y Propósito</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>Sistema diseñado para la gestión interna de transporte de personal</li>
              <li>Uso exclusivo por empleados autorizados de Corporación JF C.A</li>
              <li>Información clasificada como confidencial y de uso interno</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Usuarios Autorizados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <h4 className="font-semibold text-primary-800 mb-2">👨‍💼 Administradores</h4>
                <ul className="text-xs text-primary-700 space-y-1">
                  <li>• Acceso completo al sistema</li>
                  <li>• Gestión de pasajeros y conductores</li>
                  <li>• Generación de reportes</li>
                  <li>• Configuración del sistema</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">🚗 Conductores</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Escaneo de códigos QR</li>
                  <li>• Registro de viajes</li>
                  <li>• Consulta de historial personal</li>
                  <li>• Acceso limitado y controlado</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Responsabilidades del Usuario</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li><strong>Confidencialidad:</strong> Mantener la confidencialidad de toda la información accedida</li>
              <li><strong>Credenciales:</strong> Proteger las credenciales de acceso y no compartirlas</li>
              <li><strong>Uso Apropiado:</strong> Utilizar el sistema únicamente para fines laborales autorizados</li>
              <li><strong>Reporte de Incidentes:</strong> Informar inmediatamente cualquier problema de seguridad</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Restricciones de Uso</h3>
            <div className="bg-red-50 p-4 rounded-lg">
              <ul className="list-disc list-inside space-y-1 text-red-700 ml-4">
                <li>Prohibido compartir información del sistema con terceros no autorizados</li>
                <li>No se permite el acceso desde dispositivos no corporativos sin autorización</li>
                <li>Prohibida la descarga o exportación no autorizada de datos</li>
                <li>No se permite el uso del sistema para fines personales</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Monitoreo y Auditoría</h3>
            <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg">
              <strong>Aviso:</strong> Todas las actividades en el sistema son monitoreadas y registradas 
              para fines de seguridad y auditoría. El uso del sistema implica la aceptación de este monitoreo.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Consecuencias del Mal Uso</h3>
            <p className="text-gray-700">
              El uso indebido del sistema puede resultar en medidas disciplinarias, incluyendo pero no limitado a:
              suspensión del acceso, medidas disciplinarias internas, y acciones legales según corresponda.
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 text-center">
              Al utilizar este sistema, usted acepta cumplir con todas las políticas y procedimientos establecidos por Corporación JF C.A.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <footer className="bg-gradient-to-r from-primary-800 to-secondary-800 text-white py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Información de la empresa */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Corporación JF C.A</h3>
              <p className="text-sm text-primary-200 mb-2">
                Sistema de Reportes JF - Versión 1.0.0
              </p>
              <p className="text-xs text-primary-300">
                © 2025 Corporación JF C.A<br />
                Todos los derechos reservados
              </p>
            </div>

            {/* Enlaces rápidos */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Información</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowInfo(true)}
                  className="flex items-center space-x-2 text-sm text-primary-200 hover:text-white transition-colors"
                >
                  <Info className="h-4 w-4" />
                  <span>Acerca del Sistema</span>
                </button>
                <button
                  onClick={() => setShowPolicy(true)}
                  className="flex items-center space-x-2 text-sm text-primary-200 hover:text-white transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  <span>Política de Uso</span>
                </button>
              </div>
            </div>

            {/* Información técnica */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Soporte</h3>
              <div className="text-sm text-primary-200 space-y-1">
                <p>Sistema Web Interno</p>
                <p>Uso exclusivo autorizado</p>
                <p className="text-xs text-primary-300 mt-2">
                  Para soporte técnico contacte<br />
                  al departamento de IT
                </p>
                <p className="text-xs text-primary-300 mt-2">
                  Desarrollado por Webcincodev - Armando Ovalle
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-primary-700 mt-6 pt-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-xs text-primary-300">
                Sistema de uso interno - Información confidencial
              </p>
              <p className="text-xs text-primary-300 mt-2 md:mt-0" />
            </div>
          </div>
        </div>
      </footer>

      {/* Modales */}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      {showPolicy && <PolicyModal onClose={() => setShowPolicy(false)} />}
    </>
  );
};

export default Footer;