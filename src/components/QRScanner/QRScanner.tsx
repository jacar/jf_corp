import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const lastScanTime = useRef<number>(0);

  useEffect(() => {
    const startCamera = async () => {
      if (!videoRef.current || qrScannerRef.current) return;

      try {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            // Prevenir escaneos duplicados en menos de 2 segundos
            const now = Date.now();
            if (now - lastScanTime.current < 2000) {
              return;
            }
            lastScanTime.current = now;
            
            setIsScanning(true);
            onScan(result.data);
            
            // Cerrar el scanner después del escaneo exitoso
            setTimeout(() => {
              onClose();
            }, 1000);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 1, // Limitar a 1 escaneo por segundo
          }
        );

        await qrScannerRef.current.start();
      } catch (err) {
        console.error('Error starting QR scanner:', err);
        setError('No se pudo acceder a la cámara. Verifique los permisos.');
      }
    };

    startCamera();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 md:p-8 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Escanear Código QR</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {error ? (
          <div className="text-center py-8">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-[60vh] md:h-[70vh] bg-gray-900 rounded-xl object-cover"
              playsInline
            />
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {isScanning ? 'Procesando...' : 'Apunte la cámara hacia el código QR del pasajero'}
              </p>
              {isScanning && (
                <div className="mt-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;