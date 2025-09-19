import React, { useState, useEffect } from 'react';
import { applySEO } from '../utils/seo';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Conductor } from '../types';
import { storage } from '../utils/storage';
import { generateDefaultConductors } from '../utils/defaultConductors';

// Lista fija de números de unidad (sin duplicados y ordenados)
const NUMEROS_UNIDAD = [
  '274', '276', '278', '279', '280',
  '281', '290', '291', '292', '293',
  '294', '295', '296', '297', '320', '348'
];

const Conductors: React.FC = () => {
  const [conductors, setConductors] = useState<Conductor[]>([]);
  const [filteredConductors, setFilteredConductors] = useState<Conductor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingConductor, setEditingConductor] = useState<Conductor | null>(null);
  const [formData, setFormData] = useState<Omit<Conductor, 'id' | 'createdAt' | 'updatedAt'>>({
    numeroUnidad: '',
    area: '',
    nombre: '',
    ruta: ''
  });

  useEffect(() => {
    applySEO({
      title: 'Conductores | Sistema de Reportes JF',
      description: 'Administre conductores, unidades, áreas y rutas en el Sistema de Reportes JF.',
      keywords: 'conductores, unidades, rutas, transporte, gestión de conductores',
      canonicalPath: '/conductors',
    });
    loadConductors();
  }, []);

  useEffect(() => {
    filterConductors();
  }, [conductors, searchTerm]);

  const loadConductors = async () => {
    try {
      // Primero intentamos cargar los conductores existentes
      let data = await storage.getConductors();
      
      // Si no hay conductores, generamos los conductores por defecto
      if (data.length === 0) {
        console.log('No se encontraron conductores, generando conductores por defecto...');
        const defaultConductors = generateDefaultConductors();
        await storage.saveConductors(defaultConductors);
        data = defaultConductors;
      }
      
      console.log('Conductores cargados:', data);
      setConductors(data);
    } catch (error) {
      console.error('Error al cargar conductores:', error);
    }
  };

  const filterConductors = () => {
    if (!searchTerm.trim()) {
      setFilteredConductors(conductors);
      return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const filtered = conductors.filter(conductor => 
      conductor.nombre.toLowerCase().includes(searchLower) ||
      conductor.numeroUnidad.includes(searchTerm) ||
      conductor.area.toLowerCase().includes(searchLower) ||
      conductor.ruta.toLowerCase().includes(searchLower)
    );
    
    setFilteredConductors(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingConductor) {
      // Actualizar conductor existente
      const updatedConductors = conductors.map(c => 
        c.id === editingConductor.id 
          ? { ...formData, id: c.id, updatedAt: new Date().toISOString(), createdAt: c.createdAt }
          : c
      );
      await storage.saveConductors(updatedConductors);
      setConductors(updatedConductors);
    } else {
      // Crear nuevo conductor
      const newConductor: Conductor = {
        ...formData,
        id: `cond-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedConductors = [...conductors, newConductor];
      await storage.saveConductors(updatedConductors);
      setConductors(updatedConductors);
    }
    
    resetForm();
  };

  const handleEdit = (conductor: Conductor) => {
    const { id, createdAt, updatedAt, ...rest } = conductor;
    setEditingConductor(conductor);
    setFormData(rest);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este conductor?')) {
      const updatedConductors = conductors.filter(c => c.id !== id);
      await storage.saveConductors(updatedConductors);
      setConductors(updatedConductors);
    }
  };

  const resetForm = () => {
    setFormData({
      numeroUnidad: '',
      area: '',
      nombre: '',
      ruta: ''
    });
    setEditingConductor(null);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Conductores</h1>
          <p className="text-gray-600">Administre los conductores del sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Conductor</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
          <div className="relative max-w-md">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, número o ruta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border-2 border-blue-100 focus:border-blue-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition-all text-sm sm:text-base bg-white text-gray-800 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Versión de escritorio - Tabla */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  N° de Unidad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Área
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Ruta
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredConductors.map((conductor, index) => (
                <tr key={conductor.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800">
                    {conductor.numeroUnidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {conductor.area || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {conductor.nombre}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {conductor.ruta}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(conductor)}
                      className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(conductor.id)}
                      className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Versión móvil - Tarjetas */}
        <div className="md:hidden p-4 space-y-3">
          {filteredConductors.map((conductor) => (
            <div key={conductor.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-flex items-center justify-center h-8 w-16 rounded-lg bg-blue-600 text-white text-sm font-bold">
                      {conductor.numeroUnidad || 'N/A'}
                    </span>
                    <h3 className="text-base font-semibold text-gray-800 truncate flex-1">
                      {conductor.nombre || 'Sin nombre'}
                    </h3>
                  </div>
                  <div className="mt-2 space-y-2 text-sm text-gray-600">
                    {conductor.area && (
                      <p className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="truncate">{conductor.area}</span>
                      </p>
                    )}
                    {conductor.ruta && (
                      <p className="flex items-start">
                        <svg className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-2">{conductor.ruta}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="ml-2 flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(conductor);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(conductor.id);
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para agregar/editar conductor */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingConductor ? 'Editar Conductor' : 'Nuevo Conductor'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  N° de Unidad *
                </label>
                <select
                  required
                  value={formData.numeroUnidad}
                  onChange={(e) => setFormData({...formData, numeroUnidad: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccione un número de unidad</option>
                  {NUMEROS_UNIDAD.map(numero => (
                    <option key={numero} value={numero}>
                      {numero}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: CARLOS NAVEDA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Área
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: ADMINISTRATIVA RICHMOND"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ruta *
                </label>
                <textarea
                  required
                  value={formData.ruta}
                  onChange={(e) => setFormData({...formData, ruta: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: LA LAGUNITA - LOS PATRULLEROS - RICHMOND"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingConductor ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Conductors;