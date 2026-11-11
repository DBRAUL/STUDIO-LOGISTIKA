import React, { useState, useEffect, useMemo } from 'react';
import { useLogistika } from '../context/LogistikaContext';
import { 
  procesarDatosAuditoria, 
  obtenerPreciosCombustible, 
  guardarPreciosCombustible, 
  consultarPrecioCDMXServidor, 
  exportarAuditoriaCSV,
  PRECIOS_COMBUSTIBLE_DEFAULT,
  NOMBRES_MESES,
  formatearMesNombre
} from '../services/auditoriaService';
import { 
  BarChart3, 
  Printer, 
  Download, 
  Fuel, 
  Sliders, 
  Calendar, 
  User, 
  TrendingUp, 
  Check, 
  RefreshCw, 
  X, 
  Info,
  Car,
  DollarSign
} from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
  onBackToAuditLogs?: () => void;
}

export const DashboardAuditoria: React.FC<Props> = ({ onBackToAuditLogs }) => {
  const { kilometrajes, unidades } = useLogistika();

  // Filters & Parameters
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('JUL_SEP_2026');
  const [filtroChofer, setFiltroChofer] = useState<string>('TODOS');
  const [rendimientoBase, setRendimientoBase] = useState<number>(9.0);
  const [preciosMes, setPreciosMes] = useState<{ [mesKey: string]: number }>(PRECIOS_COMBUSTIBLE_DEFAULT);
  
  // Modal states
  const [modalPreciosOpen, setModalPreciosOpen] = useState<boolean>(false);
  const [tempPrecios, setTempPrecios] = useState<{ [mesKey: string]: number }>(PRECIOS_COMBUSTIBLE_DEFAULT);
  const [guardandoPrecios, setGuardandoPrecios] = useState<boolean>(false);
  const [consultandoCDMX, setConsultandoCDMX] = useState<boolean>(false);

  // Load monthly prices on mount
  useEffect(() => {
    const cargarPrecios = async () => {
      const p = await obtenerPreciosCombustible();
      setPreciosMes(p);
      setTempPrecios(p);
    };
    cargarPrecios();
  }, []);

  // Process data using calculation engine
  const processedData = useMemo(() => {
    return procesarDatosAuditoria(
      kilometrajes,
      unidades,
      preciosMes,
      filtroPeriodo,
      filtroChofer,
      'TODOS',
      rendimientoBase
    );
  }, [kilometrajes, unidades, preciosMes, filtroPeriodo, filtroChofer, rendimientoBase]);

  // Handle Export to CSV
  const handleExportCSV = () => {
    let periodoLabel = 'Julio - Septiembre 2026';
    if (filtroPeriodo === 'TODOS') periodoLabel = 'Año Completo 2026';
    else if (filtroPeriodo !== 'JUL_SEP_2026') periodoLabel = formatearMesNombre(filtroPeriodo);
    
    exportarAuditoriaCSV(processedData, periodoLabel);
  };

  // Handle Print / Save as PDF
  const handlePrint = () => {
    window.print();
  };

  // Open fuel prices modal
  const handleOpenModalPrecios = () => {
    setTempPrecios({ ...preciosMes });
    setModalPreciosOpen(true);
  };

  // Auto-fetch CDMX price from server
  const handleConsultarPrecioCDMX = async (mesKey: string) => {
    setConsultandoCDMX(true);
    try {
      const res = await consultarPrecioCDMXServidor(mesKey);
      if (res && res.precio) {
        setTempPrecios(prev => ({
          ...prev,
          [mesKey]: res.precio
        }));
        Swal.fire({
          icon: 'success',
          title: 'Precio Actualizado',
          text: `Promedio CDMX para ${formatearMesNombre(mesKey)}: $${res.precio.toFixed(2)} MXN/L (${res.fuente})`,
          background: '#0d1b2a',
          color: '#fff',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Consulta CDMX',
          text: 'Se mantuvo el precio estándar de referencia para la Ciudad de México.',
          background: '#0d1b2a',
          color: '#fff'
        });
      }
    } catch (e: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error de consulta',
        text: 'No se pudo contactar el servicio de precios.',
        background: '#0d1b2a',
        color: '#fff'
      });
    } finally {
      setConsultandoCDMX(false);
    }
  };

  // Save fuel prices to cloud
  const handleGuardarPrecios = async () => {
    setGuardandoPrecios(true);
    const ok = await guardarPreciosCombustible(tempPrecios);
    setGuardandoPrecios(false);
    if (ok) {
      setPreciosMes(tempPrecios);
      setModalPreciosOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Precios Guardados',
        text: 'La tabla de precios mensuales se sincronizó en la nube exitosamente.',
        background: '#0d1b2a',
        color: '#fff',
        timer: 1800,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al guardar los precios.',
        background: '#0d1b2a',
        color: '#fff'
      });
    }
  };

  const getSubtituloPeriodo = () => {
    if (filtroPeriodo === 'JUL_SEP_2026') return 'Periodo Julio - Septiembre 2026';
    if (filtroPeriodo === 'TODOS') return 'Periodo Anual Consolidado 2026';
    return `Periodo ${formatearMesNombre(filtroPeriodo)}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:p-0 print:m-0 print:max-w-none text-slate-100">
      {/* Print Stylesheet injection for 1:1 PDF / Print layout */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-size: 11px !important;
          }
          nav, aside, .no-print, header, .print\\:hidden {
            display: none !important;
          }
          .print\\:text-black {
            color: #000000 !important;
          }
          .print\\:bg-white {
            background-color: #ffffff !important;
          }
          .print\\:border-slate-300 {
            border-color: #cbd5e1 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print-header-navy {
            background-color: #0d2238 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-kpi-card {
            background-color: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-table-th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: bold !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-badge-placa {
            background-color: #e0f2fe !important;
            color: #0369a1 !important;
            border: 1px solid #7dd3fc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* TOP EXECUTIVE HEADER */}
      <div className="bg-[#0b1f36] border border-slate-800/80 rounded-2xl p-6 shadow-xl print-header-navy relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none print:hidden"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 print:hidden">
                <BarChart3 size={20} />
              </span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                Dashboard de Auditoría de Unidades
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-1.5 flex items-center gap-2">
              <span>Reporte Consolidado por Chofer, Unidad, Kilometraje y Consumo de Combustible</span>
              <span className="text-blue-400 font-bold">|</span>
              <span className="text-emerald-400 font-bold">{getSubtituloPeriodo()}</span>
            </p>
          </div>

          {/* Action buttons (Print, Excel, Precios, Volver) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
            {onBackToAuditLogs && (
              <button
                onClick={onBackToAuditLogs}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              >
                ← Bitácora Diaria
              </button>
            )}

            <button
              onClick={handleOpenModalPrecios}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer flex items-center gap-1.5"
              title="Configurar precios de combustible por mes"
            >
              <Fuel size={14} className="text-amber-400" />
              <span>Precios Combustible</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow shadow-emerald-950/30 transition cursor-pointer flex items-center gap-1.5"
              title="Descargar archivo en formato Excel (CSV UTF-8)"
            >
              <Download size={14} />
              <span>Excel (CSV)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-950/40 transition cursor-pointer flex items-center gap-1.5"
              title="Imprimir o Guardar como PDF"
            >
              <Printer size={14} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS TOOLBAR (Hidden in Print) */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
              <Calendar size={13} className="text-blue-400" /> Periodo:
            </span>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="JUL_SEP_2026">Julio - Septiembre 2026 (Consolidado)</option>
              <option value="TODOS">Todo el Año 2026 (Anual)</option>
              {processedData.mesesDisponibles.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Chofer filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
              <User size={13} className="text-blue-400" /> Chofer:
            </span>
            <select
              value={filtroChofer}
              onChange={(e) => setFiltroChofer(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="TODOS">Todos los Choferes</option>
              {processedData.choferesDisponibles.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Base Rendimiento (km/L) */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
              <Sliders size={13} className="text-emerald-400" /> Rendimiento:
            </span>
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
              <input
                type="number"
                step="0.1"
                min="1"
                max="30"
                value={rendimientoBase}
                onChange={(e) => setRendimientoBase(Number(e.target.value) || 9.0)}
                className="w-12 bg-transparent text-right text-xs font-bold text-emerald-400 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 font-semibold">km/L</span>
            </div>
          </div>
        </div>

        {/* Reset filter button */}
        {(filtroPeriodo !== 'JUL_SEP_2026' || filtroChofer !== 'TODOS' || rendimientoBase !== 9.0) && (
          <button
            onClick={() => {
              setFiltroPeriodo('JUL_SEP_2026');
              setFiltroChofer('TODOS');
              setRendimientoBase(9.0);
            }}
            className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
          >
            Restablecer a Julio - Septiembre
          </button>
        )}
      </div>

      {/* 4 KPI CARDS (Matches PDF exactly) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Kilometraje Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm print-kpi-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Kilometraje Total
          </span>
          <div className="text-2xl lg:text-3xl font-black text-slate-100 font-mono tracking-tight print:text-black">
            {processedData.kpis.kilometrajeTotal.toLocaleString()} km
          </div>
          <span className="text-xs text-slate-400 font-semibold mt-1 block">
            {processedData.kpis.totalViajes} Recorridos
          </span>
        </div>

        {/* Card 2: Promedio / Viaje */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm print-kpi-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Promedio / Viaje
          </span>
          <div className="text-2xl lg:text-3xl font-black text-slate-100 font-mono tracking-tight print:text-black">
            {processedData.kpis.promedioPorViaje.toLocaleString()} km
          </div>
          <span className="text-xs text-emerald-400 font-semibold mt-1 block">
            Eficiencia General
          </span>
        </div>

        {/* Card 3: Consumo Estimado */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm print-kpi-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Consumo Est.
          </span>
          <div className="text-2xl lg:text-3xl font-black text-amber-400 font-mono tracking-tight print:text-black">
            {processedData.kpis.consumoEstLitros.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
          </div>
          <span className="text-xs text-slate-400 font-semibold mt-1 block">
            Base {processedData.kpis.rendimientoBase.toFixed(1)} km/L
          </span>
        </div>

        {/* Card 4: Gasto Combustible */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm print-kpi-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Gasto Combustible
          </span>
          <div className="text-2xl lg:text-3xl font-black text-emerald-400 font-mono tracking-tight print:text-black">
            ${processedData.kpis.gastoCombustibleTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 font-semibold mt-1 block">
            MXN (${processedData.kpis.costoPorLitroPonderado.toFixed(2)}/L)
          </span>
        </div>
      </div>

      {/* SECTION 1: RESUMEN ACUMULADO POR CHOFER Y UNIDAD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm print:bg-white print:border-slate-300">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2 print:border-slate-300">
          <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
          <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase print:text-black">
            1. Resumen Acumulado por Chofer y Unidad
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 print:text-black">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 print-table-th">
              <tr>
                <th className="py-3 px-4 font-bold">Chofer / Operador</th>
                <th className="py-3 px-3 font-bold">Placa</th>
                <th className="py-3 px-3 font-bold text-center">Viajes</th>
                <th className="py-3 px-3 font-bold text-right">Kms Totales</th>
                <th className="py-3 px-3 font-bold text-center">% Total</th>
                <th className="py-3 px-3 font-bold text-right">Odo. Inicial</th>
                <th className="py-3 px-3 font-bold text-right">Odo. Final</th>
                <th className="py-3 px-3 font-bold text-right">Consumo Est. (L)</th>
                <th className="py-3 px-4 font-bold text-right">Costo Est. (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-slate-200 font-medium">
              {processedData.resumenChoferes.map((c) => (
                <tr key={c.chofer} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-slate-100 print:text-black flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    {c.chofer}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60 text-[11px] font-mono font-bold print-badge-placa">
                      {c.placa}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{c.viajes}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-100 print:text-black">
                    {c.kmsTotales.toLocaleString()} km
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {c.pctTotal.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {c.odoInicial > 0 ? `${c.odoInicial.toLocaleString()} km` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {c.odoFinal > 0 ? `${c.odoFinal.toLocaleString()} km` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-300 print:text-black">
                    {c.consumoEstLitros.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 print:text-black">
                    ${c.costoEstMxn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {/* TOTAL ROW */}
              <tr className="bg-slate-950/90 font-bold border-t-2 border-slate-700 print:border-black print:bg-slate-100 text-slate-100 print:text-black">
                <td className="py-3 px-4 uppercase tracking-wider text-[11px]" colSpan={2}>
                  TOTALES
                </td>
                <td className="py-3 px-3 text-center font-mono">
                  {processedData.kpis.totalViajes}
                </td>
                <td className="py-3 px-3 text-right font-mono text-blue-400 print:text-black">
                  {processedData.kpis.kilometrajeTotal.toLocaleString()} km
                </td>
                <td className="py-3 px-3 text-center font-mono">100.0%</td>
                <td className="py-3 px-3 text-right text-slate-500">—</td>
                <td className="py-3 px-3 text-right text-slate-500">—</td>
                <td className="py-3 px-3 text-right font-mono text-amber-300 print:text-black">
                  {processedData.kpis.consumoEstLitros.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400 print:text-black text-sm">
                  ${processedData.kpis.gastoCombustibleTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: RESUMEN COMPARATIVO POR MES */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm print:bg-white print:border-slate-300">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between print:border-slate-300">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase print:text-black">
              2. Resumen Comparativo por Mes
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 print:hidden font-mono">
            {processedData.resumenMeses.length} meses auditados
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 print:text-black">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 print-table-th">
              <tr>
                <th className="py-3 px-4 font-bold">Mes</th>
                <th className="py-3 px-3 font-bold text-center">Viajes</th>
                <th className="py-3 px-3 font-bold text-right">Kms Totales</th>
                <th className="py-3 px-3 font-bold text-center">% Total</th>
                <th className="py-3 px-3 font-bold text-right">Promedio / Viaje</th>
                <th className="py-3 px-3 font-bold text-right">Consumo Est. (L)</th>
                <th className="py-3 px-3 font-bold text-center">Precio / L</th>
                <th className="py-3 px-4 font-bold text-right">Costo Est. (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-slate-200 font-medium">
              {processedData.resumenMeses.map((m) => (
                <tr key={m.mesKey} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-slate-100 print:text-black flex items-center gap-2">
                    <Calendar size={13} className="text-emerald-400 print:hidden" />
                    {m.nombreMes}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{m.viajes}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-100 print:text-black">
                    {m.kmsTotales.toLocaleString()} km
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {m.pctTotal.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300 print:text-black">
                    {m.promedioViaje.toFixed(1)} km
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-300 print:text-black">
                    {m.consumoEstLitros.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                    ${m.precioMes.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 print:text-black">
                    ${m.costoEstMxn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {/* TOTAL ROW */}
              <tr className="bg-slate-950/90 font-bold border-t-2 border-slate-700 print:border-black print:bg-slate-100 text-slate-100 print:text-black">
                <td className="py-3 px-4 uppercase tracking-wider text-[11px]">TOTALES</td>
                <td className="py-3 px-3 text-center font-mono">{processedData.kpis.totalViajes}</td>
                <td className="py-3 px-3 text-right font-mono text-blue-400 print:text-black">
                  {processedData.kpis.kilometrajeTotal.toLocaleString()} km
                </td>
                <td className="py-3 px-3 text-center font-mono">100.0%</td>
                <td className="py-3 px-3 text-right font-mono">
                  {processedData.kpis.promedioPorViaje.toFixed(1)} km
                </td>
                <td className="py-3 px-3 text-right font-mono text-amber-300 print:text-black">
                  {processedData.kpis.consumoEstLitros.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
                </td>
                <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                  ${processedData.kpis.costoPorLitroPonderado.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400 print:text-black text-sm">
                  ${processedData.kpis.gastoCombustibleTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: DESGLOSE DETALLADO POR MES Y CHOFER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm print:bg-white print:border-slate-300">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between print:border-slate-300">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase print:text-black">
              3. Desglose Detallado por Mes y Chofer
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 print:hidden font-mono">
            {processedData.desgloseDetallado.length} registros
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 print:text-black">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 print-table-th">
              <tr>
                <th className="py-3 px-4 font-bold">Mes</th>
                <th className="py-3 px-4 font-bold">Chofer</th>
                <th className="py-3 px-3 font-bold">Placa</th>
                <th className="py-3 px-3 font-bold text-center">Viajes</th>
                <th className="py-3 px-3 font-bold text-right">Kms Recorridos</th>
                <th className="py-3 px-3 font-bold text-right">Consumo Est. (L)</th>
                <th className="py-3 px-3 font-bold text-center">Precio / L</th>
                <th className="py-3 px-4 font-bold text-right">Costo Est. (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-slate-200 font-medium">
              {processedData.desgloseDetallado.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-4 font-medium text-slate-300 print:text-black">
                    {d.nombreMes}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-100 print:text-black">
                    {d.chofer}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60 text-[10px] font-mono font-bold print-badge-placa">
                      {d.placa}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">{d.viajes}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100 print:text-black">
                    {d.kmsRecorridos.toLocaleString()} km
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-300 print:text-black">
                    {d.consumoEstLitros.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-xs">
                    ${d.precioMes.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400 print:text-black">
                    ${d.costoEstMxn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTNOTE (Exactly as in user PDF) */}
      <div className="text-center py-4 border-t border-slate-800 print:border-slate-300">
        <p className="text-[11px] text-slate-400 print:text-slate-600 italic">
          Cálculos basados en rendimiento estimado de {rendimientoBase.toFixed(1)} km/L y costo promedio de gasolina de ${processedData.kpis.costoPorLitroPonderado.toFixed(2)} MXN/L. Documento generado automáticamente.
        </p>
      </div>

      {/* FUEL PRICES MANAGEMENT MODAL */}
      {modalPreciosOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setModalPreciosOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 cursor-default relative text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Fuel size={20} />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-100">Precios de Combustible por Mes</h3>
                  <p className="text-xs text-slate-400">Gasolina Regular / Magna (MXN por Litro)</p>
                </div>
              </div>
              <button 
                onClick={() => setModalPreciosOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Note banner */}
            <div className="my-4 p-3 rounded-xl bg-blue-950/40 border border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-200">
              <Info size={16} className="shrink-0 mt-0.5 text-blue-400" />
              <p>
                Julio, Agosto y Septiembre de 2026 se mantienen fijos en <strong>$24.50/L</strong> conforme a lo acordado. Para los siguientes meses (Octubre, Noviembre, etc.) puedes ingresar el precio manual o presionar <strong>"Consultar CDMX"</strong> para obtener el promedio en línea.
              </p>
            </div>

            {/* Months List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1 my-2">
              {['2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'].map((mesKey) => {
                const isFixed = ['2026-07', '2026-08', '2026-09'].includes(mesKey);
                const val = tempPrecios[mesKey] !== undefined ? tempPrecios[mesKey] : 24.50;

                return (
                  <div key={mesKey} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-xs text-slate-200 block">
                        {formatearMesNombre(mesKey)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isFixed ? 'Fijo acordado' : 'Ajustable / CDMX'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-slate-400 text-xs font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          disabled={isFixed}
                          value={val}
                          onChange={(e) => {
                            const newP = parseFloat(e.target.value);
                            setTempPrecios(prev => ({
                              ...prev,
                              [mesKey]: isNaN(newP) ? 0 : newP
                            }));
                          }}
                          className={`w-20 pl-5 pr-2 py-1 text-right text-xs font-mono font-bold rounded-lg border focus:outline-none ${
                            isFixed 
                              ? 'bg-slate-900 border-slate-800 text-slate-400 cursor-not-allowed' 
                              : 'bg-slate-900 border-slate-700 text-emerald-400 focus:ring-1 focus:ring-emerald-500'
                          }`}
                        />
                      </div>

                      {!isFixed && (
                        <button
                          type="button"
                          onClick={() => handleConsultarPrecioCDMX(mesKey)}
                          disabled={consultandoCDMX}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] flex items-center gap-1 cursor-pointer transition"
                          title="Consultar promedio CDMX en la web"
                        >
                          <RefreshCw size={11} className={consultandoCDMX ? 'animate-spin' : ''} />
                          <span>CDMX</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalPreciosOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoPrecios}
                onClick={handleGuardarPrecios}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow shadow-emerald-950/40 transition cursor-pointer flex items-center gap-2"
              >
                {guardandoPrecios ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Guardar Precios en la Nube
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
