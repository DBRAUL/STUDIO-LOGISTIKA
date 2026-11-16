import React, { useState } from 'react';
import { BarChart3, TrendingUp, PieChart as PieIcon, Timer } from 'lucide-react';
import {
  ResumenSucursalItem,
  ResumenChoferItem,
  TiempoStats,
  formatDurationHuman
} from '../lib/dashboardMetrics';

interface MesItem {
  mesKey: string;
  nombreMes: string;
  procesados: number;
  finalizados: number;
  pendientes: number;
}

interface Props {
  totalRegistros: number;
  entregadosCount: number;
  enProcesoCount: number;
  pctEfectividad: string;
  tiemposGlobales: TiempoStats;
  resumenSucursales: ResumenSucursalItem[];
  resumenChoferes: ResumenChoferItem[];
  mesesOrdenados: MesItem[];
}

export const DashboardCharts: React.FC<Props> = ({
  totalRegistros,
  entregadosCount,
  enProcesoCount,
  pctEfectividad,
  tiemposGlobales,
  resumenSucursales,
  resumenChoferes,
  mesesOrdenados
}) => {
  const [hoveredStore, setHoveredStore] = useState<string | null>(null);
  const [hoveredDriver, setHoveredDriver] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [tiempoView, setTiempoView] = useState<'TIENDAS' | 'CHOFERES'>('TIENDAS');

  const maxStoreTotal = Math.max(...resumenSucursales.map(s => s.total), 1);
  const maxDriverTotal = Math.max(...resumenChoferes.map(c => c.asignados), 1);
  const maxMonthTotal = Math.max(...mesesOrdenados.map(m => m.procesados), 1);

  // Donut calculations
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const effNum = totalRegistros > 0 ? (entregadosCount / totalRegistros) * 100 : 0;
  const effDash = (effNum / 100) * circumference;

  const fastNum = tiemposGlobales.medidos > 0 ? (tiemposGlobales.en24hCount / tiemposGlobales.medidos) * 100 : 0;
  const fastDash = (fastNum / 100) * circumference;

  // Delivery Time Horizontal Bars
  const tiempoRows = tiempoView === 'TIENDAS'
    ? resumenSucursales
        .filter(s => s.tiempos.medidos > 0 && s.tiempos.promedioMs !== null)
        .map(s => ({
          label: s.tienda,
          avgMs: s.tiempos.promedioMs || 0,
          medidos: s.tiempos.medidos,
          en24hPct: s.tiempos.en24hPct
        }))
        .sort((a, b) => a.avgMs - b.avgMs)
    : resumenChoferes
        .filter(c => c.tiempos.medidos > 0 && c.tiempos.promedioMs !== null)
        .map(c => ({
          label: c.chofer,
          avgMs: c.tiempos.promedioMs || 0,
          medidos: c.tiempos.medidos,
          en24hPct: c.tiempos.en24hPct
        }))
        .sort((a, b) => a.avgMs - b.avgMs);

  const maxTiempoMs = Math.max(...tiempoRows.map(r => r.avgMs), 1);

  // SVG Monthly Trend Chart geometry
  const svgW = 540;
  const svgH = 220;
  const padL = 36;
  const padR = 20;
  const padT = 24;
  const padB = 42;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const monthCount = mesesOrdenados.length;
  const slotW = monthCount > 0 ? plotW / monthCount : plotW;
  const barW = Math.min(34, Math.max(14, slotW * 0.45));

  const linePoints = mesesOrdenados
    .map((m, i) => {
      const cx = padL + slotW * i + slotW / 2;
      const cy = padT + plotH - (m.finalizados / maxMonthTotal) * plotH;
      return `${cx},${cy}`;
    })
    .join(' ');

  const mesAbrev: { [k: string]: string } = {
    '01': 'ENE', '02': 'FEB', '03': 'MAR', '04': 'ABR',
    '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AGO',
    '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DIC'
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-900/60 text-indigo-400">
            <BarChart3 size={18} />
          </span>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-100">
              Análisis Visual y Gráficas de KPIs
            </h3>
            <p className="text-[11px] text-slate-400">
              Comparativa gráfica en tiempo real de volumen por sucursal, desempeño por chofer, tendencia mensual y tiempos de entrega.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono font-bold uppercase text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Entregados
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> En Proceso
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span> T. Entrega
          </span>
        </div>
      </div>

      {/* Row 1: Pedidos por Tienda & Carga por Chofer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Pedidos por Tienda (Stacked Horizontal Bars) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Volumen de Pedidos por Tienda / Sucursal
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Proporción de pedidos finalizados frente a pendientes por punto de origen
            </p>
          </div>

          <div className="space-y-3">
            {resumenSucursales.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">Sin datos para graficar.</div>
            ) : (
              resumenSucursales.slice(0, 8).map((s) => {
                const finW = (s.finalizados / maxStoreTotal) * 100;
                const procW = (s.enProceso / maxStoreTotal) * 100;
                const effStore = s.total > 0 ? ((s.finalizados / s.total) * 100).toFixed(0) : '0';
                const isHovered = hoveredStore === s.tienda;
                return (
                  <div
                    key={s.tienda}
                    onMouseEnter={() => setHoveredStore(s.tienda)}
                    onMouseLeave={() => setHoveredStore(null)}
                    className={`p-2 rounded-xl transition ${isHovered ? 'bg-slate-800/60' : ''}`}
                  >
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-bold text-slate-200 truncate max-w-[55%]" title={s.tienda}>
                        {s.tienda}
                      </span>
                      <span className="font-mono text-[10.5px] text-slate-300">
                        <strong className="text-emerald-400">{s.finalizados}</strong> ent. /{' '}
                        <strong className="text-amber-400">{s.enProceso}</strong> pend. ·{' '}
                        <strong className="text-white">{s.total}</strong> ({effStore}%)
                      </span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/80">
                      {s.finalizados > 0 && (
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                          style={{ width: `${finW}%` }}
                          title={`Finalizados: ${s.finalizados}`}
                        />
                      )}
                      {s.enProceso > 0 && (
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                          style={{ width: `${procW}%` }}
                          title={`En proceso: ${s.enProceso}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chart 2: Carga y Cumplimiento por Chofer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              Carga Operativa y Entregas por Chofer
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Comparativa de pedidos asignados, entregados y tiempo promedio por operador
            </p>
          </div>

          <div className="space-y-3">
            {resumenChoferes.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">Sin datos de choferes.</div>
            ) : (
              resumenChoferes.slice(0, 8).map((ch) => {
                const finW = (ch.entregados / maxDriverTotal) * 100;
                const procW = (ch.pendientes / maxDriverTotal) * 100;
                const isHovered = hoveredDriver === ch.chofer;
                return (
                  <div
                    key={ch.chofer}
                    onMouseEnter={() => setHoveredDriver(ch.chofer)}
                    onMouseLeave={() => setHoveredDriver(null)}
                    className={`p-2 rounded-xl transition ${isHovered ? 'bg-slate-800/60' : ''}`}
                  >
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-bold text-slate-200 truncate max-w-[48%]" title={ch.chofer}>
                        {ch.chofer}
                      </span>
                      <span className="font-mono text-[10.5px] text-slate-300 flex items-center gap-2">
                        <span>
                          <strong className="text-emerald-400">{ch.entregados}</strong>/{ch.asignados}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-900/50 text-cyan-300 text-[9.5px] font-bold">
                          ⏱ {formatDurationHuman(ch.tiempos.promedioMs)}
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/80">
                      {ch.entregados > 0 && (
                        <div
                          className="h-full bg-gradient-to-r from-teal-600 to-emerald-400 transition-all duration-500"
                          style={{ width: `${finW}%` }}
                          title={`Entregados: ${ch.entregados}`}
                        />
                      )}
                      {ch.pendientes > 0 && (
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                          style={{ width: `${procW}%` }}
                          title={`Pendientes: ${ch.pendientes}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Tendencia Mensual SVG + Donas KPI + Ranking de Tiempos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 3: Tendencia Mensual SVG (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <TrendingUp size={15} className="text-blue-400" />
                Tendencia Mensual: Procesados vs Finalizados
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Barras = Total pedidos recibidos · Línea verde = Pedidos entregados
              </p>
            </div>
            {hoveredMonth && (
              <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-900/60 px-2.5 py-1 rounded-lg">
                {hoveredMonth}
              </span>
            )}
          </div>

          {mesesOrdenados.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No hay datos mensuales para graficar.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="w-full h-auto min-w-[360px]"
                role="img"
                aria-label="Gráfica de tendencia mensual de pedidos"
              >
                <defs>
                  <linearGradient id="barIndigoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#312e81" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = padT + plotH * (1 - ratio);
                  const val = Math.round(maxMonthTotal * ratio);
                  return (
                    <g key={idx}>
                      <line
                        x1={padL}
                        y1={y}
                        x2={svgW - padR}
                        y2={y}
                        stroke="#1e293b"
                        strokeDasharray={ratio === 0 ? undefined : '3 3'}
                        strokeWidth={1}
                      />
                      <text
                        x={padL - 6}
                        y={y + 3}
                        textAnchor="end"
                        fill="#64748b"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Bars for Procesados */}
                {mesesOrdenados.map((m, i) => {
                  const cx = padL + slotW * i + slotW / 2;
                  const h = (m.procesados / maxMonthTotal) * plotH;
                  const y = padT + plotH - h;
                  const parts = m.mesKey.split('-');
                  const lbl = `${mesAbrev[parts[1]] || parts[1]} ${parts[0]?.slice(2) || ''}`;
                  return (
                    <g
                      key={m.mesKey}
                      onMouseEnter={() =>
                        setHoveredMonth(`${m.nombreMes}: ${m.procesados} proc. / ${m.finalizados} ent.`)
                      }
                      onMouseLeave={() => setHoveredMonth(null)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={cx - barW / 2}
                        y={y}
                        width={barW}
                        height={Math.max(h, 2)}
                        rx={4}
                        fill="url(#barIndigoGrad)"
                      />
                      <text
                        x={cx}
                        y={y - 5}
                        textAnchor="middle"
                        fill="#c7d2fe"
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {m.procesados}
                      </text>
                      <text
                        x={cx}
                        y={svgH - 18}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {lbl}
                      </text>
                    </g>
                  );
                })}

                {/* Trend line for Finalizados */}
                {mesesOrdenados.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={linePoints}
                  />
                )}

                {/* Nodes for Finalizados */}
                {mesesOrdenados.map((m, i) => {
                  const cx = padL + slotW * i + slotW / 2;
                  const cy = padT + plotH - (m.finalizados / maxMonthTotal) * plotH;
                  return (
                    <g key={`dot-${m.mesKey}`}>
                      <circle cx={cx} cy={cy} r={4.5} fill="#0f172a" stroke="#34d399" strokeWidth={2.5} />
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Chart 4: Donas de Cumplimiento & Tiempos Promedio (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col justify-between gap-5">
          {/* Dual Donut Gauges */}
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-3">
              <PieIcon size={15} className="text-emerald-400" />
              Indicadores Circulares de Cumplimiento
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Ring 1: Efectividad */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center">
                <svg width="104" height="104" viewBox="0 0 110 110" className="-rotate-90">
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="11"
                  />
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="11"
                    strokeDasharray={`${effDash} ${circumference}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="-mt-[68px] mb-5 text-center">
                  <span className="block text-base font-black text-white font-mono">{pctEfectividad}%</span>
                  <span className="block text-[9px] text-slate-400 uppercase font-bold">Entregado</span>
                </div>
                <span className="text-[10.5px] font-bold text-emerald-400 text-center">
                  {entregadosCount} Finalizados / {enProcesoCount} Pend.
                </span>
              </div>

              {/* Ring 2: <= 24h */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center">
                <svg width="104" height="104" viewBox="0 0 110 110" className="-rotate-90">
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="11"
                  />
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="transparent"
                    stroke="#06b6d4"
                    strokeWidth="11"
                    strokeDasharray={`${fastDash} ${circumference}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="-mt-[68px] mb-5 text-center">
                  <span className="block text-base font-black text-white font-mono">
                    {tiemposGlobales.medidos > 0 ? `${tiemposGlobales.en24hPct}%` : '—'}
                  </span>
                  <span className="block text-[9px] text-slate-400 uppercase font-bold">≤ 24 Hrs</span>
                </div>
                <span className="text-[10.5px] font-bold text-cyan-400 text-center">
                  Prom: {formatDurationHuman(tiemposGlobales.promedioMs)}
                </span>
              </div>
            </div>
          </div>

          {/* Average Delivery Time Horizontal Comparison */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Timer size={13} className="text-cyan-400" />
                Ranking de Velocidad (Menor = Más Rápido)
              </h4>
              <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[9.5px] font-bold">
                <button
                  type="button"
                  onClick={() => setTiempoView('TIENDAS')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                    tiempoView === 'TIENDAS' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tiendas
                </button>
                <button
                  type="button"
                  onClick={() => setTiempoView('CHOFERES')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                    tiempoView === 'CHOFERES' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Choferes
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[165px] overflow-y-auto pr-1">
              {tiempoRows.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-[11px]">
                  Sin pedidos finalizados con fecha para medir velocidad.
                </div>
              ) : (
                tiempoRows.slice(0, 6).map(row => {
                  const pctBar = Math.max(8, (row.avgMs / maxTiempoMs) * 100);
                  return (
                    <div key={row.label} className="space-y-0.5">
                      <div className="flex justify-between text-[10.5px]">
                        <span className="font-bold text-slate-200 truncate max-w-[55%]" title={row.label}>
                          {row.label}
                        </span>
                        <span className="font-mono font-bold text-cyan-300">
                          {formatDurationHuman(row.avgMs)}{' '}
                          <span className="text-slate-500 font-normal">({row.medidos})</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${pctBar}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
