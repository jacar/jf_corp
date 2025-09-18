import QRCode from 'qrcode';

export interface QRData {
  cedula: string;
  name: string;
  gerencia: string;
  timestamp: string;
}

export const generateQRCode = async (data: QRData): Promise<string> => {
  try {
    const qrData = JSON.stringify(data);
    return await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const parseQRData = (qrData: string): QRData => {
  try {
    const parsed = JSON.parse(qrData);
    
    if (!parsed.cedula || !parsed.name) {
      throw new Error('QR data incompleto');
    }
    
    return parsed;
  } catch (error) {
    return {
      cedula: qrData.trim(),
      name: '',
      gerencia: '',
      timestamp: new Date().toISOString()
    };
  }
};

export const validateQRData = (data: QRData): boolean => {
  return !!(data.cedula && data.name);
};

export const generateBulkQRCodes = async (passengers: Array<{name: string, cedula: string, gerencia: string}>): Promise<Array<{passenger: any, qrCode: string}>> => {
  const results = [];
  
  for (const passenger of passengers) {
    try {
      const qrData: QRData = {
        cedula: passenger.cedula,
        name: passenger.name,
        gerencia: passenger.gerencia,
        timestamp: new Date().toISOString()
      };
      
      const qrCode = await generateQRCode(qrData);
      results.push({ passenger, qrCode });
    } catch (error) {
      console.error(`Error generando QR para ${passenger.name}:`, error);
    }
  }
  
  return results;
};