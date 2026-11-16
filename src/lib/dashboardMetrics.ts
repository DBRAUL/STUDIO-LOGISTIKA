import { Pedido, HistorialEntrega, LogRuta } from '../types';

export interface ClienteRecurrenciaItem {
  cliente: string;
  telefonos: Set<string>;
  tiendas: Map<string, number>;
  tickets: string[];
  total: number;
}

export interface TiempoStats {
  medidos: number;
  promedioMs: number | null;
  minMs: number | null;
  maxMs: number | null;
  en24hCount: number;
  en24hPct: string;
  mismoDiaCount: number;
  mismoDiaPct: string;
}

export interface ResumenSucursalItem {
  tienda: string;
  total: number;
  finalizados: number;
  enProceso: number;
  pct: string;
  tiempos: TiempoStats;
}

export interface ResumenChoferItem {
  chofer: string;
  asignados: number;
  entregados: number;
  pendientes: number;
  pct: string;
  tiempos: TiempoStats;
}

export interface MatrizTiendaChoferRow {
  tienda: string;
  total: number;
  finalizados: number;
  choferCounts: { [choferKey: string]: number };
}

/**
 * Parses timestamps in formats like:
 * - "2026-05-29 14:55:20"
 * - "2026-05-29"
 * - "29/05/2026 14:55:20" or "29/05/2026"
 * - "29-May-2026 14:55"
 * - ISO strings ("2026-05-29T14:55:20.000Z")
 */
export const parseOrderDateTimeMs = (val?: string | Date): number | null => {
  if (!val) return null;
  if (val instanceof Date) {
    const t = val.getTime();
    return isNaN(t) ? null : t;
  }

  const s = String(val).trim();
  if (!s) return null;

  // 1. YYYY-MM-DD[ HH:MM[:SS]] or YYYY/MM/DD[ HH:MM[:SS]]
  const isoLike = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (isoLike) {
    const y = parseInt(isoLike[1], 10);
    const m = parseInt(isoLike[2], 10) - 1;
    const d = parseInt(isoLike[3], 10);
    const hh = isoLike[4] ? parseInt(isoLike[4], 10) : 0;
    const mm = isoLike[5] ? parseInt(isoLike[5], 10) : 0;
    const ss = isoLike[6] ? parseInt(isoLike[6], 10) : 0;
    const dt = new Date(y, m, d, hh, mm, ss);
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  // 2. DD/MM/YYYY[ HH:MM[:SS]] or DD-MM-YYYY[ HH:MM[:SS]]
  const dmy = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (dmy) {
    const d = parseInt(dmy[1], 10);
    const m = parseInt(dmy[2], 10) - 1;
    const y = parseInt(dmy[3], 10);
    const hh = dmy[4] ? parseInt(dmy[4], 10) : 0;
    const mm = dmy[5] ? parseInt(dmy[5], 10) : 0;
    const ss = dmy[6] ? parseInt(dmy[6], 10) : 0;
    const dt = new Date(y, m, d, hh, mm, ss);
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  // 3. DD-MMM-YYYY[ HH:MM[:SS]]
  const dmmmy = s.match(/^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (dmmmy) {
    const meses: { [k: string]: number } = {
      ene: 0, jan: 0, feb: 1, mar: 2, abr: 3, apr: 3, may: 4, jun: 5,
      jul: 6, ago: 7, aug: 7, sep: 8, oct: 9, nov: 10, dic: 11, dec: 11
    };
    const d = parseInt(dmmmy[1], 10);
    const m = meses[dmmmy[2].toLowerCase().substring(0, 3)] ?? 0;
    const y = parseInt(dmmmy[3], 10);
    const hh = dmmmy[4] ? parseInt(dmmmy[4], 10) : 0;
    const mm = dmmmy[5] ? parseInt(dmmmy[5], 10) : 0;
    const ss = dmmmy[6] ? parseInt(dmmmy[6], 10) : 0;
    const dt = new Date(y, m, d, hh, mm, ss);
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  // 4. Fallback native Date.parse
  const parsed = Date.parse(s);
  return isNaN(parsed) ? null : parsed;
};

export const formatDurationHuman = (ms: number | null): string => {
  if (ms === null || isNaN(ms) || ms < 0) return '—';
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const totalHours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (totalHours < 24) {
    return mins > 0 ? `${totalHours}h ${mins}m` : `${totalHours}h`;
  }
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
};

export const formatHoursDecimal = (ms: number | null): string => {
  if (ms === null || isNaN(ms) || ms < 0) return '—';
  const hours = ms / (1000 * 60 * 60);
  if (hours < 24) {
    return `${hours.toFixed(1)} hrs`;
  }
  const days = hours / 24;
  return `${days.toFixed(1)} días (${hours.toFixed(1)} hrs)`;
};

const extractCalendarDay = (ms: number): string => {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const computeTiempoStats = (durations: { diffMs: number; sameDay: boolean }[]): TiempoStats => {
  if (durations.length === 0) {
    return {
      medidos: 0,
      promedioMs: null,
      minMs: null,
      maxMs: null,
      en24hCount: 0,
      en24hPct: '0.0',
      mismoDiaCount: 0,
      mismoDiaPct: '0.0'
    };
  }

  let sum = 0;
  let min = durations[0].diffMs;
  let max = durations[0].diffMs;
  let en24h = 0;
  let mismoDia = 0;

  durations.forEach(d => {
    sum += d.diffMs;
    if (d.diffMs < min) min = d.diffMs;
    if (d.diffMs > max) max = d.diffMs;
    if (d.diffMs <= 24 * 60 * 60 * 1000) en24h++;
    if (d.sameDay) mismoDia++;
  });

  const n = durations.length;
  return {
    medidos: n,
    promedioMs: sum / n,
    minMs: min,
    maxMs: max,
    en24hCount: en24h,
    en24hPct: ((en24h / n) * 100).toFixed(1),
    mismoDiaCount: mismoDia,
    mismoDiaPct: ((mismoDia / n) * 100).toFixed(1)
  };
};

export const computeDashboardMetrics = (
  pedidos: (Pedido | HistorialEntrega)[],
  logs: LogRuta[] = []
) => {
  const totalRegistros = pedidos.length;
  const entregados = pedidos.filter(p => p.estatus === 'FINALIZADO');
  const enProceso = pedidos.filter(p => p.estatus !== 'FINALIZADO');
  const pctEfectividad = totalRegistros > 0 ? ((entregados.length / totalRegistros) * 100).toFixed(1) : '0';

  // Map logs by ticketId for fallback fechaFinalizado lookup
  const logFinByTicket = new Map<string, string>();
  logs.forEach(l => {
    if (l.ticketId && l.horaFin && !logFinByTicket.has(l.ticketId)) {
      logFinByTicket.set(l.ticketId, l.horaFin);
    }
  });

  // Delivery durations per order (CARGADO p.fecha -> FINALIZADO p.fechaFinalizado)
  const globalDurations: { diffMs: number; sameDay: boolean }[] = [];
  const tiendaDurationsMap = new Map<string, { diffMs: number; sameDay: boolean }[]>();
  const choferDurationsMap = new Map<string, { diffMs: number; sameDay: boolean }[]>();

  pedidos.forEach(p => {
    if (p.estatus !== 'FINALIZADO') return;
    const startMs = parseOrderDateTimeMs(p.fecha);
    const finStr = p.fechaFinalizado || logFinByTicket.get(p.ticket);
    const endMs = parseOrderDateTimeMs(finStr);

    if (startMs !== null && endMs !== null && endMs >= startMs) {
      const diffMs = endMs - startMs;
      const sameDay = extractCalendarDay(startMs) === extractCalendarDay(endMs);
      const entry = { diffMs, sameDay };
      globalDurations.push(entry);

      const tKey = (p.tienda || 'SIN SUCURSAL').trim().toUpperCase();
      if (!tiendaDurationsMap.has(tKey)) tiendaDurationsMap.set(tKey, []);
      tiendaDurationsMap.get(tKey)!.push(entry);

      const chKey = p.chofer ? p.chofer.trim().toUpperCase() : 'SIN ASIGNAR / OTROS';
      if (!choferDurationsMap.has(chKey)) choferDurationsMap.set(chKey, []);
      choferDurationsMap.get(chKey)!.push(entry);
    }
  });

  const tiemposGlobales = computeTiempoStats(globalDurations);

  // Cartera & Recurrencia
  const clientesMap = new Map<string, ClienteRecurrenciaItem>();
  pedidos.forEach(p => {
    const cliKey = (p.cliente || 'CLIENTE SIN NOMBRE').trim().toUpperCase();
    if (!clientesMap.has(cliKey)) {
      clientesMap.set(cliKey, {
        cliente: p.cliente || 'CLIENTE SIN NOMBRE',
        telefonos: new Set<string>(),
        tiendas: new Map<string, number>(),
        tickets: [],
        total: 0
      });
    }
    const c = clientesMap.get(cliKey)!;
    c.total++;
    c.tickets.push(p.ticket);
    if (p.tel) c.telefonos.add(p.tel.trim());
    const tKey = p.tienda ? p.tienda.trim().toUpperCase() : 'SIN SUCURSAL';
    c.tiendas.set(tKey, (c.tiendas.get(tKey) || 0) + 1);
  });

  const clientesUnicosCount = clientesMap.size;
  const clientesRecurrentes = (Array.from(clientesMap.values()) as ClienteRecurrenciaItem[])
    .filter(c => c.total >= 2)
    .sort((a, b) => b.total - a.total);
  const tasaRecurrencia = clientesUnicosCount > 0
    ? ((clientesRecurrentes.length / clientesUnicosCount) * 100).toFixed(1)
    : '0';

  // 1. Resumen Operativo por Sucursal
  const sucursalesMap = new Map<string, {
    key: string;
    tienda: string;
    total: number;
    finalizados: number;
    enProceso: number;
  }>();

  pedidos.forEach(p => {
    const tKey = (p.tienda || 'SIN SUCURSAL').trim().toUpperCase();
    if (!sucursalesMap.has(tKey)) {
      sucursalesMap.set(tKey, {
        key: tKey,
        tienda: p.tienda || 'SIN SUCURSAL',
        total: 0,
        finalizados: 0,
        enProceso: 0
      });
    }
    const s = sucursalesMap.get(tKey)!;
    s.total++;
    if (p.estatus === 'FINALIZADO') s.finalizados++;
    else s.enProceso++;
  });

  const resumenSucursales: ResumenSucursalItem[] = Array.from(sucursalesMap.values())
    .map(item => ({
      tienda: item.tienda,
      total: item.total,
      finalizados: item.finalizados,
      enProceso: item.enProceso,
      pct: totalRegistros > 0 ? ((item.total / totalRegistros) * 100).toFixed(1) : '0',
      tiempos: computeTiempoStats(tiendaDurationsMap.get(item.key) || [])
    }))
    .sort((a, b) => b.total - a.total);

  // 2. Desempeño por Chofer
  const choferesMap = new Map<string, {
    key: string;
    chofer: string;
    asignados: number;
    entregados: number;
    pendientes: number;
  }>();

  pedidos.forEach(p => {
    const chKey = p.chofer && p.chofer.trim() !== '' ? p.chofer.trim().toUpperCase() : 'SIN ASIGNAR / OTROS';
    if (!choferesMap.has(chKey)) {
      choferesMap.set(chKey, {
        key: chKey,
        chofer: p.chofer && p.chofer.trim() !== '' ? p.chofer.trim() : 'SIN ASIGNAR / OTROS',
        asignados: 0,
        entregados: 0,
        pendientes: 0
      });
    }
    const ch = choferesMap.get(chKey)!;
    ch.asignados++;
    if (p.estatus === 'FINALIZADO') ch.entregados++;
    else ch.pendientes++;
  });

  const resumenChoferes: ResumenChoferItem[] = Array.from(choferesMap.values())
    .map(item => ({
      chofer: item.chofer,
      asignados: item.asignados,
      entregados: item.entregados,
      pendientes: item.pendientes,
      pct: totalRegistros > 0 ? ((item.asignados / totalRegistros) * 100).toFixed(1) : '0',
      tiempos: computeTiempoStats(choferDurationsMap.get(item.key) || [])
    }))
    .sort((a, b) => b.asignados - a.asignados);

  // 2.1 Matriz Cruzada: Tienda vs Choferes
  // Place assigned drivers sorted by volume first, and "SIN ASIGNAR / OTROS" last
  const choferesCols = [...resumenChoferes]
    .sort((a, b) => {
      const aSin = a.chofer.toUpperCase() === 'SIN ASIGNAR / OTROS';
      const bSin = b.chofer.toUpperCase() === 'SIN ASIGNAR / OTROS';
      if (aSin && !bSin) return 1;
      if (!aSin && bSin) return -1;
      return b.asignados - a.asignados;
    })
    .map(c => ({
      key: c.chofer.trim().toUpperCase(),
      label: c.chofer,
      total: c.asignados
    }));

  const matrizTiendaChofer: MatrizTiendaChoferRow[] = resumenSucursales.map(s => {
    const sKey = s.tienda.trim().toUpperCase();
    const choferCounts: { [k: string]: number } = {};
    choferesCols.forEach(col => {
      choferCounts[col.key] = 0;
    });

    pedidos.forEach(p => {
      const pTienda = (p.tienda || 'SIN SUCURSAL').trim().toUpperCase();
      if (pTienda === sKey) {
        const chKey = p.chofer && p.chofer.trim() !== '' ? p.chofer.trim().toUpperCase() : 'SIN ASIGNAR / OTROS';
        if (choferCounts[chKey] !== undefined) {
          choferCounts[chKey]++;
        }
      }
    });

    return {
      tienda: s.tienda,
      total: s.total,
      finalizados: s.finalizados,
      choferCounts
    };
  });

  // 3. Comportamiento y Tendencia Mensual
  const mesesMap = new Map<string, {
    mesKey: string;
    nombreMes: string;
    procesados: number;
    finalizados: number;
    pendientes: number;
  }>();

  const nombresMes: { [k: string]: string } = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };

  pedidos.forEach(p => {
    const fechaBase = p.fecha || p.dateenv || '';
    let mesKey = '2026-11';
    if (/^\d{4}-\d{2}/.test(fechaBase)) {
      mesKey = fechaBase.substring(0, 7);
    } else {
      const m = fechaBase.match(/^(\d{4})[/-](\d{1,2})/);
      if (m) {
        mesKey = `${m[1]}-${m[2].padStart(2, '0')}`;
      }
    }

    if (!mesesMap.has(mesKey)) {
      const [yyyy, mm] = mesKey.split('-');
      mesesMap.set(mesKey, {
        mesKey,
        nombreMes: `${nombresMes[mm] || mm} ${yyyy}`,
        procesados: 0,
        finalizados: 0,
        pendientes: 0
      });
    }

    const item = mesesMap.get(mesKey)!;
    item.procesados++;
    if (p.estatus === 'FINALIZADO') item.finalizados++;
    else item.pendientes++;
  });

  const mesesOrdenados = Array.from(mesesMap.values()).sort((a, b) => a.mesKey.localeCompare(b.mesKey));

  // 3.1 Matriz Cruzada: Sucursal x Mes
  const months = mesesOrdenados.map(m => m.mesKey);
  const matrizSucursalMesRows = resumenSucursales.map(s => {
    const monthCounts: { [m: string]: number } = {};
    months.forEach(m => { monthCounts[m] = 0; });

    pedidos.forEach(p => {
      if ((p.tienda || 'SIN SUCURSAL').trim().toUpperCase() === s.tienda.trim().toUpperCase()) {
        const f = p.fecha || p.dateenv || '';
        const mKey = f.length >= 7 ? f.substring(0, 7) : '2026-11';
        if (monthCounts[mKey] !== undefined) {
          monthCounts[mKey]++;
        }
      }
    });

    return {
      tienda: s.tienda,
      total: s.total,
      monthCounts
    };
  });

  // 5. Pedidos Activos y en Ruta
  const pedidosActivosEnRuta = pedidos.filter(p => p.estatus !== 'FINALIZADO');

  return {
    totalRegistros,
    entregados,
    enProceso,
    pctEfectividad,
    clientesUnicosCount,
    clientesRecurrentes,
    tasaRecurrencia,
    resumenSucursales,
    resumenChoferes,
    choferesCols,
    matrizTiendaChofer,
    tiemposGlobales,
    mesesOrdenados,
    matrizSucursalMes: {
      months,
      dataRows: matrizSucursalMesRows
    },
    pedidosActivosEnRuta
  };
};
