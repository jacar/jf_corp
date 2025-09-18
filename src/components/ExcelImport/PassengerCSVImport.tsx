import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { importPassengersFromFile } from '../../utils/passengerImport';

interface PassengerCSVImportProps {
  onImportSuccess?: (count: number) => void;
  onImportError?: (error: string) => void;
  allowedTypes?: string[];
  onComplete?: () => void;
}

const PassengerCSVImport: React.FC<PassengerCSVImportProps> = ({
  onImportSuccess,
  onImportError,
  allowedTypes = ['.csv', '.xlsx', '.xls'],
  onComplete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setResult(null);

    // Verificar tipo de archivo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      const errorMsg = `Tipo de archivo no permitido. Por favor use: ${allowedTypes.join(', ')}`;
      setResult({ type: 'error', message: errorMsg });
      if (onImportError) onImportError(errorMsg);
      setIsProcessing(false);
      return;
    }

    try {
      // Importar y procesar el archivo usando la utilidad
      const importedCount = await importPassengersFromFile(file);
      
      if (importedCount === 0) {
        throw new Error('No se pudieron importar pasajeros del archivo. Verifique el formato.');
      }
      
      setResult({ 
        type: 'success', 
        message: `Archivo importado correctamente: ${importedCount} pasajeros procesados` 
      });
      
      if (onImportSuccess) onImportSuccess(importedCount);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      
      // Mensajes de error específicos para problemas de almacenamiento
      let errorMsg = error instanceof Error ? error.message : 'Error al procesar el archivo';
      
      // Detectar si es un error de almacenamiento
      if (errorMsg.includes('almacenamiento está lleno') || 
          errorMsg.includes('quota exceeded') || 
          errorMsg.includes('base de datos')) {
        errorMsg = 'No hay suficiente espacio de almacenamiento. La aplicación utilizará la base de datos interna para guardar más pasajeros.';
      }
      
      setResult({ type: 'error', message: errorMsg });
      if (onImportError) onImportError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} transition-all duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={allowedTypes.join(',')}
          className="hidden"
        />

        {isProcessing ? (
          <div className="py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Procesando archivo...</p>
          </div>
        ) : result ? (
          <div className={`py-4 ${result.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {result.type === 'success' ? (
              <CheckCircle className="h-10 w-10 mx-auto" />
            ) : (
              <AlertCircle className="h-10 w-10 mx-auto" />
            )}
            <p className="mt-2 text-sm">{result.message}</p>
            <button
              onClick={handleButtonClick}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Seleccionar otro archivo
            </button>
          </div>
        ) : (
          <div className="py-8">
            <Upload className="h-10 w-10 text-gray-400 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">
              Arrastra y suelta un archivo CSV o Excel aquí, o
            </p>
            <button
              onClick={handleButtonClick}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Seleccionar archivo
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Formatos permitidos: {allowedTypes.join(', ')}
            </p>
            <div className="mt-4 text-xs text-left bg-gray-50 p-3 rounded border border-gray-200">
              <p className="font-semibold mb-1">Formato esperado del archivo:</p>
              <p>El archivo debe contener las siguientes columnas:</p>
              <ul className="list-disc pl-5 mt-1">
                <li><span className="font-medium">Cedula</span>: Número de identificación</li>
                <li><span className="font-medium">Nombres y Apellidos</span>: Nombre completo del pasajero</li>
                <li><span className="font-medium">Gerencia</span>: Departamento o gerencia (opcional)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerCSVImport;