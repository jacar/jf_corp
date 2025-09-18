import React from 'react';
import { X, Download } from 'lucide-react';
import { Passenger } from '../../types';

interface QRViewerProps {
  passenger: Passenger;
  onClose: () => void;
}

const QRViewer: React.FC<QRViewerProps> = ({ passenger, onClose }) => {
  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `QR_${passenger.name.replace(/\s+/g, '_')}_${passenger.cedula}.png`;
    link.href = passenger.qrCode;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Código QR</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="text-center">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
            <img 
              src={passenger.qrCode} 
              alt={`QR Code for ${passenger.name}`}
              className="w-64 h-64 mx-auto"
            />
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <p><strong>Nombre:</strong> {passenger.name}</p>
            <p><strong>Cédula:</strong> {passenger.cedula}</p>
            <p><strong>Gerencia:</strong> {passenger.gerencia}</p>
          </div>
          
          <button
            onClick={downloadQR}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <Download className="h-4 w-4" />
            <span>Descargar QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRViewer;