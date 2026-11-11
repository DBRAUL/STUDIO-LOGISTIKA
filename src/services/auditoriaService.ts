import { KilometrajeRegistro, UnidadConfig, ResumenChoferUnidad, ResumenComparativoMes, DesgloseMesChofer, PrecioCombustibleMes } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Default fixed fuel prices
export const PRECIOS_COMBUSTIBLE_DEFAULT: { [mesKey: string]: number } = {
  '2026-01': 24.15,
  '2026-02': 24.22,
  '2026-03': 24.30,
  '2026-04': 24.38,
  '2026-05': 24.42,
  '2026-06': 24.45,
  '2026-07': 24.50, // Fixed agreed
  '2026-08': 24.50, // Fixed agreed
  '2026-09': 24.50, // Fixed agreed
  '2026-10': 24.68,
  '2026-11': 24.75,
  '2026-12': 24.82,
};

export const NOMBRES_MESES: { [key: string]: string } = {
  '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
  '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
  '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
};

export const formatearMesNombre = (mesKey: string): string => {
  const parts = mesKey.split('-');
  if (parts.length === 2) {
    const mesNum = parts[1];
    const anio = parts[0];
    return `${NOMBRES_MESES[mesNum] || mesNum} ${anio}`;
  }
  return mesKey;
};

// Historical baseline for Julio - Septiembre 2026 (matches 1:1 user verified PDF)
export interface BaselineEntry {
  mesKey: string; // "2026-07"
  chofer: string;
  placa: string;
  viajes: number;
  kmsRecorridos: number;
  odoInicial: number;
  odoFinal: number;
}

export const BASELINE_AUDITORIA_2026: BaselineEntry[] = [
  // Julio 2026
  { mesKey: '2026-07', chofer: 'Fernando', placa: 'NAS025A', viajes: 10, kmsRecorridos: 3506, odoInicial: 58196, odoFinal: 61702 },
  { mesKey: '2026-07', chofer: 'LEONARDO', placa: 'NBD-928-C', viajes: 14, kmsRecorridos: 1863, odoInicial: 12168, odoFinal: 14031 },
  { mesKey: '2026-07', chofer: 'Calixto', placa: 'PBW580B', viajes: 17, kmsRecorridos: 1369, odoInicial: 27117, odoFinal: 28486 },
  
  // Agosto 2026
  { mesKey: '2026-08', chofer: 'Fernando', placa: 'NAS025A', viajes: 10, kmsRecorridos: 2598, odoInicial: 61702, odoFinal: 64300 },
  { mesKey: '2026-08', chofer: 'Calixto', placa: 'PBW580B', viajes: 16, kmsRecorridos: 1724, odoInicial: 28486, odoFinal: 30210 },
  { mesKey: '2026-08', chofer: 'LEONARDO', placa: 'NBD-928-C', viajes: 15, kmsRecorridos: 1638, odoInicial: 14031, odoFinal: 15669 },
  { mesKey: '2026-08', chofer: 'FORD', placa: 'LH24077', viajes: 1, kmsRecorridos: 191, odoInicial: 14327, odoFinal: 14518 },

  // Septiembre 2026
  { mesKey: '2026-09', chofer: 'Fernando', placa: 'NAS025A', viajes: 3, kmsRecorridos: 1180, odoInicial: 64300, odoFinal: 65480 },
  { mesKey: '2026-09', chofer: 'LEONARDO', placa: 'NBD-928-C', viajes: 3, kmsRecorridos: 258, odoInicial: 15669, odoFinal: 15927 },
  { mesKey: '2026-09', chofer: 'Calixto', placa: 'PBW580B', viajes: 2, kmsRecorridos: 247, odoInicial: 30210, odoFinal: 30457 },
];

/**
 * Fetch monthly fuel prices from Firestore or fallback to API / defaults
 */
export const obtenerPreciosCombustible = async (): Promise<{ [mesKey: string]: number }> => {
  try {
    const docRef = doc(db, 'system_config', 'precios_combustible');
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.precios) {
      return {
        ...PRECIOS_COMBUSTIBLE_DEFAULT,
        ...snap.data().precios
      };
    }
  } catch (err) {
    console.warn('[Auditoria] No se pudo leer precios_combustible de Firestore:', err);
  }
  return { ...PRECIOS_COMBUSTIBLE_DEFAULT };
};

/**
 * Save updated fuel prices to Firestore
 */
export const guardarPreciosCombustible = async (precios: { [mesKey: string]: number }): Promise<boolean> => {
  try {
    const docRef = doc(db, 'system_config', 'precios_combustible');
    await setDoc(docRef, {
      precios,
      actualizadoEn: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Auditoria] Error guardando precios de combustible:', err);
    return false;
  }
};

/**
 * Request real-time CDMX fuel average from server endpoint
 */
export const consultarPrecioCDMXServidor = async (mesKey?: string): Promise<{ precio: number; fuente: string } | null> => {
  try {
    let url = '/api/fuel-price-cdmx';
    if (mesKey) {
      const [y, m] = mesKey.split('-');
      url += `?year=${y}&month=${m}`;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && typeof data.precio === 'number') {
      return { precio: data.precio, fuente: data.fuente || 'CRE / CDMX' };
    }
  } catch (err) {
    console.warn('[Auditoria] Fallo al consultar precio combustible en servidor:', err);
  }
  return null;
};

export interface AuditoriaProcesada {
  kpis: {
    kilometrajeTotal: number;
    totalViajes: number;
    promedioPorViaje: number;
    consumoEstLitros: number;
    gastoCombustibleTotal: number;
    rendimientoBase: number;
    costoPorLitroPonderado: number;
  };
  resumenChoferes: ResumenChoferUnidad[];
  resumenMeses: ResumenComparativoMes[];
  desgloseDetallado: DesgloseMesChofer[];
  mesesDisponibles: { key: string; label: string }[];
  choferesDisponibles: string[];
}

/**
 * Main calculation engine: merges baseline data with live Firestore records
 * and computes all KPIs, tables, and averages.
 */
export const procesarDatosAuditoria = (
  kilometrajes: KilometrajeRegistro[],
  unidades: UnidadConfig[],
  preciosMes: { [mesKey: string]: number },
  filtroPeriodo: string = 'TODOS', // 'TODOS' | '2026-07' | '2026-08' | etc.
  filtroChofer: string = 'TODOS',
  filtroPlaca: string = 'TODOS',
  rendimientoBase: number = 9.0
): AuditoriaProcesada => {
  // 1. Gather all month-driver entries from baseline
  const entries: {
    mesKey: string;
    chofer: string;
    placa: string;
    viajes: number;
    kmsRecorridos: number;
    odoInicial: number;
    odoFinal: number;
  }[] = [...BASELINE_AUDITORIA_2026];

  // Map unit id to plate and vehicle rendimiento
  const unitMap: { [id: string]: UnidadConfig } = {};
  unidades.forEach(u => {
    unitMap[u.id] = u;
    if (u.placa) unitMap[u.placa] = u;
  });

  // 2. Extract any post-baseline records from live `kilometrajes`
  // A record is new if its date is >= 2026-09-20 or in a month not covered fully by baseline
  const liveByUnit: { [key: string]: KilometrajeRegistro[] } = {};
  kilometrajes.forEach(k => {
    if (!k.fecha || k.kmValue === undefined || k.kmValue === null) return;
    // Check if after baseline period
    if (k.fecha > '2026-09-18') {
      const key = `${k.unidadId || k.chofer}`;
      if (!liveByUnit[key]) liveByUnit[key] = [];
      liveByUnit[key].push(k);
    }
  });

  // Calculate distances for live records
  Object.keys(liveByUnit).forEach(key => {
    const list = liveByUnit[key].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const curr = list[i];
      const diff = (curr.kmValue || 0) - (prev.kmValue || 0);
      if (diff > 0 && diff < 3000) {
        const mesKey = (curr.fecha || '').substring(0, 7);
        const choferName = curr.chofer || prev.chofer || 'Operador';
        const u = unitMap[curr.unidadId || ''] || unitMap[prev.unidadId || ''];
        const placa = u?.placa || curr.unidadId || 'Unidad';

        // Check if entry already exists in entries for that month/chofer
        const existing = entries.find(e => e.mesKey === mesKey && e.chofer.toLowerCase() === choferName.toLowerCase());
        if (existing) {
          existing.viajes += 1;
          existing.kmsRecorridos += diff;
          if ((curr.kmValue || 0) > existing.odoFinal) existing.odoFinal = curr.kmValue || 0;
        } else {
          entries.push({
            mesKey,
            chofer: choferName,
            placa,
            viajes: 1,
            kmsRecorridos: diff,
            odoInicial: prev.kmValue || 0,
            odoFinal: curr.kmValue || 0
          });
        }
      }
    }
  });

  // Filter available lists for UI
  const setMeses = new Set<string>();
  const setChoferes = new Set<string>();
  entries.forEach(e => {
    setMeses.add(e.mesKey);
    setChoferes.add(e.chofer);
  });

  const mesesDisponibles = Array.from(setMeses)
    .sort()
    .map(key => ({ key, label: formatearMesNombre(key) }));

  const choferesDisponibles = Array.from(setChoferes).sort();

  // Apply filters
  let filtered = entries.filter(e => {
    if (filtroPeriodo !== 'TODOS') {
      if (filtroPeriodo === 'JUL_SEP_2026') {
        if (!['2026-07', '2026-08', '2026-09'].includes(e.mesKey)) return false;
      } else if (e.mesKey !== filtroPeriodo) {
        return false;
      }
    }
    if (filtroChofer !== 'TODOS' && e.chofer.toLowerCase() !== filtroChofer.toLowerCase()) {
      return false;
    }
    if (filtroPlaca !== 'TODOS' && e.placa.toLowerCase() !== filtroPlaca.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Calculate totals for % calculation
  const totalKmsGral = filtered.reduce((acc, curr) => acc + curr.kmsRecorridos, 0);
  const totalViajesGral = filtered.reduce((acc, curr) => acc + curr.viajes, 0);

  // 1. Table: Desglose Detallado por Mes y Chofer
  const desgloseDetallado: DesgloseMesChofer[] = filtered.map((item, idx) => {
    const precioMes = preciosMes[item.mesKey] || 24.50;
    const consumoEstLitros = Number((item.kmsRecorridos / rendimientoBase).toFixed(1));
    const costoEstMxn = Number((consumoEstLitros * precioMes).toFixed(2));

    return {
      id: `${item.mesKey}_${item.chofer}_${idx}`,
      mesKey: item.mesKey,
      nombreMes: formatearMesNombre(item.mesKey),
      chofer: item.chofer,
      placa: item.placa,
      viajes: item.viajes,
      kmsRecorridos: item.kmsRecorridos,
      consumoEstLitros,
      precioMes,
      costoEstMxn
    };
  }).sort((a, b) => {
    // Sort by mesKey asc, then by kmsRecorridos desc
    if (a.mesKey !== b.mesKey) return a.mesKey.localeCompare(b.mesKey);
    return b.kmsRecorridos - a.kmsRecorridos;
  });

  // 2. Table: Resumen Comparativo por Mes
  const mesGroups: { [mesKey: string]: { viajes: number; kms: number; consumo: number; costo: number } } = {};
  filtered.forEach(item => {
    if (!mesGroups[item.mesKey]) {
      mesGroups[item.mesKey] = { viajes: 0, kms: 0, consumo: 0, costo: 0 };
    }
    const precioMes = preciosMes[item.mesKey] || 24.50;
    const consumo = item.kmsRecorridos / rendimientoBase;
    const costo = consumo * precioMes;

    mesGroups[item.mesKey].viajes += item.viajes;
    mesGroups[item.mesKey].kms += item.kmsRecorridos;
    mesGroups[item.mesKey].consumo += consumo;
    mesGroups[item.mesKey].costo += costo;
  });

  const resumenMeses: ResumenComparativoMes[] = Object.keys(mesGroups).sort().map(mesKey => {
    const g = mesGroups[mesKey];
    const pct = totalKmsGral > 0 ? (g.kms / totalKmsGral) * 100 : 0;
    const prom = g.viajes > 0 ? g.kms / g.viajes : 0;
    const precioMes = preciosMes[mesKey] || 24.50;

    return {
      mesKey,
      nombreMes: formatearMesNombre(mesKey),
      viajes: g.viajes,
      kmsTotales: g.kms,
      pctTotal: Number(pct.toFixed(1)),
      promedioViaje: Number(prom.toFixed(1)),
      consumoEstLitros: Number(g.consumo.toFixed(1)),
      precioMes,
      costoEstMxn: Number(g.costo.toFixed(2))
    };
  });

  // 3. Table: Resumen Acumulado por Chofer y Unidad
  const choferGroups: { 
    [chofer: string]: { 
      placa: string; 
      viajes: number; 
      kms: number; 
      odoMin: number; 
      odoMax: number; 
      consumo: number; 
      costo: number;
    } 
  } = {};

  filtered.forEach(item => {
    if (!choferGroups[item.chofer]) {
      choferGroups[item.chofer] = {
        placa: item.placa,
        viajes: 0,
        kms: 0,
        odoMin: item.odoInicial,
        odoMax: item.odoFinal,
        consumo: 0,
        costo: 0
      };
    }
    const g = choferGroups[item.chofer];
    const precioMes = preciosMes[item.mesKey] || 24.50;
    const consumo = item.kmsRecorridos / rendimientoBase;
    const costo = consumo * precioMes;

    g.viajes += item.viajes;
    g.kms += item.kmsRecorridos;
    g.consumo += consumo;
    g.costo += costo;

    if (item.odoInicial > 0 && (g.odoMin === 0 || item.odoInicial < g.odoMin)) {
      g.odoMin = item.odoInicial;
    }
    if (item.odoFinal > g.odoMax) {
      g.odoMax = item.odoFinal;
    }
  });

  const resumenChoferes: ResumenChoferUnidad[] = Object.keys(choferGroups).map(chofer => {
    const g = choferGroups[chofer];
    const pct = totalKmsGral > 0 ? (g.kms / totalKmsGral) * 100 : 0;

    return {
      chofer,
      placa: g.placa,
      viajes: g.viajes,
      kmsTotales: g.kms,
      pctTotal: Number(pct.toFixed(1)),
      odoInicial: g.odoMin,
      odoFinal: g.odoMax,
      consumoEstLitros: Number(g.consumo.toFixed(1)),
      costoEstMxn: Number(g.costo.toFixed(2))
    };
  }).sort((a, b) => b.kmsTotales - a.kmsTotales);

  // Overall KPIs
  const consumoEstTotal = Number((totalKmsGral / rendimientoBase).toFixed(1));
  const gastoTotal = Number(filtered.reduce((acc, curr) => {
    const p = preciosMes[curr.mesKey] || 24.50;
    return acc + (curr.kmsRecorridos / rendimientoBase) * p;
  }, 0).toFixed(2));

  const promViaje = totalViajesGral > 0 ? Number((totalKmsGral / totalViajesGral).toFixed(1)) : 0;
  const costoPonderado = consumoEstTotal > 0 ? Number((gastoTotal / consumoEstTotal).toFixed(2)) : 24.50;

  return {
    kpis: {
      kilometrajeTotal: totalKmsGral,
      totalViajes: totalViajesGral,
      promedioPorViaje: promViaje,
      consumoEstLitros: consumoEstTotal,
      gastoCombustibleTotal: gastoTotal,
      rendimientoBase,
      costoPorLitroPonderado: costoPonderado
    },
    resumenChoferes,
    resumenMeses,
    desgloseDetallado,
    mesesDisponibles,
    choferesDisponibles
  };
};

/**
 * Generate UTF-8 CSV with BOM for universal Excel compatibility
 */
export const exportarAuditoriaCSV = (datos: AuditoriaProcesada, tituloPeriodo: string) => {
  const lines: string[] = [];

  // BOM for Excel
  const BOM = '\uFEFF';

  lines.push(`DASHBOARD DE AUDITORÍA DE UNIDADES - LOGISTIKA`);
  lines.push(`Periodo: ${tituloPeriodo}`);
  lines.push(`Generado: ${new Date().toLocaleString('es-MX')}`);
  lines.push(`Rendimiento Base: ${datos.kpis.rendimientoBase} km/L`);
  lines.push('');

  // 1. KPIs
  lines.push('--- INDICADORES GENERALES (KPIS) ---');
  lines.push(`Kilometraje Total,${datos.kpis.kilometrajeTotal} km`);
  lines.push(`Total de Viajes / Recorridos,${datos.kpis.totalViajes}`);
  lines.push(`Promedio por Viaje,${datos.kpis.promedioPorViaje} km`);
  lines.push(`Consumo Estimado,${datos.kpis.consumoEstLitros} L`);
  lines.push(`Gasto Total Combustible,$${datos.kpis.gastoCombustibleTotal} MXN`);
  lines.push(`Costo Promedio Gasolina,$${datos.kpis.costoPorLitroPonderado} MXN/L`);
  lines.push('');

  // 2. Resumen por Chofer y Unidad
  lines.push('--- 1. RESUMEN ACUMULADO POR CHOFER Y UNIDAD ---');
  lines.push('Chofer / Operador,Placa,Viajes,Kms Totales,% Total,Odo. Inicial,Odo. Final,Consumo Est. (L),Costo Est. (MXN)');
  datos.resumenChoferes.forEach(c => {
    lines.push(`"${c.chofer}","${c.placa}",${c.viajes},${c.kmsTotales},${c.pctTotal}%,${c.odoInicial},${c.odoFinal},${c.consumoEstLitros},${c.costoEstMxn}`);
  });
  lines.push(`TOTALES,,${datos.kpis.totalViajes},${datos.kpis.kilometrajeTotal},100.0%,,,${datos.kpis.consumoEstLitros},${datos.kpis.gastoCombustibleTotal}`);
  lines.push('');

  // 3. Resumen Comparativo por Mes
  lines.push('--- 2. RESUMEN COMPARATIVO POR MES ---');
  lines.push('Mes,Viajes,Kms Totales,% Total,Promedio / Viaje,Consumo Est. (L),Precio/L (MXN),Costo Est. (MXN)');
  datos.resumenMeses.forEach(m => {
    lines.push(`"${m.nombreMes}",${m.viajes},${m.kmsTotales},${m.pctTotal}%,${m.promedioViaje},${m.consumoEstLitros},${m.precioMes},${m.costoEstMxn}`);
  });
  lines.push(`TOTALES,${datos.kpis.totalViajes},${datos.kpis.kilometrajeTotal},100.0%,${datos.kpis.promedioPorViaje},${datos.kpis.consumoEstLitros},,${datos.kpis.gastoCombustibleTotal}`);
  lines.push('');

  // 4. Desglose Detallado
  lines.push('--- 3. DESGLOSE DETALLADO POR MES Y CHOFER ---');
  lines.push('Mes,Chofer,Placa,Viajes,Kms Recorridos,Consumo Est. (L),Precio/L,Costo Est. (MXN)');
  datos.desgloseDetallado.forEach(d => {
    lines.push(`"${d.nombreMes}","${d.chofer}","${d.placa}",${d.viajes},${d.kmsRecorridos},${d.consumoEstLitros},${d.precioMes},${d.costoEstMxn}`);
  });

  const csvContent = BOM + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Auditoria_Unidades_${tituloPeriodo.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
