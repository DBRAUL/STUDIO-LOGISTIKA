import React, { useMemo } from 'react';
import { Pedido, HistorialEntrega, TiendaConfig, LogRuta } from '../types';
import {
  Users,
  Truck,
  Repeat,
  CheckCircle2,
  Clock,
  Calendar,
  ShieldCheck,
  Printer,
  Timer,
  Grid3X3,
  Zap
} from 'lucide-react';
import {
  computeDashboardMetrics,
  formatDurationHuman,
  formatHoursDecimal
} from '../lib/dashboardMetrics';
import { DashboardCharts } from './DashboardCharts';

interface Props {
  pedidos: (Pedido | HistorialEntrega)[];
  tiendas: TiendaConfig[];
  logs?: LogRuta[];
  onPrintDashboard: () => void;
}

export const DashboardGeneralOperaciones: React.FC<Props> = ({
  pedidos,
  logs = [],
  onPrintDashboard
}) => {
  const metrics = useMemo(() => computeDashboardMetrics(pedidos, logs), [pedidos, logs]);

  const {
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
    matrizSucursalMes,
    pedidosActivosEnRuta
  } = metrics;

  const pedidosActivosTop = pedidosActivosEnRuta.slice(0, 15);

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
            Análisis integral de carga de trabajo, cruce Tienda vs Choferes, tiempos de entrega (CARGADO → FINALIZADO) y recurrencia de clientes.
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
            title="Generar e imprimir versión ejecutiva en PDF"
          >
            <Printer size={16} />
            <span>Imprimir Dashboard (PDF Ejecutivo)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (5 cards including Average Delivery Time) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Pedidos Entregados */}
        <div className="bg-slate-900/80 border-t-4 border-t-emerald-500 border-x border-b border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Pedidos Entregados</span>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <div className="text-3xl font-black font-display text-white">
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
            <div className="text-3xl font-black font-display text-amber-400">
              {enProceso.length}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              En Ruta, Cargado o Prog.
            </span>
          </div>
        </div>

        {/* Card 3: Tiempo Promedio Entrega */}
        <div className="bg-slate-900/80 border-t-4 border-t-cyan-500 border-x border-b border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Prom. Entrega</span>
              <Timer size={16} className="text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-display text-cyan-300">
              {formatDurationHuman(tiemposGlobales.promedioMs)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-cyan-400 font-mono truncate">
              {tiemposGlobales.medidos > 0 ? `${tiemposGlobales.en24hPct}% ≤ 24h` : 'Sin datos'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">({tiemposGlobales.medidos} ped.)</span>
          </div>
        </div>

        {/* Card 4: Cartera de Clientes */}
        <div className="bg-slate-900/80 border-t-4 border-t-blue-500 border-x border-b border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Cartera Clientes</span>
              <Users size={16} className="text-blue-400" />
            </div>
            <div className="text-3xl font-black font-display text-white">
              {clientesUnicosCount}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              Clientes Únicos Reg.
            </span>
          </div>
        </div>

        {/* Card 5: Tasa de Recurrencia */}
        <div className="bg-slate-900/80 border-t-4 border-t-indigo-500 border-x border-b border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Tasa Recurrencia</span>
              <Repeat size={16} className="text-indigo-400" />
            </div>
            <div className="text-3xl font-black font-display text-indigo-400">
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

      {/* Visual KPI Charts */}
      <DashboardCharts
        totalRegistros={totalRegistros}
        entregadosCount={entregados.length}
        enProcesoCount={enProceso.length}
        pctEfectividad={pctEfectividad}
        tiemposGlobales={tiemposGlobales}
        resumenSucursales={resumenSucursales}
        resumenChoferes={resumenChoferes}
        mesesOrdenados={mesesOrdenados}
      />

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
                  <th className="py-3 px-4">Tienda / Sucursal</th>
                  <th className="py-3 px-2.5 text-center">Totales</th>
                  <th className="py-3 px-2.5 text-center">Finaliz.</th>
                  <th className="py-3 px-2.5 text-center">Proc.</th>
                  <th className="py-3 px-2.5 text-center">T. Prom.</th>
                  <th className="py-3 px-4 text-right">% Part.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {resumenSucursales.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                      <span className="truncate">{s.tienda}</span>
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono font-black text-slate-100">
                      {s.total}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono text-emerald-400 font-bold">
                      {s.finalizados}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono text-amber-400 font-bold">
                      {s.enProceso}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono text-cyan-300 font-bold whitespace-nowrap">
                      {formatDurationHuman(s.tiempos.promedioMs)}
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
                  <td className="py-3 px-2.5 text-center font-black text-white">{totalRegistros}</td>
                  <td className="py-3 px-2.5 text-center text-emerald-400 font-black">{entregados.length}</td>
                  <td className="py-3 px-2.5 text-center text-amber-400 font-black">{enProceso.length}</td>
                  <td className="py-3 px-2.5 text-center text-cyan-300 font-black whitespace-nowrap">
                    {formatDurationHuman(tiemposGlobales.promedioMs)}
                  </td>
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
              Distribución de entregas asignadas, nivel de cumplimiento y tiempo promedio por chofer.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Operador / Chofer</th>
                  <th className="py-3 px-2.5 text-center">Asig.</th>
                  <th className="py-3 px-2.5 text-center">Entreg.</th>
                  <th className="py-3 px-2.5 text-center">Pend.</th>
                  <th className="py-3 px-2.5 text-center">T. Prom.</th>
                  <th className="py-3 px-4 text-right">% Carga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {resumenChoferes.map((ch, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                      <Truck size={14} className="text-teal-400 shrink-0" />
                      <span className="truncate">{ch.chofer}</span>
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono font-black text-slate-100">
                      {ch.asignados}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono text-emerald-400 font-bold">
                      {ch.entregados}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono text-amber-400 font-bold">
                      {ch.pendientes}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono text-cyan-300 font-bold whitespace-nowrap">
                      {formatDurationHuman(ch.tiempos.promedioMs)}
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
                  <td className="py-3 px-2.5 text-center font-black text-white">{totalRegistros}</td>
                  <td className="py-3 px-2.5 text-center text-emerald-400 font-black">{entregados.length}</td>
                  <td className="py-3 px-2.5 text-center text-amber-400 font-black">{enProceso.length}</td>
                  <td className="py-3 px-2.5 text-center text-cyan-300 font-black whitespace-nowrap">
                    {formatDurationHuman(tiemposGlobales.promedioMs)}
                  </td>
                  <td className="py-3 px-4 text-right text-teal-400 font-black">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* NEW SECTION 2.1: MATRIZ CRUZADA TIENDA VS CHOFERES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-950 text-teal-400 font-bold font-mono text-xs flex items-center justify-center border border-teal-900/50">
                2.1
              </span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Grid3X3 size={15} className="text-teal-400" />
                Matriz Cruzada: Tienda vs Choferes
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-8">
              Cruce de pedidos atendidos por cada operador (chofer) según la tienda / sucursal donde se originó el pedido.
            </p>
          </div>
          <span className="text-[11px] bg-teal-950/60 border border-teal-900/60 text-teal-300 px-3 py-1 rounded-full font-mono font-bold">
            {resumenSucursales.length} Tiendas × {choferesCols.length} Operadores
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-4 sticky left-0 bg-slate-950 z-10 border-r border-slate-800/80">
                  Tienda / Sucursal
                </th>
                {choferesCols.map(col => (
                  <th key={col.key} className="py-3 px-3 text-center whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                <th className="py-3 px-4 text-right bg-slate-950 border-l border-slate-800/80 text-indigo-300">
                  Total Tienda
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {matrizTiendaChofer.length === 0 ? (
                <tr>
                  <td colSpan={choferesCols.length + 2} className="py-10 text-center text-slate-500 text-xs">
                    No hay registros disponibles para construir la matriz Tienda vs Choferes.
                  </td>
                </tr>
              ) : (
                matrizTiendaChofer.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold text-slate-100 sticky left-0 bg-slate-900/95 border-r border-slate-800/60 whitespace-nowrap">
                      {row.tienda}
                    </td>
                    {choferesCols.map(col => {
                      const cnt = row.choferCounts[col.key] || 0;
                      const pctRow = row.total > 0 ? Math.round((cnt / row.total) * 100) : 0;
                      return (
                        <td key={col.key} className="py-3 px-3 text-center font-mono">
                          {cnt > 0 ? (
                            <span
                              title={`${row.tienda} → ${col.label}: ${cnt} pedidos (${pctRow}% de la tienda)`}
                              className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md bg-teal-950/60 border border-teal-800/50 text-teal-300 font-black"
                            >
                              {cnt}
                            </span>
                          ) : (
                            <span className="text-slate-600">0</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-right font-mono font-black text-indigo-300 border-l border-slate-800/60">
                      {row.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-950 font-bold text-slate-200 border-t-2 border-slate-800 font-mono text-xs">
              <tr>
                <td className="py-3 px-4 uppercase tracking-wider sticky left-0 bg-slate-950 border-r border-slate-800/80">
                  Total por Chofer
                </td>
                {choferesCols.map(col => (
                  <td key={col.key} className="py-3 px-3 text-center font-black text-teal-400">
                    {col.total}
                  </td>
                ))}
                <td className="py-3 px-4 text-right font-black text-white border-l border-slate-800/80">
                  {totalRegistros}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* NEW SECTION 2.2: PROMEDIO DE TIEMPOS DE ENTREGA (CARGADO -> FINALIZADO) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 font-bold font-mono text-xs flex items-center justify-center border border-cyan-900/50">
                2.2
              </span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Timer size={15} className="text-cyan-400" />
                Promedio de Tiempos de Entrega (CARGADO → FINALIZADO)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-8">
              Tiempo transcurrido desde que la tienda genera el pedido (fecha de CARGADO) hasta la entrega efectiva al cliente (fecha de FINALIZADO).
            </p>
          </div>
          <span className="text-[11px] bg-cyan-950/60 border border-cyan-900/60 text-cyan-300 px-3 py-1 rounded-full font-mono font-bold">
            Muestra: {tiemposGlobales.medidos} de {entregados.length} finalizados
          </span>
        </div>

        {/* Summary Sub-KPIs for Delivery Time */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-950/40 border-b border-slate-800/80">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Promedio Global de Entrega
            </span>
            <span className="block text-2xl font-black text-cyan-300 font-display mt-1">
              {formatDurationHuman(tiemposGlobales.promedioMs)}
            </span>
            <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
              {formatHoursDecimal(tiemposGlobales.promedioMs)}
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Entregas en ≤ 24 Horas
            </span>
            <span className="block text-2xl font-black text-emerald-400 font-display mt-1">
              {tiemposGlobales.medidos > 0 ? `${tiemposGlobales.en24hPct}%` : '—'}
            </span>
            <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
              {tiemposGlobales.en24hCount} pedidos ({tiemposGlobales.mismoDiaCount} mismo día)
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Zap size={11} className="text-emerald-400" /> Entrega Más Rápida
            </span>
            <span className="block text-2xl font-black text-slate-100 font-display mt-1">
              {formatDurationHuman(tiemposGlobales.minMs)}
            </span>
            <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
              Tiempo mínimo registrado
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tiempo Máximo Registrado
            </span>
            <span className="block text-2xl font-black text-amber-400 font-display mt-1">
              {formatDurationHuman(tiemposGlobales.maxMs)}
            </span>
            <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
              {formatHoursDecimal(tiemposGlobales.maxMs)}
            </span>
          </div>
        </div>

        {/* Two sub-tables: By Store & By Driver */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* By Store */}
          <div className="overflow-x-auto">
            <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 font-mono">
              Tiempos Promedio por Tienda / Sucursal
            </div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-2.5 px-4">Tienda</th>
                  <th className="py-2.5 px-2.5 text-center">Medidos</th>
                  <th className="py-2.5 px-2.5 text-center">Promedio</th>
                  <th className="py-2.5 px-2.5 text-center">Mín / Máx</th>
                  <th className="py-2.5 px-4 text-right">≤ 24h</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {resumenSucursales.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-100">{s.tienda}</td>
                    <td className="py-2.5 px-2.5 text-center font-mono text-slate-300">
                      {s.tiempos.medidos}
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-mono font-black text-cyan-300 whitespace-nowrap">
                      {formatDurationHuman(s.tiempos.promedioMs)}
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-mono text-[10.5px] text-slate-400 whitespace-nowrap">
                      {s.tiempos.medidos > 0
                        ? `${formatDurationHuman(s.tiempos.minMs)} / ${formatDurationHuman(s.tiempos.maxMs)}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {s.tiempos.medidos > 0 ? `${s.tiempos.en24hPct}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* By Driver */}
          <div className="overflow-x-auto">
            <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-teal-300 font-mono">
              Tiempos Promedio por Operador / Chofer
            </div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-2.5 px-4">Chofer</th>
                  <th className="py-2.5 px-2.5 text-center">Medidos</th>
                  <th className="py-2.5 px-2.5 text-center">Promedio</th>
                  <th className="py-2.5 px-2.5 text-center">Mín / Máx</th>
                  <th className="py-2.5 px-4 text-right">≤ 24h</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {resumenChoferes.map((ch, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-100">{ch.chofer}</td>
                    <td className="py-2.5 px-2.5 text-center font-mono text-slate-300">
                      {ch.tiempos.medidos}
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-mono font-black text-cyan-300 whitespace-nowrap">
                      {formatDurationHuman(ch.tiempos.promedioMs)}
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-mono text-[10.5px] text-slate-400 whitespace-nowrap">
                      {ch.tiempos.medidos > 0
                        ? `${formatDurationHuman(ch.tiempos.minMs)} / ${formatDurationHuman(ch.tiempos.maxMs)}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {ch.tiempos.medidos > 0 ? `${ch.tiempos.en24hPct}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
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
            {pedidosActivosTop.length} Activos en Sistema
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
              {pedidosActivosTop.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                    No hay pedidos pendientes en proceso en este momento.
                  </td>
                </tr>
              ) : (
                pedidosActivosTop.map((p, idx) => (
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
            <strong>Nota Operativa:</strong> Este dashboard consolida {totalRegistros} registros extraídos directamente de la base de datos de pedidos y entregas, incluyendo tiempos promedio medidos de CARGADO a FINALIZADO sobre {tiemposGlobales.medidos} pedidos cerrados.
          </span>
        </div>
      </div>
    </div>
  );
};
