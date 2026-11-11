import React, { useMemo } from 'react';
import { Pedido, HistorialEntrega, TiendaConfig } from '../types';
import { 
  Building2, 
  Users, 
  Truck, 
  TrendingUp, 
  Repeat, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { formatedDisplayDate, formatedDisplayDateTime } from '../context/LogistikaContext';

interface Props {
  pedidos: (Pedido | HistorialEntrega)[];
  tiendas: TiendaConfig[];
  onPrintDashboard: () => void;
}

interface ClienteRecurrenciaItem {
  cliente: string;
  telefonos: Set<string>;
  tiendas: Map<string, number>;
  tickets: string[];
  total: number;
}

export const DashboardGeneralOperaciones: React.FC<Props> = ({
  pedidos,
  tiendas,
  onPrintDashboard
}) => {
  // 1. Calculations & KPIs
  const totalRegistros = pedidos.length;
  const entregados = pedidos.filter(p => p.estatus === 'FINALIZADO');
  const enProceso = pedidos.filter(p => p.estatus !== 'FINALIZADO');
  const pctEfectividad = totalRegistros > 0 ? ((entregados.length / totalRegistros) * 100).toFixed(1) : '0';

  // Cartera & Recurrencia
  const clientesMap = useMemo(() => {
    const map = new Map<string, ClienteRecurrenciaItem>();

    pedidos.forEach(p => {
      const cliKey = (p.cliente || 'CLIENTE SIN NOMBRE').trim().toUpperCase();
      if (!map.has(cliKey)) {
        map.set(cliKey, {
          cliente: p.cliente || 'CLIENTE SIN NOMBRE',
          telefonos: new Set<string>(),
          tiendas: new Map<string, number>(),
          tickets: [],
          total: 0
        });
      }
      const c = map.get(cliKey)!;
      c.total++;
      c.tickets.push(p.ticket);
      if (p.tel) c.telefonos.add(p.tel.trim());
      const tKey = p.tienda ? p.tienda.trim().toUpperCase() : 'SIN SUCURSAL';
      c.tiendas.set(tKey, (c.tiendas.get(tKey) || 0) + 1);
    });

    return map;
  }, [pedidos]);

  const clientesUnicosCount = clientesMap.size;
  const clientesRecurrentes = useMemo(() => {
    const items = Array.from(clientesMap.values()) as ClienteRecurrenciaItem[];
    return items
      .filter((c: ClienteRecurrenciaItem) => c.total >= 2)
      .sort((a: ClienteRecurrenciaItem, b: ClienteRecurrenciaItem) => b.total - a.total);
  }, [clientesMap]);

  const tasaRecurrencia = clientesUnicosCount > 0 
    ? ((clientesRecurrentes.length / clientesUnicosCount) * 100).toFixed(1) 
    : '0';

  // 2. Resumen Operativo por Sucursal
  const resumenSucursales = useMemo(() => {
    const map = new Map<string, {
      tienda: string;
      total: number;
      finalizados: number;
      enProceso: number;
    }>();

    pedidos.forEach(p => {
      const tKey = (p.tienda || 'SIN SUCURSAL').trim().toUpperCase();
      if (!map.has(tKey)) {
        map.set(tKey, {
          tienda: p.tienda || 'SIN SUCURSAL',
          total: 0,
          finalizados: 0,
          enProceso: 0
        });
      }
      const s = map.get(tKey)!;
      s.total++;
      if (p.estatus === 'FINALIZADO') s.finalizados++;
      else s.enProceso++;
    });

    return Array.from(map.values())
      .map(item => ({
        ...item,
        pct: totalRegistros > 0 ? ((item.total / totalRegistros) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.total - a.total);
  }, [pedidos, totalRegistros]);

  // 3. Desempeño por Chofer
  const resumenChoferes = useMemo(() => {
    const map = new Map<string, {
      chofer: string;
      asignados: number;
      entregados: number;
      pendientes: number;
    }>();

    pedidos.forEach(p => {
      const chKey = p.chofer ? p.chofer.trim().toUpperCase() : 'SIN ASIGNAR / OTROS';
      if (!map.has(chKey)) {
        map.set(chKey, {
          chofer: p.chofer ? p.chofer.trim() : 'SIN ASIGNAR / OTROS',
          asignados: 0,
          entregados: 0,
          pendientes: 0
        });
      }
      const ch = map.get(chKey)!;
      ch.asignados++;
      if (p.estatus === 'FINALIZADO') ch.entregados++;
      else ch.pendientes++;
    });

    return Array.from(map.values())
      .map(item => ({
        ...item,
        pct: totalRegistros > 0 ? ((item.asignados / totalRegistros) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.asignados - a.asignados);
  }, [pedidos, totalRegistros]);

  // 4. Comportamiento y Tendencia Mensual
  const mesesOrdenados = useMemo(() => {
    const map = new Map<string, {
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

      if (!map.has(mesKey)) {
        const [yyyy, mm] = mesKey.split('-');
        map.set(mesKey, {
          mesKey,
          nombreMes: `${nombresMes[mm] || mm} ${yyyy}`,
          procesados: 0,
          finalizados: 0,
          pendientes: 0
        });
      }

      const item = map.get(mesKey)!;
      item.procesados++;
      if (p.estatus === 'FINALIZADO') item.finalizados++;
      else item.pendientes++;
    });

    return Array.from(map.values()).sort((a, b) => a.mesKey.localeCompare(b.mesKey));
  }, [pedidos]);

  // 5. Matriz Cruzada: Sucursal x Mes
  const matrizSucursalMes = useMemo(() => {
    // Top 5 stores + otras
    const topStores = resumenSucursales.slice(0, 5).map(s => s.tienda);
    const months = mesesOrdenados.map(m => m.mesKey);

    const dataRows = resumenSucursales.map(s => {
      const monthCounts: { [m: string]: number } = {};
      months.forEach(m => { monthCounts[m] = 0; });

      pedidos.forEach(p => {
        if ((p.tienda || '').toUpperCase() === s.tienda.toUpperCase()) {
          const f = p.fecha || p.dateenv || '';
          let mKey = f.length >= 7 ? f.substring(0, 7) : '2026-11';
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

    return { months, dataRows };
  }, [resumenSucursales, mesesOrdenados, pedidos]);

  // 6. Pedidos Activos y en Ruta
  const pedidosActivosEnRuta = useMemo(() => {
    return pedidos
      .filter(p => p.estatus !== 'FINALIZADO')
      .slice(0, 15);
  }, [pedidos]);

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-950/80 text-indigo-400 border border-indigo-900/60 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase">
            <ShieldCheck size={14} className="text-indigo-400" /> Reportes de Logistika · Ejecutivo
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
            Dashboard General de Pedidos y Operaciones
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Análisis integral de carga de trabajo, operadores, sucursales y recurrencia de clientes con indicadores consolidados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="text-right sm:border-r border-slate-800 sm:pr-4 hidden sm:block">
            <span className="block text-[10px] uppercase font-bold text-slate-500 font-mono">Total Registros</span>
            <span className="text-lg font-black text-white font-mono">{totalRegistros} pedidos</span>
          </div>
          <button
            onClick={onPrintDashboard}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition shadow-lg shadow-indigo-950/50 hover:scale-[1.02] active:scale-[0.98]"
            title="Generar e imprimir versión ejecutiva idéntica de 3 páginas en PDF"
          >
            <Printer size={16} />
            <span>Imprimir Dashboard (PDF 3 Páginas)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (4 cards matching the official document) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pedidos Entregados */}
        <div className="bg-slate-900/80 border-t-4 border-t-emerald-500 border-x border-b border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Pedidos Entregados</span>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black font-display text-white">
              {entregados.length}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 font-mono">
              {pctEfectividad}% Efectividad
            </span>
            <span className="text-[10px] text-slate-500 font-mono uppercase">Operativa</span>
          </div>
        </div>

        {/* Card 2: Pedidos Pendientes */}
        <div className="bg-slate-900/80 border-t-4 border-t-amber-500 border-x border-b border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Pedidos Pendientes</span>
              <Clock size={16} className="text-amber-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black font-display text-amber-400">
              {enProceso.length}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              En Ruta, Cargado o Programado
            </span>
          </div>
        </div>

        {/* Card 3: Cartera de Clientes */}
        <div className="bg-slate-900/80 border-t-4 border-t-blue-500 border-x border-b border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Cartera de Clientes</span>
              <Users size={16} className="text-blue-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black font-display text-white">
              {clientesUnicosCount}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              Clientes Únicos Registrados
            </span>
          </div>
        </div>

        {/* Card 4: Tasa de Recurrencia */}
        <div className="bg-slate-900/80 border-t-4 border-t-indigo-500 border-x border-b border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Tasa Recurrencia</span>
              <Repeat size={16} className="text-indigo-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black font-display text-indigo-400">
              {tasaRecurrencia}%
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 font-mono">
              {clientesRecurrentes.length} Clientes
            </span>
            <span className="text-[10px] text-slate-500 font-mono">(&gt;1 Compra)</span>
          </div>
        </div>
      </div>

      {/* Grid of Sections 1 & 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: RESUMEN OPERATIVO POR SUCURSAL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <div className="p-5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-950 text-indigo-400 font-bold font-mono text-xs flex items-center justify-center border border-indigo-900/50">
                1
              </span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
                Resumen Operativo por Sucursal y Punto de Origen
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-8">
              Distribución total del volumen de pedidos solicitados a través de las tiendas origen auditadas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Tienda / Sucursal Origen</th>
                  <th className="py-3 px-3 text-center">Pedidos Totales</th>
                  <th className="py-3 px-3 text-center">Finalizados</th>
                  <th className="py-3 px-3 text-center">En Proceso</th>
                  <th className="py-3 px-4 text-right">% Participación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {resumenSucursales.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      {s.tienda}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-slate-100">
                      {s.total}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">
                      {s.finalizados}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-400 font-bold">
                      {s.enProceso}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-300">
                      {s.pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 font-bold text-slate-200 border-t-2 border-slate-800 font-mono text-xs">
                <tr>
                  <td className="py-3 px-4 uppercase tracking-wider">Total General</td>
                  <td className="py-3 px-3 text-center font-black text-white">{totalRegistros}</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-black">{entregados.length}</td>
                  <td className="py-3 px-3 text-center text-amber-400 font-black">{enProceso.length}</td>
                  <td className="py-3 px-4 text-right text-indigo-400 font-black">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Section 2: DESEMPEÑO Y CARGA DE TRABAJO POR OPERADOR (CHOFER) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <div className="p-5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-950 text-teal-400 font-bold font-mono text-xs flex items-center justify-center border border-teal-900/50">
                2
              </span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
                Desempeño y Carga de Trabajo por Operador (Chofer)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-8">
              Distribución de entregas asignadas y nivel de cumplimiento por cada chofer de la plantilla operativa.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Operador / Chofer</th>
                  <th className="py-3 px-3 text-center">Asignados</th>
                  <th className="py-3 px-3 text-center">Entregados</th>
                  <th className="py-3 px-3 text-center">En Ruta / Pend.</th>
                  <th className="py-3 px-4 text-right">% Carga Operativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {resumenChoferes.map((ch, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                      <Truck size={14} className="text-teal-400" />
                      {ch.chofer}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-slate-100">
                      {ch.asignados}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">
                      {ch.entregados}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-400 font-bold">
                      {ch.pendientes}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-teal-300">
                      {ch.pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 font-bold text-slate-200 border-t-2 border-slate-800 font-mono text-xs">
                <tr>
                  <td className="py-3 px-4 uppercase tracking-wider">Totales</td>
                  <td className="py-3 px-3 text-center font-black text-white">{totalRegistros}</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-black">{entregados.length}</td>
                  <td className="py-3 px-3 text-center text-amber-400 font-black">{enProceso.length}</td>
                  <td className="py-3 px-4 text-right text-teal-400 font-black">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Grid of Section 3: Tendencia Mensual & Matriz Cruzada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 3: COMPORTAMIENTO Y TENDENCIA MENSUAL DE ENTREGAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <div className="p-5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-950 text-blue-400 font-bold font-mono text-xs flex items-center justify-center border border-blue-900/50">
                3
              </span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
                Comportamiento y Tendencia Mensual de Entregas
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-8">
              Evolución cronológica de volumen y cumplimiento operativo mes a mes.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Mes de Operación</th>
                  <th className="py-3 px-3 text-center">Pedidos Proc.</th>
                  <th className="py-3 px-3 text-center">Finalizados</th>
                  <th className="py-3 px-3 text-center">Pendientes</th>
                  <th className="py-3 px-4 text-right">% Distribución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {mesesOrdenados.map((m, idx) => {
                  const pct = totalRegistros > 0 ? ((m.procesados / totalRegistros) * 100).toFixed(1) : '0';
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                        <Calendar size={13} className="text-blue-400" />
                        {m.nombreMes}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-slate-100">
                        {m.procesados}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">
                        {m.finalizados}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-400 font-bold">
                        {m.pendientes}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-300">
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-950 font-bold text-slate-200 border-t-2 border-slate-800 font-mono text-xs">
                <tr>
                  <td className="py-3 px-4 uppercase tracking-wider">Total Acumulado</td>
                  <td className="py-3 px-3 text-center font-black text-white">{totalRegistros}</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-black">{entregados.length}</td>
                  <td className="py-3 px-3 text-center text-amber-400 font-black">{enProceso.length}</td>
                  <td className="py-3 px-4 text-right text-blue-400 font-black">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Section 3.1: MATRIZ CRUZADA: PEDIDOS POR SUCURSAL Y POR MES */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <div className="p-5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-950 text-purple-400 font-bold font-mono text-xs flex items-center justify-center border border-purple-900/50">
                3.1
              </span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
                Matriz Cruzada: Pedidos por Sucursal y por Mes
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-8">
              Desglose comparativo mensual del volumen de pedidos solicitados en cada punto de origen.
            </p>
          </div>

          <div className="overflow-x-auto max-h-[360px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="sticky top-0 bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 font-mono z-10">
                <tr>
                  <th className="py-3 px-3">Sucursal / Tienda</th>
                  {matrizSucursalMes.months.map(m => {
                    const parts = m.split('-');
                    const mesAbrev = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
                    const idx = parseInt(parts[1], 10) - 1;
                    return (
                      <th key={m} className="py-3 px-2 text-center whitespace-nowrap">
                        {mesAbrev[idx] || parts[1]} {parts[0].slice(2)}
                      </th>
                    );
                  })}
                  <th className="py-3 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {matrizSucursalMes.dataRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-100 truncate max-w-[140px]" title={row.tienda}>
                      {row.tienda}
                    </td>
                    {matrizSucursalMes.months.map(m => (
                      <td key={m} className="py-2.5 px-2 text-center font-mono text-slate-300">
                        {row.monthCounts[m] > 0 ? (
                          <span className="font-bold text-white">{row.monthCounts[m]}</span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-300">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-slate-950 font-bold text-slate-200 border-t-2 border-slate-800 font-mono text-xs">
                <tr>
                  <td className="py-3 px-3 uppercase tracking-wider">Total Mensual</td>
                  {matrizSucursalMes.months.map(m => {
                    const sum = matrizSucursalMes.dataRows.reduce((acc, r) => acc + (r.monthCounts[m] || 0), 0);
                    return (
                      <td key={m} className="py-3 px-2 text-center font-black text-white">
                        {sum}
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-right font-black text-indigo-400">
                    {totalRegistros}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Section 4: DIRECTORIO DE CLIENTES RECURRENTES Y TELÉFONOS DE CONTACTO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-950 text-amber-400 font-bold font-mono text-xs flex items-center justify-center border border-amber-900/50">
                4
              </span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
                Directorio de Clientes Recurrentes y Teléfonos de Contacto
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-8">
              Clientes clave con 2 o más compras registradas. Representan los compradores más fieles para fidelización inmediata.
            </p>
          </div>
          <span className="text-xs bg-amber-950/60 border border-amber-900/60 text-amber-400 px-3 py-1 rounded-full font-mono font-bold">
            {clientesRecurrentes.length} Clientes Recurrentes
          </span>
        </div>

        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="sticky top-0 bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 font-mono z-10">
              <tr>
                <th className="py-3 px-4">Nombre del Cliente</th>
                <th className="py-3 px-4">Teléfono de Contacto</th>
                <th className="py-3 px-3 text-center">Pedidos</th>
                <th className="py-3 px-4">Sucursal Principal</th>
                <th className="py-3 px-4 text-center">Estatus Recurrencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {clientesRecurrentes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    No se encontraron clientes con más de 1 pedido en el periodo.
                  </td>
                </tr>
              ) : (
                clientesRecurrentes.map((c, idx) => {
                  // Find main store
                  let mainStore = 'VARIAS';
                  let maxCount = 0;
                  c.tiendas.forEach((cnt, storeName) => {
                    if (cnt > maxCount) {
                      maxCount = cnt;
                      mainStore = storeName;
                    }
                  });

                  const telStr = Array.from(c.telefonos).join(' / ') || 'Sin teléfono';
                  const isTop = c.total >= 4;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {c.cliente}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-400">
                        {telStr}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-black text-white">
                        <span className="inline-block bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full text-xs">
                          {c.total}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-indigo-950 border border-indigo-900/50 text-indigo-300 px-2.5 py-1 rounded text-[10.5px] font-bold uppercase">
                          {mainStore}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono ${
                          isTop 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                        }`}>
                          {isTop ? '★ Top Frecuente' : 'Recurrente'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: MONITOREO DE PEDIDOS ACTIVOS Y EN RUTA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-950 text-rose-400 font-bold font-mono text-xs flex items-center justify-center border border-rose-900/50">
                5
              </span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
                Monitoreo de Pedidos Activos y en Ruta
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-8">
              Detalle de entregas actualmente en proceso de transporte, carga o programación en tiempo real.
            </p>
          </div>
          <span className="text-xs bg-amber-950/60 border border-amber-900/60 text-amber-400 px-3 py-1 rounded-full font-mono font-bold animate-pulse">
            {pedidosActivosEnRuta.length} Activos en Sistema
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-4">Folio / Ticket</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Sucursal Origen</th>
                <th className="py-3 px-4">Chofer Asignado</th>
                <th className="py-3 px-4 text-center">Estatus Carga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {pedidosActivosEnRuta.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                    No hay pedidos pendientes en proceso en este momento.
                  </td>
                </tr>
              ) : (
                pedidosActivosEnRuta.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-black text-indigo-400">
                      #{p.ticket}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-100">
                      {p.cliente}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded text-[10px] font-bold uppercase">
                        {p.tienda}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-300 flex items-center gap-1.5">
                      <Truck size={13} className="text-teal-400" />
                      {p.chofer || 'Por Asignar'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono ${
                        p.estatus === 'EN RUTA' 
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/60 animate-pulse'
                          : p.estatus === 'CARGADO'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                          : 'bg-indigo-950 text-indigo-400 border border-indigo-800/60'
                      }`}>
                        {p.estatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Operational Note at footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>
            <strong>Nota Operativa:</strong> Este dashboard consolida {totalRegistros} registros extraídos directamente de la base de datos de pedidos y entregas. Los datos de recurrencia y teléfonos permiten ejecutar acciones inmediatas de venta y fidelización.
          </span>
        </div>
      </div>
    </div>
  );
};
