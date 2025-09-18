// Internal database system using IndexedDB for persistent storage
// This is completely invisible to users and maintains all data persistently

interface DatabaseSchema {
  users: User[];
  passengers: Passenger[];
  conductors: Conductor[];
  trips: Trip[];
  signatures: Signature[];
  conductorCredentials: ConductorCredential[];
}

interface User {
  id: string;
  name: string;
  cedula: string;
  role: 'root' | 'admin' | 'conductor';
  createdAt: string;
}

interface Passenger {
  id: string;
  name: string;
  cedula: string;
  gerencia: string;
  qrCode: string;
  createdAt: string;
}

interface Conductor {
  id: string;
  name: string;
  cedula: string;
  placa: string;
  area?: string;
  ruta?: string;
  avatarUrl?: string;
  coverUrl?: string;
  createdAt: string;
}

interface Trip {
  id: string;
  groupId?: string;
  shift?: 'mañana' | 'noche';
  passengerId: string;
  passengerName: string;
  passengerCedula: string;
  conductorId: string;
  conductorName: string;
  ruta: string;
  startTime: string;
  endTime?: string;
  status: 'en_curso' | 'finalizado';
  createdAt: string;
}

interface Signature {
  id: string;
  type: 'contratista' | 'corporacion';
  name: string;
  ci: string;
  cargo: string;
  createdAt: string;
}

interface ConductorCredential {
  id: string;
  conductorId: string;
  username: string;
  password: string;
  isActive: boolean;
  createdAt: string;
}

class IndexedDBService {
  private dbName = 'TransportJF_Database';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for each data type
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' });
          usersStore.createIndex('cedula', 'cedula', { unique: true });
        }
        
        if (!db.objectStoreNames.contains('passengers')) {
          const passengersStore = db.createObjectStore('passengers', { keyPath: 'id' });
          passengersStore.createIndex('cedula', 'cedula', { unique: true });
        }
        
        if (!db.objectStoreNames.contains('conductors')) {
          const conductorsStore = db.createObjectStore('conductors', { keyPath: 'id' });
          conductorsStore.createIndex('cedula', 'cedula', { unique: true });
        }
        
        if (!db.objectStoreNames.contains('trips')) {
          const tripsStore = db.createObjectStore('trips', { keyPath: 'id' });
          tripsStore.createIndex('conductorId', 'conductorId');
          tripsStore.createIndex('passengerId', 'passengerId');
          tripsStore.createIndex('groupId', 'groupId');
          tripsStore.createIndex('startTime', 'startTime');
        }
        
        if (!db.objectStoreNames.contains('signatures')) {
          const signaturesStore = db.createObjectStore('signatures', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('conductorCredentials')) {
          const credentialsStore = db.createObjectStore('conductorCredentials', { keyPath: 'id' });
          credentialsStore.createIndex('conductorId', 'conductorId');
        }
      };
    });
  }

  private async getObjectStore(storeName: keyof DatabaseSchema, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }
    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Generic CRUD operations
  async getAll<T>(storeName: keyof DatabaseSchema): Promise<T[]> {
    const store = await this.getObjectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T>(storeName: keyof DatabaseSchema, id: string): Promise<T | null> {
    const store = await this.getObjectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async save<T>(storeName: keyof DatabaseSchema, data: T): Promise<void> {
    const store = await this.getObjectStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveAll<T>(storeName: keyof DatabaseSchema, data: T[]): Promise<void> {
    const store = await this.getObjectStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const transaction = store.transaction;
      let completed = 0;
      
      if (data.length === 0) {
        resolve();
        return;
      }

      data.forEach((item, index) => {
        const request = store.put(item);
        request.onsuccess = () => {
          completed++;
          if (completed === data.length) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async delete(storeName: keyof DatabaseSchema, id: string): Promise<void> {
    const store = await this.getObjectStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Specific methods for each data type
  async getUsers(): Promise<User[]> {
    return this.getAll<User>('users');
  }

  async saveUsers(users: User[]): Promise<void> {
    return this.saveAll('users', users);
  }

  async getPassengers(): Promise<Passenger[]> {
    return this.getAll<Passenger>('passengers');
  }

  async savePassengers(passengers: Passenger[]): Promise<void> {
    console.log('Saving passengers to IndexedDB:', passengers);
    return this.saveAll('passengers', passengers);
  }

  async getConductors(): Promise<Conductor[]> {
    return this.getAll<Conductor>('conductors');
  }

  async saveConductors(conductors: Conductor[]): Promise<void> {
    console.log('Saving conductors to IndexedDB:', conductors);
    return this.saveAll('conductors', conductors);
  }

  async getTrips(): Promise<Trip[]> {
    return this.getAll<Trip>('trips');
  }

  async saveTrips(trips: Trip[]): Promise<void> {
    return this.saveAll('trips', trips);
  }

  async getSignatures(): Promise<Signature[]> {
    return this.getAll<Signature>('signatures');
  }

  async saveSignatures(signatures: Signature[]): Promise<void> {
    return this.saveAll('signatures', signatures);
  }

  async getConductorCredentials(): Promise<ConductorCredential[]> {
    return this.getAll<ConductorCredential>('conductorCredentials');
  }

  async saveConductorCredentials(credentials: ConductorCredential[]): Promise<void> {
    console.log('Saving conductor credentials to IndexedDB:', credentials);
    return this.saveAll('conductorCredentials', credentials);
  }

  async clearPassengers(): Promise<void> {
    const store = await this.getObjectStore('passengers', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Migration from localStorage to IndexedDB
  async migrateFromLocalStorage(): Promise<void> {
    try {
      // Check if migration is needed
      const migrationKey = 'transport_migration_completed';
      if (localStorage.getItem(migrationKey)) {
        return; // Already migrated
      }

      console.log('Starting migration from localStorage to IndexedDB...');

      // Migrate all data
      const users = this.getFromLocalStorage('transport_users', []);
      const passengers = this.getFromLocalStorage('transport_passengers', []);
      const conductors = this.getFromLocalStorage('transport_conductors', []);
      const trips = this.getFromLocalStorage('transport_trips', []);
      const signatures = this.getFromLocalStorage('transport_signatures', []);
      const credentials = this.getFromLocalStorage('transport_conductor_credentials', []);

      // Save to IndexedDB
      if (users.length > 0) await this.saveUsers(users);
      if (passengers.length > 0) await this.savePassengers(passengers);
      if (conductors.length > 0) await this.saveConductors(conductors);
      if (trips.length > 0) await this.saveTrips(trips);
      if (signatures.length > 0) await this.saveSignatures(signatures);
      if (credentials.length > 0) await this.saveConductorCredentials(credentials);

      // Mark migration as completed
      localStorage.setItem(migrationKey, 'true');
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  private getFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  // Clear all data (for development/testing)
  async clearAll(): Promise<void> {
    const storeNames: (keyof DatabaseSchema)[] = ['users', 'passengers', 'conductors', 'trips', 'signatures', 'conductorCredentials'];
    
    for (const storeName of storeNames) {
      const store = await this.getObjectStore(storeName, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();

// Auto-initialize and migrate on import
indexedDBService.init().then(() => {
  indexedDBService.migrateFromLocalStorage();
}).catch(console.error);

