import React, { useState, useEffect } from 'react';
import { applySEO } from '../utils/seo';
import { Users, Car, Route, TrendingUp } from 'lucide-react';
import { storage } from '../utils/storage';
import { Passenger, Conductor, Trip } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalPassengers: 0,
    totalConductors: 0,
    totalTrips: 0,
    activeTrips: 0
  });

  useEffect(() => {
    applySEO({
      title: 'Dashboard | Sistema de Reportes JF',
      description: 'Panel de control del Sistema de Reportes JF: estadísticas de pasajeros, conductores y viajes.',
      keywords: 'dashboard, reportes, transporte, pasajeros, conductores, viajes',
      canonicalPath: '/dashboard',
    });
    const passengers = storage.getPassengers();
    const conductors = storage.getConductors();
    const trips = storage.getTrips();
    
    setStats({
      totalPassengers: passengers.length,
      totalConductors: conductors.length,
      totalTrips: trips.length,
      activeTrips: trips.filter(t => t.status === 'en_curso').length
    });
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pasajeros"
          value={stats.totalPassengers}
          icon={<Users className="h-6 w-6 text-white" />}
          color="bg-primary-500"
        />
        <StatCard
          title="Total Conductores"
          value={stats.totalConductors}
          icon={<Car className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Total Viajes"
          value={stats.totalTrips}
          icon={<Route className="h-6 w-6 text-white" />}
          color="bg-secondary-500"
        />
        <StatCard
          title="Viajes Activos"
          value={stats.activeTrips}
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Bienvenido al Sistema de Gestión de Transporte
        </h2>
        <div className="space-y-4 text-gray-600">
          <p>
            Este sistema le permite gestionar de manera eficiente el transporte de pasajeros con las siguientes funcionalidades:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Registro y gestión de pasajeros con códigos QR únicos</li>
            <li>Administración de conductores y vehículos</li>
            <li>Control de viajes en tiempo real</li>
            <li>Generación de reportes detallados</li>
            <li>Exportación de datos a PDF y Excel</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;