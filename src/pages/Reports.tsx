import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar, FileSignature, Eye } from 'lucide-react';
import { applySEO } from '../utils/seo';
import { format, startOfMonth, endOfMonth, startOfWeek, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { storage } from '../utils/storage';
import { generateCustomExcelReport } from '../utils/reports';
import { Trip, Passenger, Conductor } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ReportPreview from '../components/Reports/ReportPreview';
import { useLocation } from 'react-router-dom';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [conductors, setConductors] = useState<Conductor[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [dateRange, setDateRange] = useState('daily');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedConductor, setSelectedConductor] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [showSingleTripReportPreview, setShowSingleTripReportPreview] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showPreviewForPDF, setShowPreviewForPDF] = useState(false);

  useEffect(() => {
    applySEO({
      title: 'Reportes | Sistema de Reportes JF',
      description: 'Genere y visualice reportes detallados de viajes, pasajeros y conductores.',
      keywords: 'reportes, viajes, pasajeros, conductores, transporte, gestión',
      canonicalPath: '/reports',
    });
    if (user) {
      loadData();
    }
  }, [dateRange, customStartDate, customEndDate, user]);

  useEffect(() => {
    filterTrips();
  }, [trips, dateRange, customStartDate, customEndDate, selectedConductor]);

  const loadData = async () => {
    console.log('loadData called');
    const allTrips = await storage.getTrips();
    console.log('All trips from storage:', allTrips);

    // Si es conductor, solo mostrar sus propios viajes
    if (user?.role === 'conductor') {
      const conductorTrips = allTrips.filter(trip => trip.conductorId === user.id);
      console.log('Conductor trips:', conductorTrips);
      setTrips(conductorTrips);
    } else {
      // Admin y root ven todos los viajes
      setTrips(allTrips);
    }

    try {
      const passengerData = await storage.getPassengers();
      setPassengers(passengerData);
    } catch (error) {
      console.error("Error loading passengers for reports:", error);
      setPassengers([]); // En caso de error, establecer como un array vacío
    }
    
    try {
      const conductorData = await storage.getConductors();
      console.log('Conductor data from storage:', conductorData, 'Type:', typeof conductorData, 'Is Array:', Array.isArray(conductorData));
      setConductors(conductorData);
    } catch (error) {
      console.error("Error loading conductors for reports:", error);
      setConductors([]); // En caso de error, establecer como un array vacío
    }
  };

  const filterTrips = () => {
    console.log('filterTrips called');
    console.log('Current trips state:', trips);
    console.log('Current dateRange:', dateRange);
    console.log('Current customStartDate:', customStartDate);
    console.log('Current customEndDate:', customEndDate);
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (dateRange) {
      case 'daily':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'biweekly':
        // Últimas 2 semanas
        startDate = subDays(startOfWeek(now, { weekStartsOn: 1 }), 13); // Start of week 2 weeks ago
        endDate = endOfDay(now);
        break;
      case 'monthly':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) {
          console.log('Custom date range not set, returning.');
          return;
        }
        startDate = startOfDay(new Date(customStartDate));
        endDate = endOfDay(new Date(customEndDate));
        break;
      default:
        console.log('Unknown date range:', dateRange);
        return;
    }

    console.log('Calculated startDate:', startDate);
    console.log('Calculated endDate:', endDate);

    const params = new URLSearchParams(location.search);
    const groupId = params.get('groupId');

    const filtered = trips.filter(trip => {
      const tripDate = new Date(trip.startTime);
      const dateInRange = tripDate >= startDate && tripDate <= endDate;
      
      // Para conductores, solo sus viajes (ya filtrados en loadData)
      // Para admins, aplicar filtro de conductor si está seleccionado
      const conductorMatch = user?.role === 'conductor' || 
                           selectedConductor === 'all' || 
                           trip.conductorId === selectedConductor;
      const groupMatch = !groupId || trip.groupId === groupId;
      
      console.log(`Trip ${trip.id}: dateInRange=${dateInRange}, conductorMatch=${conductorMatch}, groupMatch=${groupMatch}`);
      return dateInRange && conductorMatch && groupMatch;
    });

    console.log('Filtered trips:', filtered);
    setFilteredTrips(filtered);
    if (groupId && filtered.length > 0) {
      setShowPreview(true);
    }
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'daily':
        return 'Diario (Hoy)';
      case 'biweekly':
        return 'Quincenal (Últimas 2 semanas)';
      case 'monthly':
        return 'Mensual (Este mes)';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${format(new Date(customStartDate), 'dd/MM/yyyy')} - ${format(new Date(customEndDate), 'dd/MM/yyyy')}`;
        }
        return 'Rango personalizado';
      default:
        return '';
    }
  };

  const downloadPDF = () => {
    // Mostrar la vista previa en modo PDF para que el usuario pueda descargar y luego compartir
    setShowPreviewForPDF(true);
  };

  const downloadExcel = () => {
    generateCustomExcelReport(filteredTrips, passengers, conductors, getDateRangeLabel());
  };

  const shareWhatsApp = () => {
    // Mostrar la vista previa en modo PDF para que el usuario pueda descargar y luego compartir
    setShowPreviewForPDF(true);
  };

  const shareSingleTripWhatsApp = (trip: Trip) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/reports`;
    const passenger = passengers.find(p => p.id === trip.passengerId);
    const conductor = conductors.find(c => c.id === trip.conductorId);
    const parts = [
      `Reporte de transporte JF`,
      `Fecha/Hora: ${format(new Date(trip.startTime), 'dd/MM/yyyy HH:mm', { locale: es })}`,
      `Conductor: ${conductor?.name || trip.conductorName}`,
      `Pasajero: ${passenger?.name || trip.passengerName} (${passenger?.cedula || trip.passengerCedula})`,
      `Ruta: ${trip.ruta}`,
      `Ver historial: ${link}`
    ];
    const text = encodeURIComponent(parts.join(' | '));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleViewTripReport = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowSingleTripReportPreview(true);
  };

  return (
    <div className="space-y-6">

      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'conductor' ? 'Mis Viajes' : 'Reportes de Viajes'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'conductor' 
              ? 'Consulte el historial de sus viajes realizados' 
              : 'Genere y descargue reportes detallados'}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-6 w-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        
        <div className={`grid grid-cols-1 ${user?.role === 'conductor' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Diario</option>
              <option value="biweekly">Quincenal</option>
              <option value="monthly">Mensual</option>
              <option value="custom">Rango personalizado</option>
            </select>
          </div>
          
          {/* Solo mostrar selector de conductor para admins */}
          {user?.role !== 'conductor' && conductors && conductors.length > 0 && (
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conductor
            </label>
            <select
              value={selectedConductor}
              onChange={(e) => setSelectedConductor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los conductores</option>
              {conductors.map((conductor) => (
                <option key={conductor.id} value={conductor.id}>
                  {conductor.name} - {conductor.placa}
                </option>
              ))}
            </select>
          </div>
          )}
          
          {dateRange === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha inicial
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
        
        {dateRange === 'custom' && (
          <div className={`grid grid-cols-1 ${user?.role === 'conductor' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4 mt-4`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha final
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Viajes Totales</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTrips.length}</p>
            </div>
            <Calendar className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Finalizados</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredTrips.filter(t => t.status === 'finalizado').length}
              </p>
            </div>
            <FileText className="h-10 w-10 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Curso</p>
              <p className="text-2xl font-bold text-orange-600">
                {filteredTrips.filter(t => t.status === 'en_curso').length}
              </p>
            </div>
            <FileText className="h-10 w-10 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Período</p>
              <p className="text-sm font-bold text-gray-900">{getDateRangeLabel()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones de descarga */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {user?.role === 'conductor' ? 'Acciones de Reporte (Mis Viajes)' : 'Descargar Reportes'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setShowPreview(true)}
            disabled={filteredTrips.length === 0}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 sm:px-4 py-3 rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Vista Previa</span>
          </button>
          <button
            onClick={downloadPDF}
            disabled={filteredTrips.length === 0}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-3 rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Descargar PDF</span>
          </button>
          <button
            onClick={downloadExcel}
            disabled={filteredTrips.length === 0}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Descargar Excel</span>
          </button>

          <button
            onClick={shareWhatsApp}
            disabled={filteredTrips.length === 0}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-3 sm:px-4 py-3 rounded-lg hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="text-sm sm:text-base">Compartir por WhatsApp</span>
          </button>
        </div>
        {user?.role !== 'conductor' && (
        <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200">
          <h3 className="text-sm font-semibold text-primary-900 mb-2 flex items-center">
            <FileSignature className="h-4 w-4 mr-2" />
            Información sobre Firmas Registradas
          </h3>
          <p className="text-xs text-primary-800">
            Los reportes incluirán automáticamente las firmas registradas en el sistema. 
            Si no hay firmas registradas, se mostrarán campos en blanco para completar manualmente.
          </p>
        </div>
        )}
      </div>
      

      {/* Tabla de viajes */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {user?.role === 'conductor' ? 'Mis Viajes' : 'Viajes del Período'} ({filteredTrips.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto table-responsive">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pasajero
                </th>
                {user?.role !== 'conductor' && (
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conductor
                </th>
                )}
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruta
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTrips.map((trip) => {
                const passenger = passengers.find(p => p.id === trip.passengerId);
                const conductor = conductors.find(c => c.id === trip.conductorId);
                
                return (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-6 py-4 text-sm text-gray-900">
                      <div className="break-words">
                        {format(new Date(trip.startTime), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 break-words">
                        {passenger?.name || trip.passengerName}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 break-words">
                        {passenger?.cedula || trip.passengerCedula}
                      </div>
                    </td>
                    {user?.role !== 'conductor' && (
                    <td className="px-2 sm:px-6 py-4 text-sm text-gray-900 break-words">
                      {conductor?.name || trip.conductorName}
                    </td>
                    )}
                    <td className="px-2 sm:px-6 py-4 text-sm text-gray-900 break-words">
                      {trip.ruta}
                    </td>
                    <td className="px-2 sm:px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        trip.status === 'finalizado' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {trip.status === 'finalizado' ? 'Finalizado' : 'En curso'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-6 py-4 text-sm text-gray-900 space-x-3">
                      <button
                        onClick={() => handleViewTripReport(trip)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Ver Reporte
                      </button>
                      <button
                        onClick={() => shareSingleTripWhatsApp(trip)}
                        className="text-emerald-600 hover:text-emerald-800 font-medium"
                      >
                        WhatsApp
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {filteredTrips.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'conductor' ? 4 : 5} className="px-2 sm:px-6 py-8 text-center text-gray-500">
                    <div className="text-sm sm:text-base">
                      {user?.role === 'conductor' 
                        ? 'No tiene viajes registrados para el período seleccionado'
                        : 'No hay viajes registrados para el período seleccionado'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Vista Previa */}
      {showPreview && (
        <ReportPreview
          trips={filteredTrips}
          passengers={passengers}
          conductors={conductors}
          dateRange={getDateRangeLabel()}
          onClose={() => setShowPreview(false)}
          mode="preview"
          defaultConductorId={selectedConductor !== 'all' ? selectedConductor : undefined}
          defaultDateISO={new Date().toISOString()}
        />
      )}

      {/* Modal de Vista Previa para PDF */}
      {showPreviewForPDF && (
        <ReportPreview
          trips={filteredTrips}
          passengers={passengers}
          conductors={conductors}
          dateRange={getDateRangeLabel()}
          onClose={() => setShowPreviewForPDF(false)}
          mode="pdf"
          defaultConductorId={selectedConductor !== 'all' ? selectedConductor : undefined}
          defaultDateISO={new Date().toISOString()}
        />
      )}

      {/* Modal de Vista Previa para Reporte de un solo viaje */}
      {showSingleTripReportPreview && selectedTrip && (
        <ReportPreview
          trips={[selectedTrip]}
          passengers={passengers}
          conductors={conductors}
          dateRange={`Reporte de Viaje - ${format(new Date(selectedTrip.startTime), 'dd/MM/yyyy HH:mm', { locale: es })}`}
          onClose={() => setShowSingleTripReportPreview(false)}
          mode="preview"
          defaultConductorId={selectedTrip.conductorId}
          defaultDateISO={selectedTrip.startTime}
          isSingleConductorReport={true}
        />
      )}
    </div>
  );
};

export default Reports;