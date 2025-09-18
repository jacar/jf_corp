import * as XLSX from 'xlsx';
import { Trip, Passenger, Conductor } from '../types';
import { storage } from './storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Procesa datos importados desde un archivo CSV/Excel para convertirlos en viajes
 * @param data Los datos importados del archivo
 * @returns Array de viajes procesados
 */
export const processTripsFromImport = (data: any[]): Trip[] => {
  const trips: Trip[] = [];
  const existingPassengers = storage.getPassengers();
  const existingConductors = storage.getConductors();

  // Mapeo de nombres de columnas esperados (para ser flexible con diferentes formatos)
  const columnMappings = {
    // Columnas de conductor
    conductorName: ['conductor', 'nombre conductor', 'nombre del conductor', 'chofer', 'nombre chofer'],
    conductorCedula: ['ci conductor', 'cedula conductor', 'cédula conductor', 'ci chofer', 'cedula chofer'],
    placa: ['placa', 'unidad', 'vehiculo', 'vehículo'],
    ruta: ['ruta', 'ruta asignada', 'recorrido'],
    
    // Columnas de pasajero
    passengerName: ['pasajero', 'nombre pasajero', 'nombre del pasajero'],
    passengerCedula: ['ci pasajero', 'cedula pasajero', 'cédula pasajero'],
    gerencia: ['gerencia', 'área', 'area', 'gerencia/área', 'departamento'],
    
    // Columnas de tiempo
    fecha: ['fecha', 'dia', 'día', 'date'],
    startTime: ['hora salida', 'salida', 'hora inicio', 'inicio'],
    endTime: ['hora llegada', 'llegada', 'hora fin', 'fin'],
  };

  // Función para encontrar el valor de una columna basado en los posibles nombres
  const findColumnValue = (row: any, possibleNames: string[]): string => {
    const key = Object.keys(row).find(k => 
      possibleNames.some(name => k.toLowerCase().includes(name.toLowerCase()))
    );
    return key ? row[key] : '';
  };

  // Procesar cada fila del archivo importado
  data.forEach((row, index) => {
    try {
      // Extraer datos del conductor
      const conductorName = findColumnValue(row, columnMappings.conductorName);
      const conductorCedula = findColumnValue(row, columnMappings.conductorCedula);
      const placa = findColumnValue(row, columnMappings.placa);
      const ruta = findColumnValue(row, columnMappings.ruta);
      
      // Extraer datos del pasajero
      const passengerName = findColumnValue(row, columnMappings.passengerName);
      const passengerCedula = findColumnValue(row, columnMappings.passengerCedula);
      const gerencia = findColumnValue(row, columnMappings.gerencia);
      
      // Extraer datos de tiempo
      let fechaStr = findColumnValue(row, columnMappings.fecha);
      let startTimeStr = findColumnValue(row, columnMappings.startTime);
      let endTimeStr = findColumnValue(row, columnMappings.endTime);
      
      // Validar datos mínimos requeridos
      if (!conductorName || !passengerName) {
        console.warn(`Fila ${index + 1} ignorada: Faltan datos obligatorios`);
        return;
      }

      // Buscar o crear IDs para conductor y pasajero
      let conductorId = '';
      let passengerId = '';
      
      // Buscar conductor existente
      const existingConductor = existingConductors.find(c => 
        c.name.toLowerCase() === conductorName.toLowerCase() ||
        (conductorCedula && c.cedula === conductorCedula)
      );
      
      if (existingConductor) {
        conductorId = existingConductor.id;
      } else {
        // Si no existe, se usará solo el nombre en el viaje
        conductorId = '';
      }
      
      // Buscar pasajero existente
      const existingPassenger = existingPassengers.find(p => 
        p.name.toLowerCase() === passengerName.toLowerCase() ||
        (passengerCedula && p.cedula === passengerCedula)
      );
      
      if (existingPassenger) {
        passengerId = existingPassenger.id;
      } else {
        // Si no existe, se usará solo el nombre en el viaje
        passengerId = '';
      }
      
      // Procesar fechas y horas
      let startTime = new Date();
      let endTime: Date | null = null;
      
      // Intentar parsear la fecha y horas
      try {
        // Si hay una fecha específica en el archivo
        if (fechaStr) {
          // Intentar varios formatos de fecha
          const dateParts = fechaStr.split(/[\/\-]/);
          if (dateParts.length === 3) {
            // Asumir formato DD/MM/YYYY o similar
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // Los meses en JS son 0-indexed
            const year = parseInt(dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2]);
            
            startTime = new Date(year, month, day);
          }
        }
        
        // Procesar hora de inicio
        if (startTimeStr) {
          const timeParts = startTimeStr.split(':');
          if (timeParts.length >= 2) {
            startTime.setHours(parseInt(timeParts[0]));
            startTime.setMinutes(parseInt(timeParts[1]));
            startTime.setSeconds(timeParts.length > 2 ? parseInt(timeParts[2]) : 0);
          }
        }
        
        // Procesar hora de fin si existe
        if (endTimeStr) {
          endTime = new Date(startTime);
          const timeParts = endTimeStr.split(':');
          if (timeParts.length >= 2) {
            endTime.setHours(parseInt(timeParts[0]));
            endTime.setMinutes(parseInt(timeParts[1]));
            endTime.setSeconds(timeParts.length > 2 ? parseInt(timeParts[2]) : 0);
          }
        }
      } catch (error) {
        console.warn(`Error al procesar fecha/hora en fila ${index + 1}:`, error);
        // Usar la fecha actual como fallback
        startTime = new Date();
        endTime = null;
      }
      
      // Crear el objeto de viaje
      const trip: Trip = {
        id: uuidv4(),
        conductorId,
        conductorName,
        conductorCedula: conductorCedula || '',
        passengerId,
        passengerName,
        passengerCedula: passengerCedula || '',
        ruta: ruta || '',
        startTime: startTime.toISOString(),
        endTime: endTime ? endTime.toISOString() : null,
        status: endTime ? 'completed' : 'active',
        importedFromCsv: true
      };
      
      trips.push(trip);
    } catch (error) {
      console.error(`Error al procesar fila ${index + 1}:`, error);
    }
  });

  return trips;
};

/**
 * Guarda los viajes importados en el almacenamiento local
 * @param trips Los viajes a guardar
 * @returns El número de viajes guardados
 */
export const saveImportedTrips = (trips: Trip[]): number => {
  if (!trips || trips.length === 0) return 0;
  
  const existingTrips = storage.getTrips();
  const newTrips = [...existingTrips, ...trips];
  
  storage.saveTrips(newTrips);
  return trips.length;
};

/**
 * Procesa un archivo CSV/Excel y guarda los viajes importados
 * @param file El archivo a procesar
 * @returns Promesa con el número de viajes importados
 */
export const importTripsFromFile = async (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('No se pudo leer el archivo'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        if (!json || json.length === 0) {
          reject(new Error('El archivo no contiene datos válidos'));
          return;
        }
        
        const trips = processTripsFromImport(json);
        const savedCount = saveImportedTrips(trips);
        
        resolve(savedCount);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsBinaryString(file);
  });
};