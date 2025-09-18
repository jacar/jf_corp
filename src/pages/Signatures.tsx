import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, FileSignature } from 'lucide-react';
import { Signature } from '../types';
import { storage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { applySEO } from '../utils/seo';

const Signatures: React.FC = () => {
  const { user } = useAuth();
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [filteredSignatures, setFilteredSignatures] = useState<Signature[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSignature, setEditingSignature] = useState<Signature | null>(null);
  const [formData, setFormData] = useState({
    type: 'contratista' as 'contratista' | 'corporacion',
    name: '',
    ci: '',
    cargo: ''
  });

  useEffect(() => {
    applySEO({
      title: 'Firmas | Sistema de Reportes JF',
      description: 'Gestione firmas de Contratista y Corporación JF para reportes oficiales.',
      keywords: 'firmas, reportes, verificado, contratista, corporación',
      canonicalPath: '/signatures',
    });
    loadSignatures();
  }, []);

  useEffect(() => {
    filterSignatures();
  }, [signatures, searchTerm]);

  const loadSignatures = () => {
    const data = storage.getSignatures();
    setSignatures(data);
  };

  const filterSignatures = () => {
    if (!searchTerm) {
      setFilteredSignatures(signatures);
    } else {
      const filtered = signatures.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ci.includes(searchTerm) ||
        s.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSignatures(filtered);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSignature) {
      const updatedSignatures = signatures.map(s => 
        s.id === editingSignature.id 
          ? { ...s, ...formData }
          : s
      );
      storage.saveSignatures(updatedSignatures);
      setSignatures(updatedSignatures);
    } else {
      const newSignature: Signature = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      
      const updatedSignatures = [...signatures, newSignature];
      storage.saveSignatures(updatedSignatures);
      setSignatures(updatedSignatures);
    }
    
    resetForm();
  };

  const handleEdit = (signature: Signature) => {
    setEditingSignature(signature);
    setFormData({
      type: signature.type,
      name: signature.name,
      ci: signature.ci,
      cargo: signature.cargo
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta firma?')) {
      const updatedSignatures = signatures.filter(s => s.id !== id);
      storage.saveSignatures(updatedSignatures);
      setSignatures(updatedSignatures);
    }
  };

  const resetForm = () => {
    setFormData({ type: 'contratista', name: '', ci: '', cargo: '' });
    setEditingSignature(null);
    setShowModal(false);
  };

  // Solo admins y root pueden gestionar firmas
  if (user?.role === 'conductor') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">No tiene permisos para gestionar firmas</p>
        </div>
      </div>
    );
  }

  const contratistaSignatures = filteredSignatures.filter(s => s.type === 'contratista');
  const corporacionSignatures = filteredSignatures.filter(s => s.type === 'corporacion');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Firmas para Reportes</h1>
          <p className="text-gray-600">Administre las firmas responsables de verificar reportes. Estas firmas se incluirán automáticamente en todos los reportes generados.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Firma</span>
        </button>
      </div>

      {/* Información importante sobre las firmas */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <FileSignature className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Integración Automática con Reportes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-orange-800 mb-2">🏢 Firmas de Contratista</h4>
                <p className="text-gray-700">
                  Las firmas registradas como "Contratista" aparecerán automáticamente en la sección 
                  "VERIFICADO POR CONTRATISTA" de todos los reportes PDF y Excel generados.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-2">🏛️ Firmas de Corporación JF</h4>
                <p className="text-gray-700">
                  Las firmas registradas como "Corporación JF" aparecerán automáticamente en la sección 
                  "VERIFICADO POR CORPORACIÓN JF" de todos los reportes PDF y Excel generados.
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Nota:</strong> Si no hay firmas registradas para algún tipo, los reportes mostrarán 
                campos en blanco para completar manualmente. Se recomienda registrar al menos una firma 
                de cada tipo para automatizar completamente el proceso.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, CI, cargo o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Firmas de Contratista */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <FileSignature className="h-6 w-6 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Verificado por Contratista ({contratistaSignatures.length})
            </h2>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-orange-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contratistaSignatures.map((signature) => (
                <tr key={signature.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{signature.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {signature.ci}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {signature.cargo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {new Date(signature.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                    <button
                      onClick={() => handleEdit(signature)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(signature.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {contratistaSignatures.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay firmas de contratista registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Firmas de Corporación JF */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <FileSignature className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Verificado por Corporación JF ({corporacionSignatures.length})
            </h2>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {corporacionSignatures.map((signature) => (
                <tr key={signature.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{signature.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {signature.ci}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {signature.cargo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {new Date(signature.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                    <button
                      onClick={() => handleEdit(signature)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(signature.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {corporacionSignatures.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay firmas de corporación registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingSignature ? 'Editar Firma' : 'Nueva Firma'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Verificación *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'contratista' | 'corporacion' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="contratista">Verificado por Contratista</option>
                  <option value="corporacion">Verificado por Corporación JF</option>
                </select>
              </div>
              
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
                  Cédula de Identidad *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ci}
                  onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Supervisor de Transporte"
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
                  {editingSignature ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signatures;