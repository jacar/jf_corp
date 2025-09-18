export interface User {
  id: string;
  name: string;
  cedula: string;
  role: 'root' | 'admin' | 'conductor';
  createdAt: string;
}

export interface Passenger {
  id: string;
  name: string;
  cedula: string;
  gerencia: string;
  qrCode: string;
  createdAt: string;
}

export interface Conductor {
  id: string;
  numeroUnidad: string;
  area: string;
  nombre: string;
  ruta: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Trip {
  id: string;
  groupId?: string;
  shift?: 'mañana' | 'noche';
  passengerId: string;
  passengerName: string;
  passengerCedula: string;
  passengerGerencia?: string;
  conductorId: string;
  conductorName: string;
  ruta: string;
  startTime: string;
  endTime?: string;
  status: 'en_curso' | 'finalizado';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface Signature {
  id: string;
  type: 'contratista' | 'corporacion';
  name: string;
  ci: string;
  cargo: string;
  createdAt: string;
}

export interface ConductorCredential {
  id: string;
  conductorId: string;
  username: string;
  password: string;
  isActive: boolean;
  createdAt: string;
}