import React, { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, Share2 } from 'lucide-react';
import { Trip, Passenger, Conductor, Signature } from '../../types';
import { storage } from '../../utils/storage';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportPreviewProps {
  trips: Trip[];
  passengers: Passenger[];
  conductors: Conductor[];
  dateRange: string;
  onClose: () => void;
  mode?: 'pdf' | 'screenshot' | 'preview';
  defaultConductorId?: string;
  defaultDateISO?: string;
  isSingleConductorReport?: boolean;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ 
  trips, 
  passengers, 
  conductors, 
  dateRange, 
  onClose,
  mode = 'pdf',
  defaultConductorId,
  defaultDateISO,
  isSingleConductorReport = false
}) => {
  console.log("ReportPreview props:", { trips: trips.length, passengers: passengers.length, conductors: conductors.length, dateRange, mode, defaultConductorId, defaultDateISO });
  console.log("ReportPreview props:", { trips: trips.length, passengers: passengers.length, conductors: conductors.length, dateRange, mode, defaultConductorId, defaultDateISO });
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [reportData, setReportData] = useState({
    conductor: '',
    unidad: '',
    area: '',
    dia: '',
    mes: '',
    año: '',
    hora: '',
    ampm: { am: false, pm: false },
    passengerRows: [],
    reportId: '00'
  });

  useEffect(() => {
    setSignatures(storage.getSignatures());
    
    // Pre-llenar algunos datos si hay viajes
    if (trips.length > 0) {
      const firstTrip = trips[0];
      const conductor = conductors.find(c => c.id === firstTrip.conductorId);
      const tripDate = new Date(firstTrip.startTime);
      
      // Generar ID de reporte consecutivo (00, 01, 02, etc.)
      const reportId = String(trips.length).padStart(2, '0');
      
      setReportData({
        conductor: conductor?.name || '',
        unidad: conductor?.placa || '',
        area: conductor?.area || '',
        dia: format(tripDate, 'd'),
        mes: format(tripDate, 'M'),
        año: format(tripDate, 'yyyy'),
        hora: format(tripDate, 'HH:mm'),
        ampm: { 
          am: tripDate.getHours() < 12, 
          pm: tripDate.getHours() >= 12 
        },
        reportId: reportId
      });
    } else {
      // Si no hay viajes, usar el conductor por defecto y la fecha actual (o provista)
      const now = defaultDateISO ? new Date(defaultDateISO) : new Date();
      const conductor = defaultConductorId
        ? conductors.find(c => c.id === defaultConductorId)
        : undefined;
      
      // Generar ID de reporte consecutivo (00, 01, 02, etc.)
      const reportId = String(trips.length).padStart(2, '0');
      
      setReportData({
        conductor: conductor?.name || '',
        unidad: conductor?.placa || '',
        area: conductor?.area || '',
        dia: format(now, 'd'),
        mes: format(now, 'M'),
        año: format(now, 'yyyy'),
        hora: format(now, 'HH:mm'),
        ampm: { am: now.getHours() < 12, pm: now.getHours() >= 12 },
        reportId: reportId
      });
    }
    console.log("ReportPreview: reportData calculated:", reportData);
  }, [trips, conductors, defaultConductorId, defaultDateISO]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === 'am' || field === 'pm') {
      setReportData(prev => ({
        ...prev,
        ampm: { ...prev.ampm, [field]: value }
      }));
    } else {
      setReportData(prev => ({ ...prev, [field]: value }));
    }
  };

  const sharePdfBlob = async (pdfBlob: Blob, fileName: string): Promise<boolean> => {
    try {
      // Verificar si la API de compartir archivos está disponible
      if (!navigator.share || !navigator.canShare || !navigator.canShare({ files: [] })) {
        return false;
      }

      // Crear archivo con el nombre adecuado
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      // Verificar si se puede compartir este archivo
      if (!navigator.canShare({ files: [file] })) {
        return false;
      }

      // Compartir el archivo
      await navigator.share({
        files: [file],
        title: 'Reporte de Viaje',
        text: 'Aquí está el reporte de viaje generado.'
      });
      
      return true; // Éxito al compartir
    } catch (error) {
      console.error('Error al compartir el archivo:', error);
      return false; // Falló al compartir
    }
  };

  const shareViaWhatsApp = async () => {
    try {
      setIsSharing(true);
      setError(null);
      
      // Generate the PDF
      const pdfBlob = await downloadPDFStructured(true);
      if (!pdfBlob) {
        throw new Error('No se pudo generar el PDF');
      }

      // Create file and URL
      const currentDate = new Date().toISOString().split('T')[0];
      const conductorName = reportData.conductor.replace(/\s+/g, '_');
      const fileName = `Reporte_${conductorName}_${currentDate}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // For Android and iOS - use Web Share API first
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Reporte de Viaje',
            text: 'Aquí está el reporte de viaje generado.'
          });
          return;
        } catch (shareError) {
          console.log('Web Share API error:', shareError);
          // Fall through to other methods
        }
      }

      // For iOS - try WhatsApp URL scheme with base64 data
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const base64data = e.target?.result as string;
          const base64Content = base64data.split(',')[1];
          
          // Try to send the file directly via WhatsApp
          const whatsappUrl = `whatsapp://send?text=Reporte%20de%20Viaje&document=data:application/pdf;name=${encodeURIComponent(fileName)};base64,${base64Content}`;
          
          // Open WhatsApp with the file
          window.location.href = whatsappUrl;
          
          // Fallback if WhatsApp doesn't open
          setTimeout(() => {
            if (!document.hidden) {
              // If we're still here, WhatsApp didn't open
              // Try the Web Share API again as fallback
              if (navigator.share) {
                navigator.share({
                  files: [file],
                  title: 'Reporte de Viaje',
                  text: 'Aquí está el reporte de viaje generado.'
                }).catch(() => {
                  // If sharing fails, download the file
                  downloadFile(pdfUrl, fileName);
                });
              } else {
                // Last resort: download the file
                downloadFile(pdfUrl, fileName);
              }
            }
          }, 1000);
        };
        reader.onerror = () => {
          throw new Error('Error al leer el archivo');
        };
        reader.readAsDataURL(file);
        return;
      }

      // For desktop or other devices
      if (navigator.share) {
        // Try Web Share API first if available
        try {
          await navigator.share({
            files: [file],
            title: 'Reporte de Viaje',
            text: 'Aquí está el reporte de viaje generado.'
          });
        } catch (e) {
          // If Web Share fails, download the file
          downloadFile(pdfUrl, fileName);
        }
      } else {
        // For browsers without Web Share API, download the file
        downloadFile(pdfUrl, fileName);
        
        // Show a message to the user
        alert('El archivo se ha descargado. Por favor, ábrelo y compártelo manualmente por WhatsApp.');
      }

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 5000);
      
    } catch (err) {
      console.error('Error al compartir por WhatsApp:', err);
      setError('Error al compartir el reporte. Por favor intente nuevamente.');
    } finally {
      setIsSharing(false);
    }
  };

  const downloadPDFStructured = async (returnAsBlob = false) => {
    console.log('downloadPDFStructured called with returnAsBlob:', returnAsBlob);
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let y = margin;

      const loadImageAsDataUrl = (url: string): Promise<string | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                console.warn('Could not get 2D context for canvas.');
                return resolve(null);
              }
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              resolve(dataUrl);
            } catch (e) {
              console.error(`Error processing image ${url}:`, e);
              resolve(null);
            }
          };
          img.onerror = (e) => {
            console.error(`Error loading image ${url}:`, e);
            resolve(null);
          };
          img.src = url;
        });
      };

      // Intentar primero local; si falla, fallback remoto (evita CORS en local)
      const leftLogoUrl = (await fetch('/left.png').then(r => r.ok ? '/left.png' : Promise.reject()).catch(() => 'https://www.webcincodev.com/blog/wp-content/uploads/2025/08/Captura-de-pantalla-2025-08-20-191158.png')) as string;
      const rightLogoUrl = (await fetch('/right.png').then(r => r.ok ? '/right.png' : Promise.reject()).catch(() => 'https://www.webcincodev.com/blog/wp-content/uploads/2025/08/Diseno-sin-titulo-27.png')) as string;
      const [leftLogo, rightLogo] = await Promise.all([
        loadImageAsDataUrl(leftLogoUrl),
        loadImageAsDataUrl(rightLogoUrl)
      ]);

      // Draw outer border like the sample
      doc.setDrawColor(0);
      doc.setLineWidth(0.4);
      doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

      // Header helper matching the sample
      const drawHeader = (withMeta: boolean) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        const headerHeight = 16; // slightly taller to avoid touching lines
        const leftLogoHeight = 15;
        const leftLogoWidth = 50;
        const rightLogoHeight = 15;
        const rightLogoWidth = 20;
        if (leftLogo) {
          doc.addImage(leftLogo, 'PNG', margin + 2, y + 2, leftLogoWidth, leftLogoHeight);
        }
        if (rightLogo) {
          doc.addImage(rightLogo, 'PNG', pageWidth - margin - rightLogoWidth - 2, y + 2, rightLogoWidth, rightLogoHeight);
        }
        // Title perfectly centered between logos
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('REPORTE DE VIAJES DIARIOS', pageWidth / 2, y + 9, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setFontSize(7);
        doc.text('RIF: J-50014920-4', pageWidth - margin - rightLogoWidth - 2 + rightLogoWidth / 2, y + rightLogoHeight + 3, { align: 'center' });
        // AREA box under title (left)
        const areaY = y + headerHeight;
        const areaW = 55;
        doc.setFont('helvetica', 'bold');
        doc.rect(margin + 2, areaY + 2, areaW, 6.5);
        doc.text('AREA', margin + 2 + areaW / 2, areaY + 6.3, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.rect(margin + 2, areaY + 8, areaW, 6.5);
        doc.text(reportData.area || '', margin + 2 + areaW / 2, areaY + 12.4, { align: 'center' });
        doc.setFontSize(10);
        y = areaY + 14;
        if (withMeta) {
          // Conductor / Unidad row
          const metaLeft = margin + 2;
          const metaRight = pageWidth - margin - 2;
          const rowH = 7; // more height to avoid line overlap
          doc.setFont('helvetica', 'bold');
          const rowY1 = y;
          const leftW = (metaRight - metaLeft) * 0.7;
          const rightW = (metaRight - metaLeft) * 0.3;
          doc.rect(metaLeft, rowY1, leftW, rowH);
        // place text slightly lower and inset from left border
          doc.text('CONDUCTOR:', metaLeft + 2, rowY1 + 4.6);
          doc.rect(metaLeft + leftW, rowY1, rightW, rowH);
          doc.text('UNIDAD:', metaLeft + leftW + 2, rowY1 + 4.6);
          // Values
          doc.setFont('helvetica', 'normal');
          // place values with safe padding from borders
          doc.text(String(reportData.conductor || ''), metaLeft + 28, rowY1 + 4.6);
          doc.text(String(reportData.unidad || ''), metaLeft + leftW + 22, rowY1 + 4.6);
          y += rowH;
          // DIA MES AÑO HORA AM PM row - widen cells and increase height for clarity
          const diaW = 16, mesW = 16, anoW = 18, horaW = 30, ampmW = 30;
          const rowY2 = y;
          const rowH2 = rowH + 2;
          // Labels
          doc.setFontSize(9);
          doc.rect(metaLeft, rowY2, diaW, rowH2); doc.text('DIA', metaLeft + diaW / 2, rowY2 + 4.6, { align: 'center' });
          doc.rect(metaLeft + diaW, rowY2, mesW, rowH2); doc.text('MES', metaLeft + diaW + mesW / 2, rowY2 + 4.6, { align: 'center' });
          doc.rect(metaLeft + diaW + mesW, rowY2, anoW, rowH2); doc.text('AÑO', metaLeft + diaW + mesW + anoW / 2, rowY2 + 4.6, { align: 'center' });
          doc.rect(metaLeft + diaW + mesW + anoW, rowY2, horaW, rowH2); doc.text('HORA', metaLeft + diaW + mesW + anoW + horaW / 2, rowY2 + 4.6, { align: 'center' });
          doc.rect(metaLeft + diaW + mesW + anoW + horaW, rowY2, ampmW, rowH2); doc.text('AM', metaLeft + diaW + mesW + anoW + horaW + ampmW / 2, rowY2 + 4.6, { align: 'center' });
          doc.rect(metaLeft + diaW + mesW + anoW + horaW + ampmW, rowY2, ampmW, rowH2); doc.text('PM', metaLeft + diaW + mesW + anoW + horaW + ampmW + ampmW / 2, rowY2 + 4.6, { align: 'center' });
          // Values centered and lowered a bit more (smaller numbers to avoid touching lines)
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.6);
          const valY = rowY2 + 7.0;
          doc.text(String(reportData.dia || ''), metaLeft + diaW / 2, valY, { align: 'center' });
          doc.text(String(reportData.mes || ''), metaLeft + diaW + mesW / 2, valY, { align: 'center' });
          doc.text(String(reportData.año || ''), metaLeft + diaW + mesW + anoW / 2, valY, { align: 'center' });
          doc.text(String(reportData.hora || ''), metaLeft + diaW + mesW + anoW + horaW / 2, valY, { align: 'center' });
          if (reportData.ampm.am) doc.text('X', metaLeft + diaW + mesW + anoW + horaW + ampmW / 2, valY, { align: 'center' });
          if (reportData.ampm.pm) doc.text('X', metaLeft + diaW + mesW + anoW + horaW + ampmW + ampmW / 2, valY, { align: 'center' });
          y += rowH2 + 2;
        }
      };
      // First page header with meta
      drawHeader(true);

      // Add route to the PDF, with text wrapping
      if (trips.length > 0 && trips[0].ruta) {
        const trip = trips[0];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const routeText = `Ruta: ${trip.ruta}`;
        const availableWidth = pageWidth - margin * 2 - 4;
        const splitText = doc.splitTextToSize(routeText, availableWidth);
        
        y += 2; // Lower the text a bit
        doc.text(splitText, margin + 2, y);
        const textHeight = splitText.length * 4; // 4mm per line
        y += textHeight;
        y += 4; // Margin after text
      }


      // Table header (match image columns, total 190mm)
      const columns = [
        { key: 'num', title: 'N°', width: 10 },
        { key: 'nombre', title: 'NOMBRE Y APELLIDO', width: 78 },
        { key: 'cedula', title: 'NRO DE CEDULA', width: 35 },
        { key: 'gerencia', title: 'GERENCIA', width: 42 },
        { key: 'hora', title: 'HORA', width: 25 }
      ];
      const totalWidth = columns.reduce((s, c) => s + c.width, 0); // 190
      const startX = (pageWidth - totalWidth) / 2;

      // Header row helper
      const drawTableHeader = () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.8); // slightly smaller to avoid touching borders
        let x = startX;
        const tableHeaderHeight = 7.5; // a bit taller for breathing room
        columns.forEach((c) => {
          doc.rect(x, y, c.width, tableHeaderHeight);
        // place text slightly lower and inset from left border
          doc.text(c.title, x + 1.2, y + 5.2);
          x += c.width;
        });
        y += tableHeaderHeight;
      };
      drawTableHeader();

      // Rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const minRows = 20;
      const rows = Array.from({ length: Math.max(trips.length, minRows) }, (_, idx) => {
        const trip = trips[idx];
        if (!trip) {
          return {
            num: String(idx + 1),
            nombre: '',
            cedula: '',
            gerencia: '',
            hora: ''
          };
        }
        const passenger = passengers.find(p => p.id === trip.passengerId);
        // Asegurarse de que se obtenga la gerencia correctamente
        const gerencia = passenger?.gerencia || trip.passengerGerencia || '';
        
        return {
          num: String(idx + 1),
          nombre: passenger?.name || trip.passengerName || '',
          cedula: passenger?.cedula || trip.passengerCedula || '',
          gerencia: gerencia,
          hora: format(new Date(trip.startTime), 'HH:mm', { locale: es })
        };
      });

      const lineHeight = 4.5; // mm per line for ~9pt font

      const drawRow = (r: Record<string, string>) => {
        // Prepare wrapped text per column
        const wrappedPerColumn = columns.map(c => {
          const content = String(r[c.key as keyof typeof r] || '');
          return doc.splitTextToSize(content, c.width - 2);
        });
        const linesPerColumn = wrappedPerColumn.map(lines => Math.max(lines.length, 1));
        const rowHeight = Math.max(...linesPerColumn) * lineHeight + 3; // more padding

        // Reserve space for signatures on a page only if it's the last page
        const limit = pageHeight - margin - 10;

        // Page break if needed
        if (y + rowHeight > limit) {
          doc.addPage();
          y = margin;
          drawHeader(false);
          drawTableHeader();
          doc.setFont('helvetica', 'normal');
        }
        // Draw cells and text
        let cx = startX;
        columns.forEach((c, idxCol) => {
          doc.rect(cx, y, c.width, rowHeight);
          const lines = wrappedPerColumn[idxCol];
          let ty = y + 5.6; // lower text a bit to avoid borders
          lines.forEach(line => {
            doc.text(line, cx + 1.2, ty, { maxWidth: c.width - 2.4 });
            ty += lineHeight;
          });
          cx += c.width;
        });
        y += rowHeight;
      };

      const rowsPerPage = 20;
      let counter = 0;
      for (let i = 0; i < rows.length; i++) {
        drawRow(rows[i]);
        counter++;
        if (counter === rowsPerPage && i < rows.length - 1) {
          // New page after 26 rows, continue table
          doc.addPage();
          y = margin;
          drawHeader(false);
          drawTableHeader();
          doc.setFont('helvetica', 'normal');
          counter = 0;
        }
      }

      // Signatures: always placed at end of the CURRENT (last) page.
      if (y > pageHeight - 50) {
        doc.addPage();
        y = margin;
        drawHeader(false);
      }
      y = Math.max(y + 6, pageHeight - 50);
      const sigWidth = (pageWidth - margin * 2 - 10) / 2;
      const sigHeight = 28;
      const contratista = signatures.find(s => s.type === 'contratista');
      const corporacion = signatures.find(s => s.type === 'corporacion');

      // Contratista box
      doc.rect(margin, y, sigWidth, sigHeight);
      doc.setFont('helvetica', 'bold');
      doc.text('Verificado por: CONTRATISTA CORPORACIÓN JF C.A', margin + 2, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${contratista?.name || 'RONALD MATA'}`, margin + 2, y + 12);
      doc.text(`CI: ${contratista?.ci || '20.764.490'}`, margin + 2, y + 18);
      doc.text(`Cargo: ${contratista?.cargo || 'SUPERVISOR DE OPERACIONES'}`, margin + 2, y + 24);

      // Corporación box
      const rightX = margin + sigWidth + 10;
      doc.rect(rightX, y, sigWidth, sigHeight);
      doc.setFont('helvetica', 'bold');
      doc.text('Verificado por: PETROBOSCAN, S.A.', rightX + 2, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${corporacion?.name || 'PATRICIA CHAVEZ'}`, rightX + 2, y + 12);
      doc.text(`CI: ${corporacion?.ci || '19.408.187'}`, rightX + 2, y + 18);
      doc.text(`Cargo: ${corporacion?.cargo || 'SUPERVISOR DE TRANSPORTE'}`, rightX + 2, y + 24);

      const pdfBlob = doc.output('blob');

      if (returnAsBlob) {
        console.log('Returning PDF as blob, not saving to file.');
        return pdfBlob;
      }

      const fileName = `reporte_${reportData.conductor}_${reportData.dia}-${reportData.mes}-${reportData.año}.pdf`;
      console.log('Attempting to save PDF with fileName:', fileName);
      doc.save(fileName);
    } catch (error: any) {
      console.error('Error al generar o descargar el PDF estructurado:', error);
      alert(`Error al generar o descargar el PDF: ${error.message || error}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };


  const contratistaSignature = signatures.find(s => s.type === 'contratista');
  const corporacionSignature = signatures.find(s => s.type === 'corporacion');

  // Preparar datos de pasajeros para mostrar en la tabla
  const passengerRows = Array.from({ length: 20 }, (_, index) => {
    const trip = trips[index];
    if (trip) {
      const passenger = passengers.find(p => p.id === trip.passengerId);
      return {
        nombre: passenger?.name || trip.passengerName || '',
        cedula: passenger?.cedula || trip.passengerCedula || '',
        gerencia: passenger?.gerencia || '',
        ruta: trip.ruta || '',
        horaSalida: format(new Date(trip.startTime), 'HH:mm', { locale: es }),
        horaLlegada: trip.endTime ? format(new Date(trip.endTime), 'HH:mm', { locale: es }) : ''
      };
    }
    return { nombre: '', cedula: '', gerencia: '', horaSalida: '', horaLlegada: '' };
  });

  const downloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col modal-container">
        {/* Header del modal */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Vista Previa del Reporte</h2>
          </div>
          <div className="flex justify-end items-center p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  console.log('Download button clicked. Calling downloadPDFStructured.');
                  downloadPDFStructured();
                }}
                disabled={isGeneratingPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
                <span>{isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}</span>
              </button>
              <button
                onClick={shareViaWhatsApp}
                disabled={isGeneratingPDF || isSharing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M17.498 14.382v-.002c-.301-.15-1.767-.867-2.04-.966-.274-.101-.473-.15-.673.149-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.136-.135.298-.353.446-.523.15-.173.198-.296.298-.495.1-.198.05-.371-.025-.52-.075-.15-.672-1.62-.922-2.207-.24-.584-.487-.51-.672-.517-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.15.195 2.1 3.195 5.1 4.485.714.3 1.27.489 1.71.625.713.227 1.36.195 1.87.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.135-.27-.21-.57-.355m-5.446 7.443h-.016a9.87 9.87 0 01-5.031-1.379l-.36-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.723 1.471h.006c6.554 0 11.89-5.335 11.89-11.893 0-3.18-1.261-6.189-3.553-8.463"/>
                </svg>
                <span>{isSharing ? 'Compartiendo...' : 'Compartir'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido del reporte */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6">
          <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-6 min-h-[400px]" ref={reportRef}>
            <style dangerouslySetInnerHTML={{
              __html: `
                .reporte-content { 
                  font-family: Arial, sans-serif; 
                  color: #111; 
                  font-size: 13px;
                  line-height: 1.4;
                }
                .reporte-header { 
                  display: flex; 
                  justify-content: space-between; 
                  align-items: center; 
                  margin-bottom: 20px; 
                }
                .reporte-header img { 
                  object-fit: contain;
                }
                .logo-left img {
                  width: auto;
                  height: auto;
                  max-width: 200px;
                  max-height: 80px;
                }
                .logo-right img {
                  width: auto;
                  height: auto;
                  max-width: 100px;
                  max-height: 80px;
                }
                .logo-left, .logo-right {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  min-width: 100px;
                }
                .rif-text {
                  font-size: 7px;
                  font-weight: bold;
                  margin-top: 2px;
                  text-align: center;
                  line-height: 1.0;
                  max-width: 60px;
                  word-wrap: break-word;
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                }
                .reporte-header .title { 
                  text-align: center; 
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                }
                .reporte-header h1 { 
                  font-size: 22px; 
                  margin: 0; 
                  font-weight: bold;
                }
                .reporte-header .meta { 
                  margin-top: 6px; 
                  font-size: 14px; 
                }
                .reporte-table { 
                  border-collapse: collapse; 
                  width: 100%; 
                  margin: 15px 0; 
                  font-size: 13px;
                }
                .reporte-table th, .reporte-table td { 
                  border: 1px solid #000; 
                  padding: 6px; 
                  font-size: 13px; 
                  vertical-align: top;
                }
                .reporte-table th { 
                  background: #f0f0f0; 
                  text-align: center; 
                  font-weight: bold;
                }
        .reporte-input, .reporte-textarea { 
          width: 100%; 
          border: 1px solid #000; 
          font-family: inherit; 
          font-size: 13px; 
          padding: 4px; 
          box-sizing: border-box;
          background: white;
          border-radius: 2px;
        }
                .reporte-input:focus, .reporte-textarea:focus { 
                  outline: 2px solid #4a90e2; 
                  background: #eef6ff; 
                }
                .signatures { 
                  display: flex; 
                  gap: 20px; 
                  margin-top: 20px; 
                }
                .sig { 
                  flex: 1; 
                  border: 1px solid #ccc; 
                  padding: 10px; 
                  border-radius: 6px; 
                }
                .sig strong { 
                  display: inline-block; 
                  width: 90px; 
                }
                .checkboxes { 
                  display: flex; 
                  gap: 12px; 
                  align-items: center; 
                }
                .checkboxes label { 
                  display: flex; 
                  align-items: center; 
                  gap: 4px; 
                }
                .checkboxes input[type="checkbox"] {
                  width: 16px;
                  height: 16px;
                }
                @media print {
                  .reporte-input, .reporte-textarea { 
                    border: 1px solid #000; 
                    background: white; 
                  }
                  .checkboxes input { 
                    transform: scale(1.2); 
                  }
                }
              `
            }} />
            
            <div className="reporte-content">
              <div className="mb-3 text-xs text-gray-600">
                Vista previa generada • Viajes en período: {trips.length}
              </div>
              <div className="reporte-header">
                <div className="logo-left">
                  <img
                    src="/left.png"
                    alt="Logo Izquierdo"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://www.webcincodev.com/blog/wp-content/uploads/2025/08/Captura-de-pantalla-2025-08-20-191158.png';
                    }}
                  />
                </div>
                <div className="title">
                  <h1>REPORTE DE VIAJES DIARIOS</h1>
                  <div className="meta">Área: {reportData.area || ''}</div>
                </div>
                <div className="logo-right">
                  <img
                    src="/right.png"
                    alt="Logo Derecho"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://www.webcincodev.com/blog/wp-content/uploads/2025/08/Diseno-sin-titulo-27.png';
                    }}
                  />
                  <div className="rif-text">RIF: J-50014920-4</div>
                </div>
              </div>

              <table className="reporte-table">
                <tbody>
                  <tr>
                    <th style={{width:'18%'}}>Conductor</th>
                    <td>
                      <input 
                        type="text" 
                        className="reporte-input"
                        value={reportData.conductor}
                        onChange={(e) => handleInputChange('conductor', e.target.value)}
                        placeholder="Nombre del conductor"
                      />
                    </td>
                    <th style={{width:'12%'}}>Unidad</th>
                    <td>
                      <input 
                        type="text" 
                        className="reporte-input"
                        value={reportData.unidad}
                        onChange={(e) => handleInputChange('unidad', e.target.value)}
                        placeholder="Unidad"
                      />
                    </td>
                  </tr>
                  {trips.length > 0 && trips[0].ruta && (
                    <tr>
                      <th>Ruta</th>
                      <td colSpan={3}>
                        <input
                          type="text"
                          className="reporte-input"
                          value={trips[0].ruta}
                          readOnly
                        />
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th>Día</th>
                    <td>
                      <input 
                        type="number" 
                        className="reporte-input"
                        min="1" 
                        max="31"
                        value={reportData.dia}
                        onChange={(e) => handleInputChange('dia', e.target.value)}
                      />
                    </td>
                    <th>Mes</th>
                    <td>
                      <input 
                        type="number" 
                        className="reporte-input"
                        min="1" 
                        max="12"
                        value={reportData.mes}
                        onChange={(e) => handleInputChange('mes', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>Año</th>
                    <td>
                      <input 
                        type="number" 
                        className="reporte-input"
                        min="2000" 
                        max="2100"
                        value={reportData.año}
                        onChange={(e) => handleInputChange('año', e.target.value)}
                      />
                    </td>
                    <th>Hora</th>
                    <td>
                      <input 
                        type="time" 
                        className="reporte-input"
                        value={reportData.hora}
                        onChange={(e) => handleInputChange('hora', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>AM/PM</th>
                    <td colSpan={3}>
                      <div className="checkboxes">
                        <label>
                          <input 
                            type="checkbox" 
                            checked={reportData.ampm.am}
                            onChange={(e) => handleInputChange('am', e.target.checked)}
                          /> AM
                        </label>
                        <label>
                          <input 
                            type="checkbox" 
                            checked={reportData.ampm.pm}
                            onChange={(e) => handleInputChange('pm', e.target.checked)}
                          /> PM
                        </label>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="reporte-table-alt">
                <thead>
                  <tr>
                    <th style={{width: '25%'}}>Pasajero</th>
                    <th style={{width: '15%'}}>Cédula</th>
                    <th style={{width: '20%'}}>Gerencia</th>
                    <th style={{width: '20%'}}>Ruta</th>
                    <th style={{width: '10%'}}>H. Salida</th>
                    <th style={{width: '10%'}}>H. Llegada</th>
                  </tr>
                </thead>
                <tbody>
                  {passengerRows && passengerRows.map((row, index) => (
                    <tr key={index}>
                      <td><input type="text" className="reporte-input" value={row.nombre} onChange={(e) => handlePassengerRowChange(index, 'nombre', e.target.value)} /></td>
                      <td><input type="text" className="reporte-input" value={row.cedula} onChange={(e) => handlePassengerRowChange(index, 'cedula', e.target.value)} /></td>
                      <td><input type="text" className="reporte-input" value={row.gerencia} onChange={(e) => handlePassengerRowChange(index, 'gerencia', e.target.value)} /></td>
                      <td><input type="text" className="reporte-input" value={row.ruta} onChange={(e) => handlePassengerRowChange(index, 'ruta', e.target.value)} /></td>
                      <td><input type="text" className="reporte-input" value={row.horaSalida} onChange={(e) => handlePassengerRowChange(index, 'horaSalida', e.target.value)} /></td>
                      <td><input type="text" className="reporte-input" value={row.horaLlegada} onChange={(e) => handlePassengerRowChange(index, 'horaLlegada', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="signatures">
                <div className="sig">
                  <div><strong>Verificado por:</strong>  CONTRATISTA CORPORACIÓN JF C.A</div>
                  <div><strong>Nombre:</strong> {contratistaSignature?.name || 'RONALD MATA'}</div>
                  <div><strong>CI:</strong> {contratistaSignature?.ci || '19.408.187'}</div>
                  <div><strong>Cargo:</strong> {contratistaSignature?.cargo || 'SUPERVISOR DE OPERACIONES'}</div>
                </div>

                <div className="sig">
                  <div><strong>Verificado por:</strong> PETROBOSCAN, S.A. </div>
                  <div><strong>Nombre:</strong> {corporacionSignature?.name || 'PATRICIA CHAVEZ'}</div>
                  <div><strong>CI:</strong> {corporacionSignature?.ci || '19.408.187'}</div>
                  <div><strong>Cargo:</strong> {corporacionSignature?.cargo || 'SUPERVISOR DE TRANSPORTE'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="border-t border-gray-200 p-2 sm:p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-sm text-gray-600">
              <p>Vista previa del reporte de viajes diarios</p>
              <p className="text-xs">Los campos son editables para personalizar el reporte</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;