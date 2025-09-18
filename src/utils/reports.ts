import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Trip, Passenger, Conductor } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { storage } from './storage';

// Función para generar reporte en formato oficial mejorado
export const generateOfficialReport = (
  trips: Trip[],
  passengers: Passenger[],
  conductors: Conductor[],
  dateRange: string
) => {
  const reportData: any[] = [];
  
  // ENCABEZADO PRINCIPAL - FORMATO CORPORATIVO MEJORADO
  reportData.push([
    'CORPORACIÓN JF C.A.',
    '',
    '',
    '',
    '',
    'CONTROL DE TRANSPORTE',
    '',
    '',
    '',
    'FORMULARIO LISTÍN'
  ]);
  
  reportData.push([
    'RIF: J-00000000-0',
    '',
    '',
    '',
    '',
    'DE PERSONAL',
    '',
    '',
    '',
    ''
  ]);
  
  // Información del período
  reportData.push([
    `PERÍODO: ${dateRange.toUpperCase()}`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);
  
  reportData.push([
    `FECHA DE EMISIÓN: ${format(new Date(), 'dd/MM/yyyy', { locale: es })}`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);
  
  // Líneas de separación
  reportData.push(['', '', '', '', '', '', '', '', '', '']);
  reportData.push(['', '', '', '', '', '', '', '', '', '']);
  
  // ENCABEZADOS DE LA TABLA PRINCIPAL
  reportData.push([
    'FECHA',
    'CONDUCTOR',
    'C.I. CONDUCTOR',
    'PLACA',
    'RUTA ASIGNADA',
    'PASAJERO',
    'C.I. PASAJERO',
    'GERENCIA/ÁREA',
    'HORA SALIDA',
    'HORA LLEGADA'
  ]);
  
  // DATOS DE LOS VIAJES - ORDENADOS POR FECHA Y CONDUCTOR
  const sortedTrips = trips.sort((a, b) => {
    const dateA = new Date(a.startTime);
    const dateB = new Date(b.startTime);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return a.conductorName.localeCompare(b.conductorName);
  });
  
  sortedTrips.forEach(trip => {
    const passenger = passengers.find(p => p.id === trip.passengerId);
    const conductor = conductors.find(c => c.id === trip.conductorId);
    
    reportData.push([
      format(new Date(trip.startTime), 'dd/MM/yyyy', { locale: es }),
      conductor?.name || trip.conductorName,
      conductor?.cedula || '',
      conductor?.placa || '',
      trip.ruta,
      passenger?.name || trip.passengerName,
      passenger?.cedula || trip.passengerCedula,
      passenger?.gerencia || '',
      format(new Date(trip.startTime), 'HH:mm', { locale: es }),
      trip.endTime ? format(new Date(trip.endTime), 'HH:mm', { locale: es }) : 'EN CURSO'
    ]);
  });
  
  // SECCIÓN DE RESUMEN ESTADÍSTICO
  reportData.push(['', '', '', '', '', '', '', '', '', '']);
  reportData.push(['', '', '', '', '', '', '', '', '', '']);
  
  reportData.push([
    'RESUMEN ESTADÍSTICO DEL PERÍODO',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);
  
  reportData.push([
    'TOTAL DE VIAJES REGISTRADOS:',
    trips.length.toString(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);
  
  reportData.push([
    'VIAJES COMPLETADOS:',
    trips.filter(t => t.status === 'finalizado').length.toString(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);
  
  reportData.push([
    'VIAJES EN CURSO:',
    trips.filter(t => t.status === 'en_curso').length.toString(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);
  
  // ESTADÍSTICAS POR CONDUCTOR
  const conductorStats = conductors.map(conductor => {
    const conductorTrips = trips.filter(t => t.conductorId === conductor.id);
    return {
      name: conductor.name,
      cedula: conductor.cedula,
      placa: conductor.placa,
      area: conductor.area || 'N/A',
      totalTrips: conductorTrips.length,
      finishedTrips: conductorTrips.filter(t => t.status === 'finalizado').length
    };
  }).filter(stat => stat.totalTrips > 0);
  
  if (conductorStats.length > 0) {
    reportData.push(['', '', '', '', '', '', '', '', '', '']);
    reportData.push([
      'ESTADÍSTICAS POR CONDUCTOR',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    reportData.push([
      'CONDUCTOR',
      'C.I.',
      'PLACA',
      'ÁREA',
      'TOTAL VIAJES',
      'COMPLETADOS',
      'EFICIENCIA (%)',
      '',
      '',
      ''
    ]);
    
    conductorStats.forEach(stat => {
      const efficiency = stat.totalTrips > 0 ? Math.round((stat.finishedTrips / stat.totalTrips) * 100) : 0;
      reportData.push([
        stat.name,
        stat.cedula,
        stat.placa,
        stat.area,
        stat.totalTrips.toString(),
        stat.finishedTrips.toString(),
        `${efficiency}%`,
        '',
        '',
        ''
      ]);
    });
  }
  
  // SECCIÓN DE FIRMAS Y VERIFICACIÓN CON FIRMAS REGISTRADAS
  reportData.push(['', '', '', '', '', '', '', '', '', '']);
  reportData.push(['', '', '', '', '', '', '', '', '', '']);
  
  reportData.push([
    'VERIFICACIÓN Y FIRMAS RESPONSABLES',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]);
  
  // Obtener firmas del storage
  const signatures = storage.getSignatures();
  const contratistaSignatures = signatures.filter(s => s.type === 'contratista');
  const corporacionSignatures = signatures.filter(s => s.type === 'corporacion');
  
  reportData.push(['', '', '', '', '', '', '', '', '', '']);
  
  // Firmas de verificación con datos registrados
  if (contratistaSignatures.length > 0 || corporacionSignatures.length > 0) {
    reportData.push([
      'VERIFICADO POR CONTRATISTA',
      '',
      '',
      '',
      'VERIFICADO POR PETROBOSCAN, S.A.',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    reportData.push([
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    const contratistaSign = contratistaSignatures.length > 0 ? contratistaSignatures[0] : null;
    const corporacionSign = corporacionSignatures.length > 0 ? corporacionSignatures[0] : null;
    
    reportData.push([
      contratistaSign ? `NOMBRE: ${contratistaSign.name}` : 'NOMBRE: ________________',
      '',
      '',
      '',
      corporacionSign ? `NOMBRE: ${corporacionSign.name}` : 'NOMBRE: ________________',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    reportData.push([
      contratistaSign ? `C.I.: ${contratistaSign.ci}` : 'C.I.: ________________',
      '',
      '',
      '',
      corporacionSign ? `C.I.: ${corporacionSign.ci}` : 'C.I.: ________________',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    reportData.push([
      contratistaSign ? `CARGO: ${contratistaSign.cargo}` : 'CARGO: ________________',
      '',
      '',
      '',
      corporacionSign ? `CARGO: ${corporacionSign.cargo}` : 'CARGO: ________________',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    reportData.push([
      'FIRMA: ________________',
      '',
      '',
      '',
      'FIRMA: ________________',
      '',
      '',
      '',
      '',
      ''
    ]);
  } else {
    reportData.push([
      'VERIFICADO POR CONTRATISTA',
      '',
      '',
      '',
      'VERIFICADO POR PETROBOSCAN, S.A.',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    reportData.push([
      'NOMBRE: ________________',
      '',
      '',
      '',
      'NOMBRE: ________________',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    reportData.push([
      'C.I.: ________________',
      '',
      '',
      '',
      'C.I.: ________________',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    reportData.push([
      'CARGO: ________________',
      '',
      '',
      '',
      'CARGO: ________________',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    reportData.push([
      'FIRMA: ________________',
      '',
      '',
      '',
      'FIRMA: ________________',
      '',
      '',
      '',
      '',
      ''
    ]);
  }
  
  // FOOTER OFICIAL
  reportData.push(['', '', '', '', '', '', '', '', '', '']);
  reportData.push([
    `DOCUMENTO GENERADO EL: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'PÁGINA 1 DE 1'
  ]);
  
  // Crear el archivo Excel
  const ws = XLSX.utils.aoa_to_sheet(reportData);
  
  // CONFIGURAR ANCHOS DE COLUMNA OPTIMIZADOS
  const colWidths = [
    { wch: 12 },  // FECHA
    { wch: 35 },  // CONDUCTOR
    { wch: 18 },  // C.I. CONDUCTOR
    { wch: 10 },  // PLACA
    { wch: 40 },  // RUTA ASIGNADA
    { wch: 35 },  // PASAJERO
    { wch: 18 },  // C.I. PASAJERO
    { wch: 25 },  // GERENCIA/ÁREA
    { wch: 12 },  // HORA SALIDA
    { wch: 12 }   // HORA LLEGADA
  ];
  
  ws['!cols'] = colWidths;
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Control Transporte Oficial');
  
  // GENERAR NOMBRE DE ARCHIVO OFICIAL
  const fileName = `Formulario_Listin_Control_Transporte_${dateRange.replace(/\s/g, '_').replace(/[()]/g, '')}_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`;
  
  XLSX.writeFile(wb, fileName);
};

// Función para generar PDF en formato corporativo mejorado
export const generateOfficialPDFReport = (
  trips: Trip[],
  passengers: Passenger[],
  conductors: Conductor[],
  dateRange: string,
  reportId: string,
  contratistaSign: Signature | null,
  corporacionSign: Signature | null
) => {
  const doc = new jsPDF();
  
  // Configurar márgenes y dimensiones
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = 20;
  
  // COLORES CORPORATIVOS (Verde y Azul Oscuro)
  const primaryColor = [0, 124, 219]; // Azul corporativo
  const secondaryColor = [34, 139, 34]; // Verde corporativo
  const darkBlue = [25, 42, 86]; // Azul oscuro
  
  // HEADER CORPORATIVO MEJORADO CON DISEÑO MODERNO
  doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Logo y título principal
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CORPORACIÓN JF C.A.', margin, 15);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('RIF: J-00000000-0', margin, 22);
  
  // Título del documento en el lado derecho
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMULARIO LISTÍN', pageWidth - margin - 50, 15);
  doc.setFontSize(10);
  doc.text('', pageWidth - margin - 30, 22);
  
  yPosition = 45;
  
  // FRANJA VERDE DECORATIVA
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, yPosition - 5, pageWidth, 8, 'F');
  
  yPosition += 10;
  
  // TÍTULO PRINCIPAL CENTRADO CON ESTILO CORPORATIVO
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const title = 'CONTROL DE TRANSPORTE DE PERSONAL';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
  
  yPosition += 12;
  
  // INFORMACIÓN DEL PERÍODO CON DISEÑO MEJORADO
  doc.setFillColor(240, 248, 255);
  doc.rect(margin, yPosition - 5, contentWidth, 20, 'F');
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.rect(margin, yPosition - 5, contentWidth, 20);
  
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const periodInfo = `PERÍODO: ${dateRange.toUpperCase()}`;
  const periodWidth = doc.getTextWidth(periodInfo);
  doc.text(periodInfo, (pageWidth - periodWidth) / 2, yPosition + 3);
  
  // FECHA DE EMISIÓN
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const dateInfo = `FECHA DE EMISIÓN: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`;
  const dateWidth = doc.getTextWidth(dateInfo);
  doc.text(dateInfo, (pageWidth - dateWidth) / 2, yPosition + 10);
  
  yPosition += 25;
  
  // TABLA PRINCIPAL DE DATOS CON DISEÑO MEJORADO
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  // Fondo para encabezados con gradiente simulado
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, yPosition - 5, contentWidth, 12, 'F');
  
  // Bordes de encabezado
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition - 5, contentWidth, 12);
  
  // Definir anchos de columnas para PDF
  const colWidths = [20, 35, 25, 15, 45, 35, 25, 30];
  let xPos = margin;
  
  const headers = [
    'FECHA', 'CONDUCTOR', 'C.I. COND.', 'PLACA', 
    'RUTA', 'PASAJERO', 'C.I. PAS.', 'GERENCIA'
  ];
  
  // Escribir encabezados con texto blanco
  doc.setTextColor(255, 255, 255);
  headers.forEach((header, index) => {
    doc.text(header, xPos + 2, yPosition + 3);
    if (index < headers.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(xPos + colWidths[index], yPosition - 5, xPos + colWidths[index], yPosition + 7);
    }
    xPos += colWidths[index];
  });
  
  yPosition += 12;
  
  // DATOS DE LA TABLA CON ALTERNANCIA DE COLORES
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(50, 50, 50);
  
  trips.forEach((trip, index) => {
    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
      
      // Repetir encabezados en nueva página
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(margin, yPosition - 5, contentWidth, 12, 'F');
      doc.rect(margin, yPosition - 5, contentWidth, 12);
      
      xPos = margin;
      doc.setTextColor(255, 255, 255);
      headers.forEach((header, index) => {
        doc.text(header, xPos + 2, yPosition + 3);
        if (index < headers.length - 1) {
          doc.line(xPos + colWidths[index], yPosition - 5, xPos + colWidths[index], yPosition + 7);
        }
        xPos += colWidths[index];
      });
      
      yPosition += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(50, 50, 50);
    }
    
    const passenger = passengers.find(p => p.id === trip.passengerId);
    const conductor = conductors.find(c => c.id === trip.conductorId);
    
    // Fondo alternado para filas con colores corporativos
    if (index % 2 === 0) {
      doc.setFillColor(248, 252, 255);
      doc.rect(margin, yPosition - 3, contentWidth, 10, 'F');
    } else {
      doc.setFillColor(245, 255, 245);
      doc.rect(margin, yPosition - 3, contentWidth, 10, 'F');
    }
    
    // Bordes de fila
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPosition - 3, contentWidth, 10);
    
    xPos = margin;
    const rowData = [
      format(new Date(trip.startTime), 'dd/MM/yy', { locale: es }),
      (conductor?.name || trip.conductorName).substring(0, 18),
      conductor?.cedula || '',
      conductor?.placa || '',
      trip.ruta.substring(0, 22),
      (passenger?.name || trip.passengerName).substring(0, 18),
      passenger?.cedula || trip.passengerCedula,
      (passenger?.gerencia || '').substring(0, 15)
    ];
    
    rowData.forEach((data, index) => {
      doc.text(data, xPos + 1, yPosition + 2);
      if (index < rowData.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(xPos + colWidths[index], yPosition - 3, xPos + colWidths[index], yPosition + 7);
      }
      xPos += colWidths[index];
    });
    
    yPosition += 10;
  });
  
  // SECCIÓN DE FIRMAS CORPORATIVA MEJORADA
  yPosition += 20;
  
  if (yPosition > pageHeight - 120) {
    doc.addPage();
    yPosition = margin + 20;
  }
  
  // Franja decorativa para firmas
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, yPosition - 5, pageWidth, 5, 'F');
  yPosition += 10;
  
  // Título de sección de firmas con estilo corporativo
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  const firmasTitle = 'VERIFICACIÓN Y FIRMAS RESPONSABLES';
  const firmasTitleWidth = doc.getTextWidth(firmasTitle);
  doc.text(firmasTitle, (pageWidth - firmasTitleWidth) / 2, yPosition);
  
  yPosition += 20;
  
  // Obtener firmas del storage
  const signatures = storage.getSignatures();
  const contratistaSignatures = signatures.filter(s => s.type === 'contratista');
  const corporacionSignatures = signatures.filter(s => s.type === 'corporacion');
  
  // Configurar posiciones para firmas lado a lado con cajas decorativas
  const leftX = margin + 10;
  const rightX = pageWidth / 2 + 10;
  
  // Caja decorativa para firma de Contratista
  doc.setFillColor(255, 248, 240);
  doc.setDrawColor(255, 140, 0);
  doc.setLineWidth(1);
  doc.rect(leftX - 5, yPosition - 5, 85, 60, 'FD');
  
  // Caja decorativa para firma de Corporación
  doc.setFillColor(240, 248, 255);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(rightX - 5, yPosition - 5, 85, 60, 'FD');
  
  // Firma de Contratista (izquierda)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 140, 0);
  doc.text('VERIFICADO POR CONTRATISTA', leftX, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  
  if (contratistaSignatures.length > 0) {
    const contratistaSign = contratistaSignatures[0];
    doc.text(`NOMBRE: ${contratistaSign.name}`, leftX, yPosition);
    yPosition += 6;
    doc.text(`C.I.: ${contratistaSign.ci}`, leftX, yPosition);
    yPosition += 6;
    doc.text(`CARGO: ${contratistaSign.cargo}`, leftX, yPosition);
  } else {
    doc.text('NOMBRE: ________________________________', leftX, yPosition);
    yPosition += 6;
    doc.text('C.I.: ________________________________', leftX, yPosition);
    yPosition += 6;
    doc.text('CARGO: ________________________________', leftX, yPosition);
  }
  
  yPosition += 15;
  doc.setDrawColor(255, 140, 0);
  doc.setLineWidth(1);
  doc.line(leftX, yPosition, leftX + 70, yPosition);
  yPosition += 5;
  doc.setFontSize(8);
  doc.setTextColor(255, 140, 0);
  doc.text('FIRMA', leftX + 30, yPosition);
  
  // Resetear posición Y para firma derecha
  yPosition -= 35;
  
  // Firma de Corporación JF (derecha)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('VERIFICADO POR PETROBOSCAN, S.A.', rightX, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  
  if (corporacionSignatures.length > 0) {
    const corporacionSign = corporacionSignatures[0];
    doc.text(`NOMBRE: ${corporacionSign.name}`, rightX, yPosition);
    yPosition += 6;
    doc.text(`C.I.: ${corporacionSign.ci}`, rightX, yPosition);
    yPosition += 6;
    doc.text(`CARGO: ${corporacionSign.cargo}`, rightX, yPosition);
  } else {
    doc.text('NOMBRE: ________________________________', rightX, yPosition);
    yPosition += 6;
    doc.text('C.I.: ________________________________', rightX, yPosition);
    yPosition += 6;
    doc.text('CARGO: ________________________________', rightX, yPosition);
  }
  
  yPosition += 15;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.line(rightX, yPosition, rightX + 70, yPosition);
  yPosition += 5;
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FIRMA', rightX + 30, yPosition);
  
  // FOOTER CORPORATIVO MEJORADO
  yPosition = pageHeight - 20;
  
  // Franja inferior decorativa
  doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.rect(0, yPosition - 5, pageWidth, 25, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Documento oficial - Corporación JF C.A. - Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
    margin,
    yPosition + 5
  );
  
  doc.setFontSize(6);
  doc.setTextColor(200, 200, 200);
  doc.text('Sistema de Reportes JF - Versión 1.0.0', pageWidth - margin - 50, yPosition + 12);
  
  // Generar nombre de archivo oficial
  const fileName = `Formulario_Listin_Control_Transporte_${reportId}_${dateRange.replace(/\s/g, '_').replace(/[()]/g, '')}_${format(new Date(), 'ddMMyyyy_HHmm')}.pdf`;
  
  doc.save(fileName);
};

// Mantener funciones existentes para compatibilidad
export const generateGoogleSheetsReport = generateOfficialReport;
export const generatePDFReport = generateOfficialPDFReport;
export const generateExcelReport = generateOfficialReport;

export const generateDetailedExcelReport = (
  trips: Trip[],
  passengers: Passenger[],
  conductors: Conductor[],
  dateRange: string
) => {
  const data = trips.map((trip, index) => {
    const passenger = passengers.find(p => p.id === trip.passengerId);
    const conductor = conductors.find(c => c.id === trip.conductorId);
    
    return {
      'No.': index + 1,
      'Fecha': format(new Date(trip.startTime), 'dd/MM/yyyy', { locale: es }),
      'Hora Inicio': format(new Date(trip.startTime), 'HH:mm', { locale: es }),
      'Conductor': conductor?.name || trip.conductorName,
      'C.I. Conductor': conductor?.cedula || '',
      'Placa': conductor?.placa || '',
      'Área': conductor?.area || 'N/A',
      'Ruta Asignada': trip.ruta,
      'Pasajero': passenger?.name || trip.passengerName,
      'C.I. Pasajero': passenger?.cedula || trip.passengerCedula,
      'Gerencia': passenger?.gerencia || '',
      'Hora Fin': trip.endTime ? format(new Date(trip.endTime), 'HH:mm', { locale: es }) : 'EN CURSO',
      'Estado': trip.status === 'finalizado' ? 'COMPLETADO' : 'EN CURSO',
      'Duración (min)': trip.endTime ? 
        Math.round((new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime()) / (1000 * 60)) : 
        'N/A'
    };
  });
  
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Configurar anchos de columna
  const colWidths = [
    { wch: 5 },   // No.
    { wch: 12 },  // Fecha
    { wch: 10 },  // Hora Inicio
    { wch: 30 },  // Conductor
    { wch: 15 },  // C.I. Conductor
    { wch: 8 },   // Placa
    { wch: 20 },  // Área
    { wch: 35 },  // Ruta
    { wch: 30 },  // Pasajero
    { wch: 15 },  // C.I. Pasajero
    { wch: 20 },  // Gerencia
    { wch: 10 },  // Hora Fin
    { wch: 12 },  // Estado
    { wch: 12 }   // Duración
  ];
  
  ws['!cols'] = colWidths;
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Detalle Completo');
  
  const fileName = `Reporte_Detallado_Transporte_${dateRange.replace(/\s/g, '_')}_${format(new Date(), 'ddMMyyyy')}.xlsx`;
  
  XLSX.writeFile(wb, fileName);
};

export const sendReportToAdmin = async (reportData: any, reportType: 'pdf' | 'excel', adminEmail: string) => {
  console.log(`Simulating sending ${reportType} report to admin: ${adminEmail}`);
  console.log('Report Data:', reportData);
  // In a real application, you would send this data to a backend API
  // For example: 
  // try {
  //   const response = await fetch('/api/send-report', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ reportData, reportType, adminEmail })
  //   });
  //   if (!response.ok) throw new Error('Failed to send report');
  //   console.log('Report sent successfully!');
  // } catch (error) {
  //   console.error('Error sending report:', error);
  // }
  alert(`Reporte ${reportType.toUpperCase()} enviado al administrador: ${adminEmail}`);
};

// Función para generar reporte en formato Excel personalizado
export const generateCustomExcelReport = (
  trips: Trip[],
  passengers: Passenger[],
  conductors: Conductor[],
  dateRange: string
) => {
  const reportData: any[] = [];

  // Título del reporte
  reportData.push(['CONTROL DE TRANSPORTE DE PERSONAL']);
  reportData.push([]); // Fila vacía

  // Encabezados de la tabla
  reportData.push([
    'CONDUCTOR',
    'UNIDAD',
    'RUTA ASIGNADA',
    'PASAJERO',
    'C.I. PASAJERO',
    'GERENCIA/ÁREA',
    'HORA SALIDA',
    'HORA LLEGADA'
  ]);

  // Datos de los viajes
  trips.forEach(trip => {
    const passenger = passengers.find(p => p.id === trip.passengerId);
    const conductor = conductors.find(c => c.id === trip.conductorId);

    reportData.push([
      conductor?.name || trip.conductorName,
      conductor?.placa || '', // UNIDAD es la placa
      trip.ruta,
      passenger?.name || trip.passengerName,
      passenger?.cedula || trip.passengerCedula,
      passenger?.gerencia || '',
      format(new Date(trip.startTime), 'HH:mm', { locale: es }),
      trip.endTime ? format(new Date(trip.endTime), 'HH:mm', { locale: es }) : 'EN CURSO'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(reportData);

  // Anchos de columna
  const colWidths = [
    { wch: 35 },  // CONDUCTOR
    { wch: 15 },  // UNIDAD
    { wch: 40 },  // RUTA ASIGNADA
    { wch: 35 },  // PASAJERO
    { wch: 18 },  // C.I. PASAJERO
    { wch: 25 },  // GERENCIA/ÁREA
    { wch: 12 },  // HORA SALIDA
    { wch: 12 }   // HORA LLEGADA
  ];
  ws['!cols'] = colWidths;

  // Unir celdas para el título
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Control Transporte');

  const fileName = `Control_Transporte_${dateRange.replace(/\s/g, '_').replace(/[()]/g, '')}_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`;

  XLSX.writeFile(wb, fileName);
};