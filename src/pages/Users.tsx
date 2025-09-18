import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Key, UserCheck, UserX } from 'lucide-react';
import { applySEO } from '../utils/seo';
import { User, ConductorCredential, Conductor, Passenger } from '../types';
import { storage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [conductors, setConductors] = useState<Conductor[]>([]);
  const [conductorCredentials, setConductorCredentials] = useState<ConductorCredential[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [selectedConductorForCredential, setSelectedConductorForCredential] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    cedula: '',
    role: 'admin' as 'admin' | 'conductor'
  });
  const [credentialData, setCredentialData] = useState({
    username: '',
    password: '',
    conductorId: ''
  });

  useEffect(() => {
    applySEO({
      title: 'Usuarios | Sistema de Reportes JF',
      description: 'Gestione usuarios y credenciales de conductores (solo rol root).',
      keywords: 'usuarios, credenciales, root, administración',
      canonicalPath: '/users',
    });
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const loadData = async () => {
    setUsers(storage.getUsers());
    setPassengers(await storage.getPassengers());
    setConductors(await storage.getConductors());
    setConductorCredentials(await storage.getConductorCredentials());
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.cedula.includes(searchTerm) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      const updatedUsers = users.map(u => 
        u.id === editingUser.id 
          ? { ...u, ...formData }
          : u
      );
      storage.saveUsers(updatedUsers);
      setUsers(updatedUsers);
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      
      const updatedUsers = [...users, newUser];
      storage.saveUsers(updatedUsers);
      setUsers(updatedUsers);
    }
    
    resetForm();
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCredential: ConductorCredential = {
      id: Date.now().toString(),
      conductorId: credentialData.conductorId,
      username: credentialData.username,
      password: credentialData.password,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    const updatedCredentials = [...conductorCredentials, newCredential];
    await storage.saveConductorCredentials(updatedCredentials);
    setConductorCredentials(updatedCredentials);
    
    resetCredentialForm();
  };

  const toggleCredentialStatus = async (credentialId: string) => {
    const updatedCredentials = conductorCredentials.map(c => 
      c.id === credentialId 
        ? { ...c, isActive: !c.isActive }
        : c
    );
    await storage.saveConductorCredentials(updatedCredentials);
    setConductorCredentials(updatedCredentials);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      cedula: user.cedula,
      role: user.role as 'admin' | 'conductor'
    });
    setIsUserModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      const updatedUsers = users.filter(u => u.id !== id);
      storage.saveUsers(updatedUsers);
      setUsers(updatedUsers);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', cedula: '', role: 'admin' });
    setEditingUser(null);
    setIsUserModalOpen(false);
  };

  const resetCredentialForm = () => {
    setCredentialData({ username: '', password: '', conductorId: '' });
    setSelectedConductorForCredential('');
    setIsCredentialModalOpen(false);
  };

  // Solo usuarios root pueden acceder
  if (currentUser?.role !== 'root') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">Solo usuarios root pueden gestionar usuarios</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administre usuarios y credenciales del sistema</p>
        </div>
        <div className="flex flex-col space-y-3 md:flex-row md:space-x-3 md:space-y-0">
          <button
            onClick={() => setIsCredentialModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Key className="h-5 w-5" />
            <span>Credenciales Conductor</span>
          </button>
          <button
            onClick={() => setIsUserModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 hidden md:table-header-group">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cédula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 block md:table-row-group">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 block md:table-row">
                  <td className="px-6 py-4 block md:table-cell">
                    <div className="font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 block md:table-cell text-gray-600">
                    {user.cedula}
                  </td>
                  <td className="px-6 py-4 block md:table-cell">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'root' 
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'root' ? 'Root' : user.role === 'admin' ? 'Admin' : 'Conductor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 block md:table-cell text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2 block md:table-cell">
                    {user.role !== 'root' && (
                      <>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de credenciales de conductores */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Credenciales de Conductores</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 hidden md:table-header-group">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conductor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 block md:table-row-group">
              {conductorCredentials.map((credential) => {
                const conductor = conductors.find(c => c.id === credential.conductorId);
                return (
                  <tr key={credential.id} className="hover:bg-gray-50 block md:table-row">
                    <td className="px-6 py-4 block md:table-cell">
                      <div className="font-medium text-gray-900">
                        {conductor?.name || 'Conductor no encontrado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 block md:table-cell text-gray-600">
                      {credential.username}
                    </td>
                    <td className="px-6 py-4 block md:table-cell">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        credential.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {credential.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center block md:table-cell">
                      <button
                        onClick={() => toggleCredentialStatus(credential.id)}
                        className={`${
                          credential.isActive 
                            ? 'text-red-600 hover:text-red-800' 
                            : 'text-green-600 hover:text-green-800'
                        } transition-colors`}
                        title={credential.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {credential.isActive ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Usuario */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'conductor' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="admin">Administrador</option>
                  <option value="conductor">Conductor</option>
                </select>
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
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Credenciales */}
      {isCredentialModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Crear Credenciales de Conductor
            </h2>
            
            <form onSubmit={handleCredentialSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conductor *
                </label>
                <select
                  required
                  value={credentialData.conductorId}
                  onChange={(e) => setCredentialData({ ...credentialData, conductorId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Seleccionar conductor</option>
                  {conductors.map((conductor) => (
                    <option key={conductor.id} value={conductor.id}>
                      {conductor.name} - {conductor.cedula}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario *
                </label>
                <input
                  type="text"
                  required
                  value={credentialData.username}
                  onChange={(e) => setCredentialData({ ...credentialData, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={credentialData.password}
                  onChange={(e) => setCredentialData({ ...credentialData, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetCredentialForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;