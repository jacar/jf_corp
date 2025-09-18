import React, { useState, useEffect } from 'react';
import { applySEO } from '../utils/seo';
import { Plus, Search, QrCode, Download, Edit, Trash2, Upload, RefreshCw } from 'lucide-react';
import { Passenger } from '../types';
import { storage } from '../utils/storage';
import { generateQRCode, QRData } from '../utils/qr';
import QRViewer from '../components/QRViewer/QRViewer';
import { importPassengersFromGoogleSheet } from '../utils/passengerImport';
import PassengerCSVImport from '../components/ExcelImport/PassengerCSVImport';

const Passengers: React.FC = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [filteredPassengers, setFilteredPassengers] = useState<Passenger[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showQRViewer, setShowQRViewer] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGoogleSheetImport, setShowGoogleSheetImport] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cedula: '',
    gerencia: ''
  });

  useEffect(() => {
    applySEO({
      title: 'Pasajeros | Sistema de Reportes JF',
      description: 'Gestione y busque pasajeros con cédula y genere códigos QR en el Sistema de Reportes JF.',
      keywords: 'pasajeros, cédula, QR, transporte, gestión de pasajeros',
      canonicalPath: '/passengers',
    });
    loadPassengers();
  }, []);

  useEffect(() => {
    filterPassengers();
  }, [passengers, searchTerm]);

  const loadPassengers = async () => {
    try {
      const data = await storage.getPassengers();
      setPassengers(data);
    } catch (error) {
      console.error('Error al cargar pasajeros:', error);
      // Opcional: mostrar un mensaje de error al usuario
    }
  };

  const filterPassengers = () => {
    if (!searchTerm) {
      setFilteredPassengers(passengers);
    } else {
      const filtered = passengers.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.cedula).includes(searchTerm) ||
        p.gerencia.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPassengers(filtered);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar si ya existe un pasajero con la misma cédula
    const existingPassenger = passengers.find(p => p.cedula === formData.cedula && (!editingPassenger || p.id !== editingPassenger.id));
    if (existingPassenger) {
      alert('Ya existe un pasajero con esta cédula');
      return;
    }
    
    if (editingPassenger) {
      // Update existing passenger
      const updatedPassengers = passengers.map(p => 
        p.id === editingPassenger.id 
          ? { ...p, ...formData }
          : p
      );
      storage.savePassengers(updatedPassengers);
      setPassengers(updatedPassengers);
    } else {
      // Create new passenger
      const qrData: QRData = {
        cedula: formData.cedula,
        name: formData.name,
        gerencia: formData.gerencia,
        timestamp: new Date().toISOString()
      };
      
      const qrCode = await generateQRCode(qrData);
      
      const newPassenger: Passenger = {
        id: Date.now().toString(),
        ...formData,
        qrCode,
        createdAt: new Date().toISOString()
      };
      
      const updatedPassengers = [...passengers, newPassenger];
      storage.savePassengers(updatedPassengers);
      setPassengers(updatedPassengers);
    }
    
    resetForm();
  };

  const regenerateQR = async (passenger: Passenger) => {
    try {
      const qrData: QRData = {
        cedula: passenger.cedula,
        name: passenger.name,
        gerencia: passenger.gerencia,
        timestamp: new Date().toISOString()
      };
      
      const newQrCode = await generateQRCode(qrData);
      
      const updatedPassengers = passengers.map(p => 
        p.id === passenger.id 
          ? { ...p, qrCode: newQrCode }
          : p
      );
      
      storage.savePassengers(updatedPassengers);
      setPassengers(updatedPassengers);
    } catch (error) {
      alert('Error regenerando código QR');
    }
  };

  const handleEdit = (passenger: Passenger) => {
    setEditingPassenger(passenger);
    setFormData({
      name: passenger.name,
      cedula: passenger.cedula,
      gerencia: passenger.gerencia
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este pasajero?')) {
      const updatedPassengers = passengers.filter(p => p.id !== id);
      storage.savePassengers(updatedPassengers);
      setPassengers(updatedPassengers);
    }
  };

  const downloadQR = (passenger: Passenger) => {
    const link = document.createElement('a');
    link.download = `QR_${passenger.name}_${passenger.cedula}.png`;
    link.href = passenger.qrCode;
    link.click();
  };
  
  const viewQR = (passenger: Passenger) => {
    setSelectedPassenger(passenger);
    setShowQRViewer(true);
  };

  const resetForm = () => {
    setFormData({ name: '', cedula: '', gerencia: '' });
    setEditingPassenger(null);
    setShowModal(false);
  };
  
  const handleImportSuccess = (count: number) => {
    // Recargar los datos después de una importación exitosa
    loadPassengers();
    // Mostrar mensaje de éxito si es necesario
    alert(`Se importaron ${count} pasajeros correctamente.`);
  };
  
  const handleImportError = (error: string) => {
    // Mostrar mensaje de error si es necesario
    console.error('Error al importar:', error);
  };

  const handleClearPassengers = async () => {
    if (window.confirm('¿Está seguro de que desea eliminar TODOS los pasajeros? Esta acción no se puede deshacer.')) {
        try {
            await storage.savePassengers([]); // Save an empty array
            await loadPassengers(); // Reload the now-empty list
            alert('Todos los pasajeros han sido eliminados.');
        } catch (error) {
            alert('Hubo un error al eliminar los pasajeros.');
            console.error(error);
        }
    }
  };

  const handleGoogleSheetImport = async () => {
    if (!googleSheetUrl) {
      alert('Por favor, ingrese la URL de la hoja de cálculo');
      return;
    }
    setIsImporting(true);
    try {
      const count = await importPassengersFromGoogleSheet(googleSheetUrl);
      handleImportSuccess(count);
      setShowGoogleSheetImport(false);
      setGoogleSheetUrl('');
    } catch (error) {
      if (error instanceof Error) {
          alert(`Error al importar: ${error.message}`);
      } else {
          alert('Ocurrió un error desconocido al importar.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Pasajeros</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full">
              {filteredPassengers.length} de {passengers.length} pasajeros
            </span>
            <p className="text-sm text-gray-600">Administre los pasajeros del sistema</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:space-x-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
            >
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => setShowGoogleSheetImport(true)}
              className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Google Sheet</span>
            </button>
            <button
              onClick={handleClearPassengers}
              className="flex items-center justify-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Limpiar</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="relative max-w-md mb-6">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o gerencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="overflow-x-auto">
            <div className="grid gap-4 sm:grid-cols-1">
              {filteredPassengers.map((passenger) => (
                <div key={passenger.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{passenger.name}</h3>
                        <p className="text-sm text-gray-600">Cédula: {passenger.cedula}</p>
                        <p className="text-sm text-gray-600">Gerencia: {passenger.gerencia}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Registrado el {new Date(passenger.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => viewQR(passenger)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                          title="Ver QR"
                        >
                          <QrCode className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => downloadQR(passenger)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                          title="Descargar QR"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                      <button
                        onClick={() => regenerateQR(passenger)}
                        className="flex items-center text-sm text-teal-600 hover:text-teal-800 px-2 py-1 rounded hover:bg-gray-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        <span>Regenerar QR</span>
                      </button>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(passenger)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(passenger.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPassenger ? 'Editar Pasajero' : 'Nuevo Pasajero'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cédula *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  className="w-full md:max-w-xs md:mx-auto border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gerencia *
                </label>
                <input
                  type="text"
                  required
                  value={formData.gerencia}
                  onChange={(e) => setFormData({ ...formData, gerencia: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPassenger ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* QR Viewer */}
      {showQRViewer && selectedPassenger && (
        <QRViewer
          passenger={selectedPassenger}
          onClose={() => {
            setShowQRViewer(false);
            setSelectedPassenger(null);
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Importar Pasajeros desde CSV/Excel</h2>
            <PassengerCSVImport
              onImportSuccess={handleImportSuccess}
              onImportError={handleImportError}
              onComplete={() => setShowImportModal(false)}
            />
          </div>
        </div>
      )}

      {/* Google Sheet Import Modal */}
      {showGoogleSheetImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Importar desde Google Sheet</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Pegue la URL de la hoja de cálculo de Google"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowGoogleSheetImport(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isImporting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGoogleSheetImport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  disabled={isImporting}
                >
                  {isImporting ? 'Importando...' : 'Importar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Passengers;