import React, { useState, useEffect } from 'react';
import { QrCode, User, CheckCircle, ArrowRight, ArrowLeft, Plus, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { parseQRData } from '../utils/qr';
import { Trip, Passenger, Conductor } from '../types';
import QRScanner from '../components/QRScanner/QRScanner';
import { applySEO } from '../utils/seo';
import { useNavigate } from 'react-router-dom';

type Step = 'profile' | 'identify' | 'confirm' | 'trip' | 'finalize';
interface TripEntry { passenger: Passenger; addedAt: Date; }

const ConductorFlow: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Flow state
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [manualCedula, setManualCedula] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [tripPassengers, setTripPassengers] = useState<TripEntry[]>([]);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [shift, setShift] = useState<'am' | 'pm'>('am');
  
  // Data
  const [conductors, setConductors] = useState<Conductor[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);

  useEffect(() => {
    applySEO({
      title: 'Flujo Conductor | Sistema de Reportes JF',
      description: 'Gestión de viajes para conductores con proceso paso a paso.',
      keywords: 'conductor, viajes, pasajeros, transporte',
      canonicalPath: '/conductor-flow',
    });
    loadData();
  }, [user]); // Recargar si el usuario cambia

  const loadData = async () => {
    const allConductors = await storage.getConductors();
    setConductors(allConductors);
    try {
      const passengerData = await storage.getPassengers();
      setPassengers(passengerData);

      // Si el usuario es conductor, fijar su propio perfil y saltar selección
      if (user?.role === 'conductor') {
        const own = allConductors.find(c => c.id === user.id || c.cedula === user.cedula) || null;
        setSelectedConductor(own);
        setCurrentStep('identify');
      }
    } catch (error) {
      console.error("Error loading passengers in conductor flow:", error);
    }
  };

  const handleConductorSelect = (conductor: Conductor) => {
    setSelectedConductor(conductor);
    setCurrentStep('identify');
  };

  const handleQRScan = (qrData: string) => {
    try {
      const parsedData = parseQRData(qrData);
      const passenger = passengers.find(p => String(p.cedula) === String(parsedData.cedula));
      
      if (!passenger) {
        alert(`Pasajero con cédula ${parsedData.cedula} no encontrado en el sistema`);
        setShowScanner(false);
        return;
      }

      setSelectedPassenger(passenger);
      setCurrentStep('confirm');
      setShowScanner(false);
    } catch (error) {
      console.error('Error procesando QR:', error);
      alert('Código QR inválido o no reconocido');
      setShowScanner(false);
    }
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualCedula.trim()) {
      alert('Por favor ingrese una cédula válida');
      return;
    }

    const passenger = passengers.find(p => String(p.cedula) === manualCedula.trim());
    
    if (!passenger) {
      alert(`Pasajero con cédula ${manualCedula.trim()} no encontrado en el sistema`);
      setShowManualEntry(false);
      setManualCedula('');
      return;
    }

    setSelectedPassenger(passenger);
    setCurrentStep('confirm');
    setShowManualEntry(false);
    setManualCedula('');
  };

  const handleStartTrip = () => {
    if (!selectedPassenger || !selectedConductor) return;

    // Capacidad 18 asientos
    if (tripPassengers.length >= 18) {
      alert('Capacidad máxima alcanzada (18 pasajeros).');
      return;
    }

    const now = new Date();

    // Si el viaje no comenzó, inicializar y agregar primer pasajero
    if (!tripStartTime) {
      setTripStartTime(now);
      setTripPassengers([{ passenger: selectedPassenger, addedAt: now }]);
      setCurrentStep('trip');
      return;
    }

    // Si ya está en curso, agregar pasajero y volver a la lista
    setTripPassengers(prev => [...prev, { passenger: selectedPassenger, addedAt: now }]);
    setCurrentStep('trip');
  };

  const handleAddMorePassengers = () => {
    setSelectedPassenger(null);
    setCurrentStep('identify');
  };

  const handleFinalizeTrip = async () => {
    if (window.confirm('¿Estás seguro que quieres finalizar tu viaje?')) {
      // Create trips for all passengers
      const groupIdSeed = `trip-${Date.now()}`;
      const trips: Trip[] = tripPassengers.map((entry, index) => ({
        id: `${groupIdSeed}-${index}`,
        groupId: groupIdSeed,
        shift: shift === 'am' ? 'mañana' : 'noche',
        passengerId: entry.passenger.id,
        passengerName: entry.passenger.name,
        passengerCedula: entry.passenger.cedula,
        conductorId: selectedConductor!.id,
        conductorName: selectedConductor!.name,
        ruta: selectedConductor!.ruta || 'Ruta no especificada',
        startTime: entry.addedAt.toISOString(),
        endTime: new Date().toISOString(),
        status: 'finalizado',
        createdAt: new Date().toISOString()
      }));

      // Save trips
      const existingTrips = await storage.getTrips();
      storage.saveTrips([...existingTrips, ...trips]);

      // Navigate to reports with groupId
      const groupId = trips[0].groupId;
      navigate(`/reports?groupId=${groupId}`);
    }
  };

  const renderProfileStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Seleccionar Perfil de Conductor
        </h2>
        
        <div className="space-y-4">
          {(user?.role === 'conductor'
            ? conductors.filter(c => c.id === user.id || c.cedula === user.cedula)
            : conductors
          ).map((conductor) => (
            <button
              key={conductor.id}
              onClick={() => handleConductorSelect(conductor)}
              className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{conductor.name}</h3>
                  <p className="text-sm text-gray-600">Cédula: {conductor.cedula}</p>
                  <p className="text-sm text-gray-600">Placa: {conductor.placa}</p>
                  <p className="text-sm text-gray-600">Ruta: {conductor.ruta || 'No especificada'}</p>
                  <p className="text-sm text-gray-600">Área: {conductor.area || 'No especificada'}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderIdentifyStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentStep('profile')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Paso 1: Identificar Pasajero</h2>
        </div>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-6">Seleccione una opción para identificar al pasajero</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowScanner(true)}
              className="flex flex-col items-center p-6 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <QrCode className="h-12 w-12 text-blue-600 mb-3" />
              <span className="font-semibold text-blue-900">Escanear QR</span>
              <span className="text-sm text-blue-700">Usar cámara para escanear código QR</span>
            </button>
            
            <button
              onClick={() => setShowManualEntry(true)}
              className="flex flex-col items-center p-6 border-2 border-green-300 rounded-lg hover:bg-green-50 transition-colors"
            >
              <User className="h-12 w-12 text-green-600 mb-3" />
              <span className="font-semibold text-green-900">Ingresar Cédula</span>
              <span className="text-sm text-green-700">Escribir cédula manualmente</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentStep('identify')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Paso 2: Confirmar Datos</h2>
        </div>
        
        {selectedPassenger && selectedConductor && (
          <div className="space-y-6">
            {/* Passenger Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Pasajero</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <p className="text-lg text-gray-900">{selectedPassenger.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cédula</label>
                  <p className="text-lg text-gray-900">{selectedPassenger.cedula}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Gerencia</label>
                  <p className="text-lg text-gray-900">{selectedPassenger.gerencia}</p>
                </div>
              </div>
            </div>

            {/* Trip Info */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Viaje</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Conductor</label>
                  <p className="text-lg text-gray-900">{selectedConductor.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unidad</label>
                  <p className="text-lg text-gray-900">{selectedConductor.placa}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ruta</label>
                  <p className="text-lg text-gray-900">{selectedConductor.ruta || 'No especificada'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Área</label>
                  <p className="text-lg text-gray-900">{selectedConductor.area || 'No especificada'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hora Salida</label>
                  <p className="text-lg text-gray-900">{new Date().toLocaleTimeString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Período</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as 'am' | 'pm')}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="am">AM</option>
                    <option value="pm">PM</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Fecha</label>
                  <p className="text-lg text-gray-900">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartTrip}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
            >
              Iniciar Viaje
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderTripStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Viaje en Curso</h2>
        
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Hora de inicio: {tripStartTime?.toLocaleTimeString()}</p>
              <p className="text-sm text-green-700">Pasajeros registrados: {tripPassengers.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-800">Conductor: {selectedConductor?.name}</p>
              <p className="text-sm text-green-700">Unidad: {selectedConductor?.placa}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pasajeros Registrados ({tripPassengers.length}/18)</h3>
          <div className="space-y-2">
            {tripPassengers.map((entry, index) => (
              <div key={entry.passenger.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{entry.passenger.name}</p>
                    <p className="text-sm text-gray-600">Cédula: {entry.passenger.cedula} | Gerencia: {entry.passenger.gerencia}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">{entry.addedAt.toLocaleTimeString()}</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleAddMorePassengers}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Añadir Más Pasajeros</span>
          </button>
          
          <button
            onClick={handleFinalizeTrip}
            className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FileText className="h-5 w-5" />
            <span>Finalizar y Enviar Reporte</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Perfil</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'identify' || currentStep === 'confirm' || currentStep === 'trip' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'identify' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'identify' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Identificar</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'confirm' || currentStep === 'trip' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Confirmar</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'trip' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'trip' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'trip' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                4
              </div>
              <span className="ml-2 text-sm font-medium">Viaje</span>
            </div>
          </div>
          <div className="mt-4 flex justify-center space-x-3">
            <button
              onClick={() => navigate('/conductor-profile')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Ver mi Perfil</span>
            </button>
            <button
              onClick={() => navigate('/my-trips')}
              className="flex items-center space-x-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span>Mis Viajes</span>
            </button>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'profile' && renderProfileStep()}
        {currentStep === 'identify' && renderIdentifyStep()}
        {currentStep === 'confirm' && renderConfirmStep()}
        {currentStep === 'trip' && renderTripStep()}

        {/* Modals */}
        {showScanner && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setShowScanner(false)}
          />
        )}

        {showManualEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Ingresar Cédula del Pasajero
              </h2>
              
              <form onSubmit={handleManualEntry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cédula del Pasajero
                  </label>
                  <input
                    type="text"
                    value={manualCedula}
                    onChange={(e) => setManualCedula(e.target.value)}
                    placeholder="Ingrese la cédula del pasajero"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    autoFocus
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualEntry(false);
                      setManualCedula('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Buscar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConductorFlow;
