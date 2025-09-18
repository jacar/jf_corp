import { Conductor } from '../types';

export const defaultConductors: Omit<Conductor, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    numeroUnidad: '281',
    area: 'ADMINISTRATIVA RICHMOND',
    nombre: 'CARLOS NAVEDA',
    ruta: 'LA LAGUNITA - LOS PATRULLEROS - RICHMOND'
  },
  {
    numeroUnidad: '292',
    area: '',
    nombre: 'ALBERTO ROMERO',
    ruta: 'LOS MODINES - SANTA FE - RICHMOND'
  },
  {
    numeroUnidad: '348',
    area: '',
    nombre: 'LINO ACOSTA',
    ruta: 'CORE 3 - PICOLA - SAN JACINTO - RICHMOND'
  },
  {
    numeroUnidad: '280',
    area: '',
    nombre: 'LEANDRO MARTINEZ',
    ruta: '18 OCTUBRE - RICHMOND'
  },
  {
    numeroUnidad: '278',
    area: '',
    nombre: 'JOSE GARCIA',
    ruta: 'TAMARE - PUNTA GORDA - CABIMAS - RICHMOND'
  },
  {
    numeroUnidad: '274',
    area: '',
    nombre: 'LEOBALDO MORAN',
    ruta: 'EL PINAR - LOS HATICOS - RICHMOND'
  },
  {
    numeroUnidad: '320',
    area: '',
    nombre: 'JOSUE PAZ',
    ruta: 'CONCEPCION - SOL AMADO - RICHMOND'
  },
  {
    numeroUnidad: '279',
    area: '',
    nombre: 'RICARDO EVERON',
    ruta: 'SAN FRANCISCO - RICHMOND'
  },
  {
    numeroUnidad: '297',
    area: 'ADMINSTRATIVA CAMPO BOSCAN',
    nombre: 'YENDRY VILCHEZ',
    ruta: 'LAGUNITA - CB'
  },
  {
    numeroUnidad: '296',
    area: '',
    nombre: 'HECTOR AVILA',
    ruta: 'MCBO - CORE 3 - CB'
  },
  {
    numeroUnidad: '290',
    area: '',
    nombre: 'DANIEL BRICEÑO',
    ruta: 'SAN FCO - EL PINAR - CB'
  },
  {
    numeroUnidad: '291',
    area: '',
    nombre: 'JOSE MONTIEL',
    ruta: 'SAN FCO - EL EL BAJO - CB'
  },
  {
    numeroUnidad: '293',
    area: 'OPERACIONAL',
    nombre: 'EDGAR VALIENTE',
    ruta: 'EL PINAR - RICHMOND - SAN FCO - CAMPO BOSCAN'
  },
  {
    numeroUnidad: '274',
    area: '',
    nombre: 'OLIVER ATENCIO',
    ruta: 'SAN FRANCISCO - EL BAJO - CAMPO BOSCAN'
  },
  {
    numeroUnidad: '295',
    area: '',
    nombre: 'ATILIO CAMPOS',
    ruta: 'MCBO - NORTE - OESTE (CORE 3) - CAMPO BOSCAN'
  },
  {
    numeroUnidad: '294',
    area: '',
    nombre: 'JENNER BRICEÑO',
    ruta: 'MCBO - SUR NORTE - (LAGUNITA) - CAMPO BOSCAN'
  },
  {
    numeroUnidad: '293',
    area: 'OPERACIONAL',
    nombre: 'JEAN PERCHE',
    ruta: 'EL PINAR - RICHMOND - SAN FCO - CAMPO BOSCAN'
  },
  {
    numeroUnidad: '274',
    area: '',
    nombre: 'ENYERBETH ORDOÑEZ',
    ruta: 'SAN FRANCISCO - EL BAJO - CAMPO BOSCAN'
  },
  {
    numeroUnidad: '295',
    area: '',
    nombre: 'JOSE VILLALOBOS',
    ruta: 'MCBO - NORTE - OESTE (CORE 3) - CAMPO BOSCAN'
  },
  {
    numeroUnidad: '294',
    area: '',
    nombre: 'JUAN HERNANDEZ',
    ruta: 'MCBO - SUR NORTE - (LAGUNITA) - CAMPO BOSCAN'
  },
  {
    numeroUnidad: '276',
    area: '',
    nombre: 'JOSE GONZALEZ',
    ruta: 'LA VILLA - CAMPO BOSCAN'
  },
  {
    numeroUnidad: '276',
    area: '',
    nombre: 'JIMMY PALENCIA',
    ruta: 'LA VILLA - CAMPO BOSCAN'
  },
  {
    numeroUnidad: '293',
    area: '',
    nombre: 'MARIANO CONTRERAS',
    ruta: 'EL PINAR - RICHMOND - SAN FCO - CAMPO BOSCAN'
  }
];

export function generateDefaultConductors(): Conductor[] {
  return defaultConductors.map((conductor, index) => ({
    ...conductor,
    id: `cond-${index + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}