/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Pedido {
  ticket: string; // Col A
  fecha: string; // Col B
  tienda: string; // Col C
  cliente: string; // Col D
  tel: string; // Col E
  dir: string; // Col F
  ref: string; // Col G
  tipo: string; // Col H (Todo el Ticket | Entrega Parcial)
  obs: string; // Col I
  estatus: 'CARGADO' | 'PENDIENTE' | 'EN PROCESO / COMPRA' | 'PARCIAL' | 'ENTREGA INMEDIATA' | 'REVISADO' | 'PROGRAMADO' | 'EN RUTA' | 'FINALIZADO'; // Col J
  comprasObs?: string; // Col K
  comprasUbic?: string; // Col L
  chofer?: string; // Col M
  dateenv?: string; // Col N (dd-MMM-yyyy or yyyy-MM-dd)
  orden?: number | null; // Col O
  obsLogistica?: string; // Col P
  lat?: number | string; // Col Q
  lng?: number | string; // Col R
  receptor?: string; // Col S
  fotoUrl?: string; // Col T (Foto Ticket URL)
  fotos?: string[]; // Array of multiple delivery photo URLs or base64s
  dateped?: string; // formatted date for admin view
  numInt?: string;
  fechaFinalizado?: string;
  captura?: string; // Screenshot capture file (base64)
  comentarioChofer?: string; // Driver final comments
}

export interface Recoleccion {
  id: string; // Col A (REC-XXX)
  solicitante: 'COMPRAS' | 'LOGISTICA'; // Col B
  proveedor: string; // Col C
  direccion: string; // Col D
  referencias: string; // Col E
  material: string; // Col F
  fechaDisponible: string; // Col G (yyyy-MM-dd)
  chofer?: string; // Col H
  fechaReal?: string; // Col I
  estatus: 'SOLICITADO' | 'PENDIENTE' | 'REVISADO' | 'PROGRAMADO' | 'EN RUTA' | 'RECOLECTADO' | 'FINALIZADO'; // Col J
  fechaAlta?: string; // Col K
  orden?: number | null; // Col L
  lat?: number | string; // Col M
  lng?: number | string; // Col N
  fotoUrl?: string; // Optional single photo
  fotos?: string[]; // Optional array of multiple photos
  fechaFinalizado?: string;
  captura?: string; // Screenshot capture file (base64)
  comentarioChofer?: string; // Driver final comments
}

export interface KilometrajeRegistro {
  id: string; // `${chofer}_${fecha}`
  chofer: string;
  fecha: string;
  foto: string; // Odometer photo (base64)
  fechaAlta: string;
  unidadId?: string; // vehicle linked to this reading
  kmValue?: number; // numeric mileage reading
}

export interface UnidadConfig {
  id: string; // e.g. "Camioneta 1"
  placa: string;
  rendimiento: number; // km/L
  combustiblePrecio: number; // Fuel price per Liter
}

export interface ChoferConfig {
  id: string;
  nombre: string;
  lat?: number;
  lng?: number;
  ultimaUbicacion?: string;
}

export interface ProveedorConfig {
  nombre: string;
  direccion: string;
  referencia: string;
}

export interface TiendaConfig {
  nombre: string;
  direccion: string;
  siglas: string;
}

export interface LogRuta {
  ticketId: string;
  chofer: string;
  horaInicio?: string;
  horaFin?: string;
  ubicacionInicio?: string;
  ubicacionFin?: string;
  recibio?: string;
}

export interface HistorialEntrega extends Pedido {
  fechaArchivado: string;
}

export interface HistorialRecoleccion extends Recoleccion {
  fechaArchivado: string;
}

export interface PrecioCombustibleMes {
  mes: string; // e.g. "2026-07"
  nombreMes: string; // e.g. "Julio 2026"
  precio: number; // e.g. 24.50
  fuente?: string;
  actualizadoEn?: string;
}

export interface ResumenChoferUnidad {
  chofer: string;
  placa: string;
  viajes: number;
  kmsTotales: number;
  pctTotal: number;
  odoInicial: number;
  odoFinal: number;
  consumoEstLitros: number;
  costoEstMxn: number;
}

export interface ResumenComparativoMes {
  mesKey: string; // "2026-07"
  nombreMes: string; // "Julio 2026"
  viajes: number;
  kmsTotales: number;
  pctTotal: number;
  promedioViaje: number;
  consumoEstLitros: number;
  precioMes: number;
  costoEstMxn: number;
}

export interface DesgloseMesChofer {
  id: string;
  mesKey: string;
  nombreMes: string;
  chofer: string;
  placa: string;
  viajes: number;
  kmsRecorridos: number;
  consumoEstLitros: number;
  precioMes: number;
  costoEstMxn: number;
}

