import { User, Passenger, Conductor, Trip, Signature, ConductorCredential } from '../types';
import { generateDefaultPassengers } from './defaultPassengers';
import { generateDefaultConductors } from './defaultConductors';
import { indexedDBService } from '../database/indexeddb';

const STORAGE_KEYS = {
  USERS: 'transport_users',
  PASSENGERS: 'transport_passengers',
  CONDUCTORS: 'transport_conductors',
  TRIPS: 'transport_trips',
  CURRENT_USER: 'transport_current_user',
  SIGNATURES: 'transport_signatures',
  CONDUCTOR_CREDENTIALS: 'transport_conductor_credentials'
};

const initializeDefaultData = async () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: User[] = [
      {
        id: '1',
        name: 'Administrador',
        cedula: '12345678',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }
  
  // Cargar conductores por defecto de manera segura
  try {
    const existingConductors = await indexedDBService.getConductors();
    
    // Si no hay conductores, cargar los predeterminados
    if (existingConductors.length === 0) {
      console.log('No se encontraron conductores existentes, cargando conductores predeterminados...');
      
      // Obtener conductores predeterminados
      let defaultConductors = generateDefaultConductors();
      
      // Manejar cédulas duplicadas
      const cedulaCount: Record<string, number> = {};
      defaultConductors = defaultConductors.map(conductor => {
        const cedula = conductor.cedula;
        if (cedula in cedulaCount) {
          // Si la cédula ya existe, agregar un sufijo numérico
          cedulaCount[cedula]++;
          return {
            ...conductor,
            cedula: `${cedula}-${cedulaCount[cedula]}`,
            originalCedula: cedula  // Guardar la cédula original
          };
        } else {
          cedulaCount[cedula] = 0;
          return conductor;
        }
      });
      
      await indexedDBService.saveConductors(defaultConductors);
      console.log(`${defaultConductors.length} conductores predeterminados cargados exitosamente.`);
    } else {
      console.log(`Se encontraron ${existingConductors.length} conductores existentes.`);
    }
  } catch (error) {
    console.error('Error al cargar conductores:', error);
  }
  
  // Cargar pasajeros por defecto
  try {
    const existingPassengers = await indexedDBService.getPassengers();
    if (existingPassengers.length === 0) {
      const defaultPassengers = await generateDefaultPassengers();
      await indexedDBService.savePassengers(defaultPassengers);
    }
  } catch (error) {
    console.error('Error al cargar pasajeros por defecto:', error);
  }
};

initializeDefaultData().catch(console.error);

export const storage = {
  getUsers: (): User[] => {
    // Try IndexedDB first, fallback to localStorage
    indexedDBService.getUsers().then(users => {
      if (users.length > 0) {
        // Update localStorage as backup
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    }).catch(() => {
      // Fallback to localStorage if IndexedDB fails
    });
    
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },
  
  saveUsers: async (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    try {
      await indexedDBService.saveUsers(users);
    } catch (error) {
      console.error('Failed to save users to IndexedDB:', error);
    }
  },

  getPassengers: async (): Promise<Passenger[]> => {
    console.log('storage.getPassengers: Getting passengers from IndexedDB');
    // Always get from IndexedDB as the source of truth
    return indexedDBService.getPassengers();
  },
  
  savePassengers: async (passengers: Passenger[]) => {
    console.log('storage.savePassengers: Saving passengers to IndexedDB', passengers);
    try {
      // Always save to IndexedDB
      await indexedDBService.savePassengers(passengers);
      
      // Optionally, keep a small, manageable subset in localStorage for quick access if needed,
      // but for now, we'll rely on IndexedDB to avoid quota issues.
      // if (localStorage.getItem(STORAGE_KEYS.PASSENGERS)) {
      //   localStorage.removeItem(STORAGE_KEYS.PASSENGERS);
      // }

    } catch (error) {
      console.error('Failed to save passengers:', error);
      throw new Error('No se pudieron guardar los pasajeros. El almacenamiento está lleno o hay un problema con la base de datos.');
    }
  },

  getConductors: async (): Promise<Conductor[]> => {
    console.log('storage.getConductors: Getting conductors from IndexedDB');
    return indexedDBService.getConductors();
  },
  
  saveConductors: async (conductors: Conductor[]) => {
    console.log('storage.saveConductors: Saving conductors to IndexedDB', conductors);
    try {
      await indexedDBService.saveConductors(conductors);
    } catch (error) {
      console.error('Failed to save conductors:', error);
      throw new Error('No se pudieron guardar los conductores. El almacenamiento está lleno o hay un problema con la base de datos.');
    }
  },

  getTrips: (): Trip[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRIPS);
    return data ? JSON.parse(data) : [];
  },
  
  saveTrips: (trips: Trip[]) => {
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },
  
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getSignatures: (): Signature[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SIGNATURES);
    return data ? JSON.parse(data) : [];
  },
  
  saveSignatures: (signatures: Signature[]) => {
    localStorage.setItem(STORAGE_KEYS.SIGNATURES, JSON.stringify(signatures));
  },

  getConductorCredentials: async (): Promise<ConductorCredential[]> => {
    console.log('storage.getConductorCredentials: Getting conductor credentials from IndexedDB');
    return indexedDBService.getConductorCredentials();
  },
  
  saveConductorCredentials: async (credentials: ConductorCredential[]) => {
    console.log('storage.saveConductorCredentials: Saving conductor credentials to IndexedDB', credentials);
    try {
      await indexedDBService.saveConductorCredentials(credentials);
    } catch (error) {
      console.error('Failed to save conductor credentials:', error);
      throw new Error('No se pudieron guardar las credenciales del conductor. El almacenamiento está lleno o hay un problema con la base de datos.');
    }
  },
  
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};