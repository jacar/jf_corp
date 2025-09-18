import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { Conductor } from '../types';
import { Camera, Upload } from 'lucide-react';
import { applySEO } from '../utils/seo';

const ConductorProfile: React.FC = () => {
  const { user } = useAuth();
  const [conductor, setConductor] = useState<Conductor | null>(null);
  
  useEffect(() => {
    applySEO({
      title: 'Mi Perfil | Sistema de Reportes JF',
      description: 'Perfil del conductor con información personal y fotos.',
      keywords: 'perfil, conductor, transporte',
      canonicalPath: '/conductor-profile',
    });
    const all = storage.getConductors();
    const own = all.find(c => c.id === user?.id || c.cedula === user?.cedula) || null;
    setConductor(own);
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarUrl' | 'coverUrl') => {
    const file = e.target.files?.[0];
    if (!file || !conductor) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const all = storage.getConductors();
      const updated = all.map(c => c.id === conductor.id ? { ...c, [field]: dataUrl } : c);
      storage.saveConductors(updated);
      setConductor({ ...conductor, [field]: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  if (!conductor) {
    return (
      <div className="p-6">No se encontró el perfil de conductor.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="relative h-40 md:h-56 bg-gray-200">
          {conductor.coverUrl && (
            <img src={conductor.coverUrl} alt="Portada" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <label className="absolute bottom-3 right-3 bg-white/90 text-gray-800 px-3 py-1.5 rounded shadow cursor-pointer flex items-center space-x-2 text-sm">
            <Upload className="h-4 w-4" />
            <span>Cambiar portada</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'coverUrl')} />
          </label>
        </div>
        <div className="p-6 md:p-8">
          <div className="flex items-start space-x-4">
            <div className="relative -mt-16 h-24 w-24 rounded-full ring-4 ring-white bg-gray-300 overflow-hidden">
              {conductor.avatarUrl && (
                <img src={conductor.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              )}
              <label className="absolute bottom-0 right-0 bg-white text-gray-800 p-1.5 rounded-full shadow cursor-pointer">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'avatarUrl')} />
              </label>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{conductor.name}</h1>
              <p className="text-gray-600">C.I. {conductor.cedula}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Unidad</p>
              <p className="text-lg font-semibold text-gray-900">{conductor.placa}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Ruta</p>
              <p className="text-lg font-semibold text-gray-900">{conductor.ruta || 'No especificada'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Área</p>
              <p className="text-lg font-semibold text-gray-900">{conductor.area || 'No especificada'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">ID</p>
              <p className="text-lg font-semibold text-gray-900">{conductor.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConductorProfile;


