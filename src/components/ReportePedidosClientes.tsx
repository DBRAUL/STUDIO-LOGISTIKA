import React, { useState, useMemo } from 'react';
import { Pedido, HistorialEntrega, TiendaConfig } from '../types';
import { 
  FileText, 
  Download, 
  Printer, 
  Store, 
  Users, 
  MapPin, 
  Search, 
  CheckCircle2, 
  Calendar,
  Building2,
  Package,
  ArrowUpDown,
  Filter,
  BarChart3,
  Repeat,
  ShieldCheck
} from 'lucide-react';
import { formatedDisplayDate, formatedDisplayDateTime } from '../context/LogistikaContext';
import { DashboardGeneralOperaciones } from './DashboardGeneralOperaciones';

interface Props {
  pedidosActivos: Pedido[];
  historialEntregas: HistorialEntrega[];
  tiendas: TiendaConfig[];
}

export const ReportePedidosClientes: React.FC<Props> = ({
  pedidosActivos,
  historialEntregas,
  tiendas
}) => {
  // Filters
  const [origenDatos, setOrigenDatos] = useState<'TODOS' | 'ACTIVOS' | 'HISTORIAL'>('TODOS');
  const [filtroTienda, setFiltroTienda] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('TODOS');
  const [vistaAgrupada, setVistaAgrupada] = useState<'DASHBOARD' | 'CLIENTES' | 'TIENDAS' | 'DETALLADO'>('DASHBOARD');
  const [ordenarPor, setOrdenarPor] = useState<'pedidos' | 'nombre' | 'tienda'>('pedidos');

  // Combine datasets
  const todosLosPedidos = useMemo(() => {
    let dataset: (Pedido | HistorialEntrega)[] = [];
    if (origenDatos === 'TODOS') {
      dataset = [...pedidosActivos, ...historialEntregas];
    } else if (origenDatos === 'ACTIVOS') {
      dataset = [...pedidosActivos];
    } else {
      dataset = [...historialEntregas];
    }

    // Eliminate duplicates by ticket if any exist across both collections
    const ticketMap = new Map<string, Pedido | HistorialEntrega>();
    dataset.forEach(item => {
      if (item.ticket && !ticketMap.has(item.ticket)) {
        ticketMap.set(item.ticket, item);
      }
    });

    return Array.from(ticketMap.values());
  }, [pedidosActivos, historialEntregas, origenDatos]);

  // Filtered dataset
  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return todosLosPedidos.filter(p => {
      // Filter by Tienda
      if (filtroTienda !== 'TODAS' && (p.tienda || '').toUpperCase() !== filtroTienda.toUpperCase()) {
        return false;
      }
      // Filter by Estatus
      if (filtroEstatus !== 'TODOS' && p.estatus !== filtroEstatus) {
        return false;
      }
      // Search term
      if (q) {
        const matchCliente = (p.cliente || '').toLowerCase().includes(q);
        const matchTicket = (p.ticket || '').toLowerCase().includes(q);
        const matchTel = (p.tel || '').toLowerCase().includes(q);
        const matchDir = (p.dir || '').toLowerCase().includes(q);
        const matchTienda = (p.tienda || '').toLowerCase().includes(q);
        const matchChofer = (p.chofer || '').toLowerCase().includes(q);
        if (!matchCliente && !matchTicket && !matchTel && !matchDir && !matchTienda && !matchChofer) {
          return false;
        }
      }
      return true;
    });
  }, [todosLosPedidos, filtroTienda, filtroEstatus, busqueda]);

  // Grouped by Client
  const reporteClientes = useMemo(() => {
    const map = new Map<string, {
      cliente: string;
      telefonos: Set<string>;
      direcciones: Set<string>;
      tiendas: Set<string>;
      tickets: string[];
      totalPedidos: number;
      entregados: number;
      enProceso: number;
      ultimoPedidoFecha: string;
    }>();

    pedidosFiltrados.forEach(p => {
      const cliKey = (p.cliente || 'CLIENTE SIN NOMBRE').trim().toUpperCase();
      if (!map.has(cliKey)) {
        map.set(cliKey, {
          cliente: p.cliente || 'CLIENTE SIN NOMBRE',
          telefonos: new Set<string>(),
          direcciones: new Set<string>(),
          tiendas: new Set<string>(),
          tickets: [],
          totalPedidos: 0,
          entregados: 0,
          enProceso: 0,
          ultimoPedidoFecha: p.fecha || ''
        });
      }

      const rec = map.get(cliKey)!;
      if (p.tel) rec.telefonos.add(p.tel.trim());
      if (p.dir) rec.direcciones.add(p.dir.trim());
      if (p.tienda) rec.tiendas.add(p.tienda.trim());
      rec.tickets.push(p.ticket);
      rec.totalPedidos++;
      if (p.estatus === 'FINALIZADO') {
        rec.entregados++;
      } else {
        rec.enProceso++;
      }

      if (p.fecha && (!rec.ultimoPedidoFecha || p.fecha > rec.ultimoPedidoFecha)) {
        rec.ultimoPedidoFecha = p.fecha;
      }
    });

    const lista = Array.from(map.values()).map(item => ({
      ...item,
      telefonosStr: Array.from(item.telefonos).join(', ') || 'Sin teléfono',
      direccionesStr: Array.from(item.direcciones).slice(0, 2).join(' | ') || 'Sin dirección',
      tiendasStr: Array.from(item.tiendas).join(', ') || 'N/D'
    }));

    if (ordenarPor === 'pedidos') {
      lista.sort((a, b) => b.totalPedidos - a.totalPedidos);
    } else if (ordenarPor === 'nombre') {
      lista.sort((a, b) => a.cliente.localeCompare(b.cliente));
    } else {
      lista.sort((a, b) => a.tiendasStr.localeCompare(b.tiendasStr));
    }

    return lista;
  }, [pedidosFiltrados, ordenarPor]);

  // Grouped by Tienda
  const reportePorTienda = useMemo(() => {
    const map = new Map<string, {
      tienda: string;
      totalPedidos: number;
      clientesUnicos: Set<string>;
      entregados: number;
      enProceso: number;
      tickets: string[];
    }>();

    pedidosFiltrados.forEach(p => {
      const tiendaKey = (p.tienda || 'SIN SUCURSAL').trim().toUpperCase();
      if (!map.has(tiendaKey)) {
        map.set(tiendaKey, {
          tienda: p.tienda || 'SIN SUCURSAL',
          totalPedidos: 0,
          clientesUnicos: new Set<string>(),
          entregados: 0,
          enProceso: 0,
          tickets: []
        });
      }
      const item = map.get(tiendaKey)!;
      item.totalPedidos++;
      if (p.cliente) item.clientesUnicos.add(p.cliente.trim().toUpperCase());
      if (p.estatus === 'FINALIZADO') item.entregados++;
      else item.enProceso++;
      item.tickets.push(p.ticket);
    });

    return Array.from(map.values()).sort((a, b) => b.totalPedidos - a.totalPedidos);
  }, [pedidosFiltrados]);

  // Overall KPI metrics
  const totalPedidosCount = pedidosFiltrados.length;
  const totalClientesUnicos = new Set(pedidosFiltrados.map(p => (p.cliente || '').trim().toUpperCase())).size;
  const totalEntregadosCount = pedidosFiltrados.filter(p => p.estatus === 'FINALIZADO').length;
  const totalEnProcesoCount = totalPedidosCount - totalEntregadosCount;

  // Export to CSV
  const exportarCSV = () => {
    const headers = [
      'Ticket',
      'Fecha Creación',
      'Tienda',
      'Cliente',
      'Teléfono',
      'Dirección',
      'Referencias',
      'Tipo Carga',
      'Estatus',
      'Chofer Asignado',
      'Fecha Envío',
      'Observaciones Tienda',
      'Receptor Final',
      'Fecha Finalizado'
    ];

    const filas = pedidosFiltrados.map(p => [
      `"${p.ticket || ''}"`,
      `"${p.fecha || ''}"`,
      `"${p.tienda || ''}"`,
      `"${(p.cliente || '').replace(/"/g, '""')}"`,
      `"${p.tel || ''}"`,
      `"${(p.dir || '').replace(/"/g, '""')}"`,
      `"${(p.ref || '').replace(/"/g, '""')}"`,
      `"${p.tipo || ''}"`,
      `"${p.estatus || ''}"`,
      `"${p.chofer || ''}"`,
      `"${p.dateenv || ''}"`,
      `"${(p.obs || '').replace(/"/g, '""')}"`,
      `"${p.receptor || ''}"`,
      `"${p.fechaFinalizado || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...filas.map(f => f.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_pedidos_clientes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Clients Directory CSV
  const exportarDirectorioClientesCSV = () => {
    const headers = [
      'Cliente',
      'Teléfonos',
      'Sucursales / Tiendas',
      'Direcciones Frecuentes',
      'Total Pedidos',
      'Pedidos Entregados',
      'Pedidos en Proceso',
      'Último Pedido'
    ];

    const filas = reporteClientes.map(c => [
      `"${c.cliente.replace(/"/g, '""')}"`,
      `"${c.telefonosStr}"`,
      `"${c.tiendasStr}"`,
      `"${c.direccionesStr.replace(/"/g, '""')}"`,
      c.totalPedidos,
      c.entregados,
      c.enProceso,
      `"${c.ultimoPedidoFecha}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...filas.map(f => f.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `directorio_clientes_por_tienda_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dedicated 3-Page Executive Dashboard Print PDF generator (mirroring official document)
  const handleImprimirDashboardPDF = () => {
    // 1. Group data for the 5 sections
    const totalRegistros = todosLosPedidos.length;
    const entregados = todosLosPedidos.filter(p => p.estatus === 'FINALIZADO');
    const enProceso = todosLosPedidos.filter(p => p.estatus !== 'FINALIZADO');
    const pctEfectividad = totalRegistros > 0 ? ((entregados.length / totalRegistros) * 100).toFixed(1) : '0';

    // Clients
    const clientesMap = new Map<string, { cliente: string; telefonos: Set<string>; tiendas: Map<string, number>; tickets: string[]; total: number }>();
    todosLosPedidos.forEach(p => {
      const cliKey = (p.cliente || 'CLIENTE SIN NOMBRE').trim().toUpperCase();
      if (!clientesMap.has(cliKey)) {
        clientesMap.set(cliKey, { cliente: p.cliente || 'CLIENTE SIN NOMBRE', telefonos: new Set(), tiendas: new Map(), tickets: [], total: 0 });
      }
      const c = clientesMap.get(cliKey)!;
      c.total++;
      c.tickets.push(p.ticket);
      if (p.tel) c.telefonos.add(p.tel.trim());
      const tKey = p.tienda ? p.tienda.trim().toUpperCase() : 'SIN SUCURSAL';
      c.tiendas.set(tKey, (c.tiendas.get(tKey) || 0) + 1);
    });

    const clientesUnicosCount = clientesMap.size;
    const clientesRecurrentes = Array.from(clientesMap.values())
      .filter(c => c.total >= 2)
      .sort((a, b) => b.total - a.total);
    const tasaRecurrencia = clientesUnicosCount > 0 ? ((clientesRecurrentes.length / clientesUnicosCount) * 100).toFixed(1) : '0';

    // Section 1: Sucursales
    const sucursalesMap = new Map<string, { tienda: string; total: number; finalizados: number; enProceso: number }>();
    todosLosPedidos.forEach(p => {
      const tKey = (p.tienda || 'SIN SUCURSAL').trim().toUpperCase();
      if (!sucursalesMap.has(tKey)) sucursalesMap.set(tKey, { tienda: p.tienda || 'SIN SUCURSAL', total: 0, finalizados: 0, enProceso: 0 });
      const s = sucursalesMap.get(tKey)!;
      s.total++;
      if (p.estatus === 'FINALIZADO') s.finalizados++;
      else s.enProceso++;
    });
    const resumenSucursales = Array.from(sucursalesMap.values())
      .map(s => ({ ...s, pct: totalRegistros > 0 ? ((s.total / totalRegistros) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.total - a.total);

    // Section 2: Choferes
    const choferesMap = new Map<string, { chofer: string; asignados: number; entregados: number; pendientes: number }>();
    todosLosPedidos.forEach(p => {
      const chKey = p.chofer ? p.chofer.trim().toUpperCase() : 'SIN ASIGNAR / OTROS';
      if (!choferesMap.has(chKey)) choferesMap.set(chKey, { chofer: p.chofer ? p.chofer.trim() : 'SIN ASIGNAR / OTROS', asignados: 0, entregados: 0, pendientes: 0 });
      const ch = choferesMap.get(chKey)!;
      ch.asignados++;
      if (p.estatus === 'FINALIZADO') ch.entregados++;
      else ch.pendientes++;
    });
    const resumenChoferes = Array.from(choferesMap.values())
      .map(ch => ({ ...ch, pct: totalRegistros > 0 ? ((ch.asignados / totalRegistros) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.asignados - a.asignados);

    // Section 3: Meses
    const mesesMap = new Map<string, { mesKey: string; nombreMes: string; procesados: number; finalizados: number; pendientes: number }>();
    const nombresMes: { [k: string]: string } = {
      '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
      '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
      '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    };
    todosLosPedidos.forEach(p => {
      const f = p.fecha || p.dateenv || '';
      let mKey = f.length >= 7 ? f.substring(0, 7) : '2026-11';
      if (!mesesMap.has(mKey)) {
        const [yyyy, mm] = mKey.split('-');
        mesesMap.set(mKey, { mesKey: mKey, nombreMes: `${nombresMes[mm] || mm} ${yyyy}`, procesados: 0, finalizados: 0, pendientes: 0 });
      }
      const item = mesesMap.get(mKey)!;
      item.procesados++;
      if (p.estatus === 'FINALIZADO') item.finalizados++;
      else item.pendientes++;
    });
    const mesesOrdenados = Array.from(mesesMap.values()).sort((a, b) => a.mesKey.localeCompare(b.mesKey));

    // Section 3.1: Matriz Cruzada
    const monthsKeys = mesesOrdenados.map(m => m.mesKey);
    const matrizRows = resumenSucursales.map(s => {
      const mCounts: { [m: string]: number } = {};
      monthsKeys.forEach(m => { mCounts[m] = 0; });
      todosLosPedidos.forEach(p => {
        if ((p.tienda || '').toUpperCase() === s.tienda.toUpperCase()) {
          const f = p.fecha || p.dateenv || '';
          let mKey = f.length >= 7 ? f.substring(0, 7) : '2026-11';
          if (mCounts[mKey] !== undefined) mCounts[mKey]++;
        }
      });
      return { tienda: s.tienda, total: s.total, mCounts };
    });

    // Section 5: Activos en ruta
    const pedidosActivos = todosLosPedidos.filter(p => p.estatus !== 'FINALIZADO');

    const printWin = window.open('', '_blank');
    if (!printWin) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Dashboard General de Pedidos y Operaciones - LOGISTIKA</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 12mm 15mm 12mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background: #fff;
            font-size: 11px;
            line-height: 1.4;
          }
          .page-container {
            page-break-after: always;
            position: relative;
            min-height: 250mm;
            padding-bottom: 25px;
          }
          .page-container:last-child {
            page-break-after: auto;
          }
          .header-meta {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
          }
          .tagline {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #0284c7;
            letter-spacing: 1px;
            margin-bottom: 4px;
          }
          h1 {
            font-size: 26px;
            font-weight: 900;
            margin: 0 0 6px 0;
            color: #0f172a;
            letter-spacing: -0.5px;
            line-height: 1.15;
          }
          .subtitle {
            font-size: 12px;
            color: #475569;
            margin: 0;
            max-width: 460px;
          }
          .info-box {
            text-align: right;
            font-size: 11px;
            color: #334155;
            line-height: 1.4;
          }
          .info-box strong {
            color: #0f172a;
          }
          .kpi-row {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
          }
          .kpi-card {
            flex: 1;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #0284c7;
            background: #f8fafc;
            padding: 12px 14px;
            border-radius: 4px;
          }
          .kpi-card:nth-child(1) { border-left-color: #059669; }
          .kpi-card:nth-child(2) { border-left-color: #d97706; }
          .kpi-card:nth-child(3) { border-left-color: #2563eb; }
          .kpi-card:nth-child(4) { border-left-color: #4f46e5; }
          .kpi-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #475569;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .kpi-num {
            font-size: 26px;
            font-weight: 900;
            color: #0f172a;
            line-height: 1;
            margin-bottom: 4px;
          }
          .kpi-sub {
            font-size: 10px;
            color: #64748b;
          }
          h2 {
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #1e3a8a;
            margin: 20px 0 4px 0;
          }
          .sec-desc {
            font-size: 10.5px;
            color: #475569;
            margin: 0 0 10px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-bottom: 18px;
          }
          th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-weight: 800;
            text-align: left;
            padding: 8px 10px;
            text-transform: uppercase;
            font-size: 9.5px;
            letter-spacing: 0.5px;
            border: 1px solid #1e3a8a;
          }
          td {
            padding: 7px 10px;
            border: 1px solid #cbd5e1;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          tfoot td {
            background-color: #f1f5f9;
            font-weight: 800;
            border-top: 2px solid #94a3b8;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .badge-top { background: #dcfce7; color: #166534; }
          .badge-rec { background: #dbeafe; color: #1e40af; }
          .badge-ruta { background: #fef3c7; color: #92400e; }
          .badge-cargado { background: #e0e7ff; color: #3730a3; }
          .badge-prog { background: #f1f5f9; color: #475569; }
          .footer-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 9.5px;
            color: #94a3b8;
          }
          .note-box {
            background: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 10px 14px;
            font-size: 10.5px;
            color: #1e3a8a;
            border-radius: 0 4px 4px 0;
            margin-top: 14px;
          }
        </style>
      </head>
      <body>
        <!-- ==================== PÁGINA 1 ==================== -->
        <div class="page-container">
          <div class="header-meta">
            <div>
              <div class="tagline">REPORTES DE LOGISTIKA</div>
              <h1>Dashboard General de Pedidos y<br/>Operaciones</h1>
              <p class="subtitle">Análisis Integral de Carga de Trabajo, Operadores, Sucursales y Recurrencia de Clientes</p>
            </div>
            <div class="info-box">
              <div>Periodo: <strong>Jun - Nov 2026</strong></div>
              <div>Total Pedidos: <strong>${totalRegistros} registros</strong></div>
              <div>Fecha Emisión: <strong>${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
            </div>
          </div>

          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-title">PEDIDOS ENTREGADOS</div>
              <div class="kpi-num">${entregados.length}</div>
              <div class="kpi-sub">${pctEfectividad}% Efectividad Operativa</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">PEDIDOS PENDIENTES</div>
              <div class="kpi-num" style="color: #d97706;">${enProceso.length}</div>
              <div class="kpi-sub">En Ruta, Cargado o Programado</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">CARTERA DE CLIENTES</div>
              <div class="kpi-num">${clientesUnicosCount}</div>
              <div class="kpi-sub">Clientes Únicos Registrados</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">TASA RECURRENCIA</div>
              <div class="kpi-num" style="color: #4f46e5;">${tasaRecurrencia}%</div>
              <div class="kpi-sub">${clientesRecurrentes.length} Clientes (&gt;1 Compra)</div>
            </div>
          </div>

          <h2>1. RESUMEN OPERATIVO POR SUCURSAL Y PUNTO DE ORIGEN</h2>
          <p class="sec-desc">Distribución total del volumen de pedidos solicitados a través de las tiendas origen durante el periodo auditado.</p>
          <table>
            <thead>
              <tr>
                <th>TIENDA / SUCURSAL ORIGEN</th>
                <th style="text-align: center;">PEDIDOS TOTALES</th>
                <th style="text-align: center;">FINALIZADOS</th>
                <th style="text-align: center;">EN PROCESO</th>
                <th style="text-align: right;">% PARTICIPACIÓN</th>
              </tr>
            </thead>
            <tbody>
              ${resumenSucursales.map(s => `
                <tr>
                  <td><strong>${s.tienda}</strong></td>
                  <td style="text-align: center; font-weight: bold;">${s.total}</td>
                  <td style="text-align: center; color: #059669; font-weight: bold;">${s.finalizados}</td>
                  <td style="text-align: center; color: #d97706; font-weight: bold;">${s.enProceso}</td>
                  <td style="text-align: right; font-weight: bold;">${s.pct}%</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td>TOTAL GENERAL</td>
                <td style="text-align: center;">${totalRegistros}</td>
                <td style="text-align: center; color: #059669;">${entregados.length}</td>
                <td style="text-align: center; color: #d97706;">${enProceso.length}</td>
                <td style="text-align: right;">100.0%</td>
              </tr>
            </tfoot>
          </table>

          <h2>2. DESEMPEÑO Y CARGA DE TRABAJO POR OPERADOR (CHOFER)</h2>
          <p class="sec-desc">Distribución de entregas asignadas y nivel de cumplimiento por cada chofer de la plantilla operativa.</p>
          <table>
            <thead>
              <tr>
                <th>OPERADOR / CHOFER</th>
                <th style="text-align: center;">ASIGNADOS</th>
                <th style="text-align: center;">ENTREGADOS</th>
                <th style="text-align: center;">EN RUTA / PENDIENTES</th>
                <th style="text-align: right;">% CARGA OPERATIVA</th>
              </tr>
            </thead>
            <tbody>
              ${resumenChoferes.map(ch => `
                <tr>
                  <td><strong>${ch.chofer}</strong></td>
                  <td style="text-align: center; font-weight: bold;">${ch.asignados}</td>
                  <td style="text-align: center; color: #059669; font-weight: bold;">${ch.entregados}</td>
                  <td style="text-align: center; color: #d97706; font-weight: bold;">${ch.pendientes}</td>
                  <td style="text-align: right; font-weight: bold;">${ch.pct}%</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td>TOTALES</td>
                <td style="text-align: center;">${totalRegistros}</td>
                <td style="text-align: center; color: #059669;">${entregados.length}</td>
                <td style="text-align: center; color: #d97706;">${enProceso.length}</td>
                <td style="text-align: right;">100.0%</td>
              </tr>
            </tfoot>
          </table>

          <div class="footer-bar">
            <span>Reportes de Logistika — Consolidado de Pedidos y Operaciones</span>
            <span>Página 1 de 3</span>
          </div>
        </div>

        <!-- ==================== PÁGINA 2 ==================== -->
        <div class="page-container">
          <h2>3. COMPORTAMIENTO Y TENDENCIA MENSUAL DE ENTREGAS</h2>
          <table>
            <thead>
              <tr>
                <th>MES DE OPERACIÓN</th>
                <th style="text-align: center;">PEDIDOS PROCESADOS</th>
                <th style="text-align: center;">FINALIZADOS</th>
                <th style="text-align: center;">PENDIENTES</th>
                <th style="text-align: right;">% DISTRIBUCIÓN</th>
              </tr>
            </thead>
            <tbody>
              ${mesesOrdenados.map(m => {
                const pct = totalRegistros > 0 ? ((m.procesados / totalRegistros) * 100).toFixed(1) : '0';
                return `
                  <tr>
                    <td><strong>${m.nombreMes}</strong></td>
                    <td style="text-align: center; font-weight: bold;">${m.procesados}</td>
                    <td style="text-align: center; color: #059669; font-weight: bold;">${m.finalizados}</td>
                    <td style="text-align: center; color: #d97706; font-weight: bold;">${m.pendientes}</td>
                    <td style="text-align: right; font-weight: bold;">${pct}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td>TOTAL ACUMULADO</td>
                <td style="text-align: center;">${totalRegistros}</td>
                <td style="text-align: center; color: #059669;">${entregados.length}</td>
                <td style="text-align: center; color: #d97706;">${enProceso.length}</td>
                <td style="text-align: right;">100.0%</td>
              </tr>
            </tfoot>
          </table>

          <h2>3.1 MATRIZ CRUZADA: PEDIDOS POR SUCURSAL Y POR MES</h2>
          <p class="sec-desc">Desglose comparativo mensual del volumen de pedidos solicitados en cada punto de origen.</p>
          <table>
            <thead>
              <tr>
                <th>SUCURSAL / TIENDA</th>
                ${monthsKeys.map(m => {
                  const parts = m.split('-');
                  const mesAbrev = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
                  const idx = parseInt(parts[1], 10) - 1;
                  return `<th style="text-align: center;">${mesAbrev[idx] || parts[1]} ${parts[0].slice(2)}</th>`;
                }).join('')}
                <th style="text-align: right;">TOTAL PEDIDOS</th>
              </tr>
            </thead>
            <tbody>
              ${matrizRows.map(r => `
                <tr>
                  <td><strong>${r.tienda}</strong></td>
                  ${monthsKeys.map(m => `
                    <td style="text-align: center;">${r.mCounts[m] > 0 ? r.mCounts[m] : 0}</td>
                  `).join('')}
                  <td style="text-align: right; font-weight: bold;">${r.total}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td>TOTAL MENSUAL</td>
                ${monthsKeys.map(m => {
                  const s = matrizRows.reduce((acc, r) => acc + (r.mCounts[m] || 0), 0);
                  return `<td style="text-align: center;">${s}</td>`;
                }).join('')}
                <td style="text-align: right;">${totalRegistros}</td>
              </tr>
            </tfoot>
          </table>

          <h2>4. DIRECTORIO DE CLIENTES RECURRENTES Y TELÉFONOS DE CONTACTO</h2>
          <p class="sec-desc">Clientes clave con 2 o más compras registradas en el periodo. Representan el volumen de mayor fidelidad de la empresa.</p>
          <table>
            <thead>
              <tr>
                <th>NOMBRE DEL CLIENTE</th>
                <th>TELÉFONO DE CONTACTO</th>
                <th style="text-align: center;">PEDIDOS</th>
                <th>SUCURSAL PRINCIPAL</th>
                <th style="text-align: center;">ESTATUS RECURRENCIA</th>
              </tr>
            </thead>
            <tbody>
              ${clientesRecurrentes.slice(0, 8).map(c => {
                let mainStore = 'VARIAS';
                let maxC = 0;
                c.tiendas.forEach((cnt, s) => { if (cnt > maxC) { maxC = cnt; mainStore = s; } });
                const tel = Array.from(c.telefonos).join(' / ') || 'Sin teléfono';
                const isTop = c.total >= 4;
                return `
                  <tr>
                    <td><strong>${c.cliente}</strong></td>
                    <td>${tel}</td>
                    <td style="text-align: center; font-weight: bold;">${c.total}</td>
                    <td>${mainStore}</td>
                    <td style="text-align: center;">
                      <span class="badge ${isTop ? 'badge-top' : 'badge-rec'}">${isTop ? 'Top Frecuente' : 'Recurrente'}</span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer-bar">
            <span>Reportes de Logistika — Consolidado de Pedidos y Operaciones</span>
            <span>Página 2 de 3</span>
          </div>
        </div>

        <!-- ==================== PÁGINA 3 ==================== -->
        <div class="page-container">
          <!-- Continua clientes recurrentes si hay más de 8 -->
          ${clientesRecurrentes.length > 8 ? `
            <table>
              <thead>
                <tr>
                  <th>NOMBRE DEL CLIENTE</th>
                  <th>TELÉFONO DE CONTACTO</th>
                  <th style="text-align: center;">PEDIDOS</th>
                  <th>SUCURSAL PRINCIPAL</th>
                  <th style="text-align: center;">ESTATUS RECURRENCIA</th>
                </tr>
              </thead>
              <tbody>
                ${clientesRecurrentes.slice(8, 16).map(c => {
                  let mainStore = 'VARIAS';
                  let maxC = 0;
                  c.tiendas.forEach((cnt, s) => { if (cnt > maxC) { maxC = cnt; mainStore = s; } });
                  const tel = Array.from(c.telefonos).join(' / ') || 'Sin teléfono';
                  const isTop = c.total >= 4;
                  return `
                    <tr>
                      <td><strong>${c.cliente}</strong></td>
                      <td>${tel}</td>
                      <td style="text-align: center; font-weight: bold;">${c.total}</td>
                      <td>${mainStore}</td>
                      <td style="text-align: center;">
                        <span class="badge ${isTop ? 'badge-top' : 'badge-rec'}">${isTop ? 'Top Frecuente' : 'Recurrente'}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : ''}

          <h2>5. MONITOREO DE PEDIDOS ACTIVOS Y EN RUTA</h2>
          <p class="sec-desc">Detalle de entregas actualmente en proceso de transporte o programación.</p>
          <table>
            <thead>
              <tr>
                <th>FOLIO / TICKET</th>
                <th>CLIENTE</th>
                <th>SUCURSAL ORIGEN</th>
                <th>CHOFER ASIGNADO</th>
                <th style="text-align: center;">ESTATUS CARGA</th>
              </tr>
            </thead>
            <tbody>
              ${pedidosActivos.slice(0, 10).map(p => `
                <tr>
                  <td><strong>#${p.ticket}</strong></td>
                  <td>${p.cliente}</td>
                  <td>${p.tienda}</td>
                  <td>${p.chofer || 'Por asignar'}</td>
                  <td style="text-align: center;">
                    <span class="badge ${p.estatus === 'EN RUTA' ? 'badge-ruta' : p.estatus === 'CARGADO' ? 'badge-cargado' : 'badge-prog'}">
                      ${p.estatus}
                    </span>
                  </td>
                </tr>
              `).join('')}
              ${pedidosActivos.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; color: #64748b; padding: 16px;">No hay pedidos pendientes en proceso actualmente.</td>
                </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="note-box">
            <strong>Nota Operativa:</strong> Este dashboard consolida ${totalRegistros} registros extraídos directamente de la base de datos de pedidos y entregas. Los datos de recurrencia y teléfonos permiten ejecutar acciones inmediatas de venta y fidelización.
          </div>

          <div class="footer-bar">
            <span>Reportes de Logistika — Consolidado de Pedidos y Operaciones</span>
            <span>Página 3 de 3</span>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  // Handle dedicated PDF / Print Generation
  const handleImprimirPDF = () => {
    if (vistaAgrupada === 'DASHBOARD') {
      handleImprimirDashboardPDF();
      return;
    }

    // Generate clean printable HTML report for the specific tables
    const titulo = vistaAgrupada === 'CLIENTES' 
      ? 'Reporte de Clientes por Tienda y Frecuencia' 
      : vistaAgrupada === 'TIENDAS'
      ? 'Resumen General por Sucursal / Tienda'
      : 'Listado Detallado de Pedidos y Rutas';

    let tableHtml = '';

    if (vistaAgrupada === 'CLIENTES') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Tienda(s) Origen</th>
              <th>Dirección Habitual</th>
              <th style="text-align: center;">Pedidos</th>
              <th style="text-align: center;">Entregados</th>
              <th style="text-align: center;">En Proceso</th>
              <th style="text-align: right;">Último Pedido</th>
            </tr>
          </thead>
          <tbody>
            ${reporteClientes.map(c => `
              <tr>
                <td><strong>${c.cliente}</strong><br/><span style="font-size: 10px; color: #64748b;">Tickets: ${c.tickets.slice(0, 4).join(', ')}${c.tickets.length > 4 ? ` (+${c.tickets.length - 4})` : ''}</span></td>
                <td>${c.telefonosStr}</td>
                <td><span class="badge">${c.tiendasStr}</span></td>
                <td style="max-width: 250px;">${c.direccionesStr}</td>
                <td style="text-align: center; font-weight: bold;">${c.totalPedidos}</td>
                <td style="text-align: center; color: #059669; font-weight: bold;">${c.entregados}</td>
                <td style="text-align: center; color: #d97706; font-weight: bold;">${c.enProceso}</td>
                <td style="text-align: right; font-size: 10px;">${c.ultimoPedidoFecha ? formatedDisplayDateTime(c.ultimoPedidoFecha) : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (vistaAgrupada === 'TIENDAS') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Sucursal / Tienda</th>
              <th style="text-align: center;">Clientes Únicos</th>
              <th style="text-align: center;">Total Pedidos</th>
              <th style="text-align: center;">Entregados</th>
              <th style="text-align: center;">En Proceso</th>
              <th style="text-align: right;">Tasa de Efectividad</th>
            </tr>
          </thead>
          <tbody>
            ${reportePorTienda.map(t => {
              const pct = t.totalPedidos > 0 ? ((t.entregados / t.totalPedidos) * 100).toFixed(1) : '0';
              return `
                <tr>
                  <td><strong>${t.tienda}</strong></td>
                  <td style="text-align: center; font-weight: bold;">${t.clientesUnicos.size}</td>
                  <td style="text-align: center; font-weight: bold;">${t.totalPedidos}</td>
                  <td style="text-align: center; color: #059669; font-weight: bold;">${t.entregados}</td>
                  <td style="text-align: center; color: #d97706; font-weight: bold;">${t.enProceso}</td>
                  <td style="text-align: right; font-weight: bold; color: #0284c7;">${pct}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Fecha</th>
              <th>Tienda</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Dirección de Entrega</th>
              <th style="text-align: center;">Estatus</th>
              <th>Chofer</th>
              <th style="text-align: right;">F. Entrega</th>
            </tr>
          </thead>
          <tbody>
            ${pedidosFiltrados.map(p => `
              <tr>
                <td><strong>#${p.ticket}</strong></td>
                <td style="font-size: 10px;">${p.fecha ? formatedDisplayDateTime(p.fecha) : '—'}</td>
                <td><span class="badge">${p.tienda}</span></td>
                <td><strong>${p.cliente}</strong></td>
                <td>${p.tel || '—'}</td>
                <td style="max-width: 250px;">${p.dir}</td>
                <td style="text-align: center;"><span class="badge ${p.estatus === 'FINALIZADO' ? 'badge-success' : 'badge-warning'}">${p.estatus}</span></td>
                <td>${p.chofer || 'Sin chofer'}</td>
                <td style="text-align: right; font-size: 10px;">${p.fechaFinalizado ? formatedDisplayDateTime(p.fechaFinalizado) : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback if browser blocked popup window
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${titulo} - LOGISTIKA</title>
        <style>
          @page {
            size: letter landscape;
            margin: 12mm 10mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 20px;
            font-size: 11px;
            background: #fff;
          }
          .header-box {
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .header-box h1 {
            margin: 0 0 4px 0;
            font-size: 18px;
            color: #0f172a;
            letter-spacing: -0.5px;
          }
          .header-box p {
            margin: 0;
            color: #64748b;
            font-size: 11px;
          }
          .kpi-row {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
          }
          .kpi-card {
            flex: 1;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            background: #f8fafc;
          }
          .kpi-card .label {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
          }
          .kpi-card .val {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 2px;
          }
          .report-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
          }
          .report-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            border-bottom: 2px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 9.5px;
            letter-spacing: 0.5px;
          }
          .report-table td {
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }
          .report-table tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .badge {
            display: inline-block;
            background: #e2e8f0;
            color: #334155;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
          }
          .badge-success {
            background: #dcfce7;
            color: #166534;
          }
          .badge-warning {
            background: #fef3c7;
            color: #92400e;
          }
          .footer-note {
            margin-top: 20px;
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <h1>LOGISTIKA · ${titulo}</h1>
            <p>Filtro: ${filtroTienda === 'TODAS' ? 'Todas las sucursales' : filtroTienda} | Estatus: ${filtroEstatus} | Origen: ${origenDatos}</p>
          </div>
          <div style="text-align: right; font-size: 10px; color: #64748b;">
            <strong>Emisión:</strong> ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <div class="label">Total Pedidos</div>
            <div class="val">${totalPedidosCount.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="label">Clientes Únicos</div>
            <div class="val">${totalClientesUnicos.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="label">Entregados</div>
            <div class="val" style="color: #059669;">${totalEntregadosCount.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="label">En Proceso / Ruta</div>
            <div class="val" style="color: #d97706;">${totalEnProcesoCount.toLocaleString()}</div>
          </div>
        </div>

        ${tableHtml}

        <div class="footer-note">
          <span>Logistika Unified Enterprise System · Documento Oficial de Reporte Ejecutivo</span>
          <span>Página 1</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-950/60 border border-indigo-900/60 rounded-xl text-indigo-400">
              <FileText size={22} />
            </span>
            <div>
              <h3 className="text-indigo-400 font-extrabold text-lg uppercase tracking-wider font-display">
                Reportes Ejecutivos de Pedidos y Clientes por Tienda
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Consolidación completa de clientes, teléfonos, ubicaciones de entrega y volumen por sucursal.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={exportarCSV}
            className="bg-emerald-650 hover:bg-emerald-600 bg-emerald-600 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-emerald-950/40"
            title="Descargar todos los registros detallados en formato CSV para Excel"
          >
            <Download size={14} /> Exportar Pedidos (CSV)
          </button>
          <button
            onClick={exportarDirectorioClientesCSV}
            className="bg-indigo-650 hover:bg-indigo-600 bg-indigo-600 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-indigo-950/40"
            title="Descargar padrón y directorio de clientes unificados con teléfono y dirección"
          >
            <Users size={14} /> Directorio Clientes (CSV)
          </button>
          <button
            onClick={handleImprimirPDF}
            className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition border border-slate-700"
            title="Imprimir o guardar en PDF esta vista de reportes"
          >
            <Printer size={14} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Pedidos Analizados</span>
            <span className="block text-2xl font-black font-display text-slate-100">{totalPedidosCount.toLocaleString()}</span>
            <span className="block text-[10px] text-slate-500 font-mono">
              {origenDatos === 'TODOS' ? 'Activos + Historial' : origenDatos}
            </span>
          </div>
          <div className="bg-indigo-950/40 border border-indigo-900/60 p-3 rounded-lg text-indigo-400">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Clientes Únicos</span>
            <span className="block text-2xl font-black font-display text-teal-400">{totalClientesUnicos.toLocaleString()}</span>
            <span className="block text-[10px] text-slate-500 font-mono">Cartera registrada</span>
          </div>
          <div className="bg-teal-950/40 border border-teal-900/60 p-3 rounded-lg text-teal-400">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pedidos Entregados</span>
            <span className="block text-2xl font-black font-display text-emerald-400">{totalEntregadosCount.toLocaleString()}</span>
            <span className="block text-[10px] text-emerald-500/80 font-mono font-semibold">
              {totalPedidosCount > 0 ? `${((totalEntregadosCount / totalPedidosCount) * 100).toFixed(1)}% efectividad` : '0%'}
            </span>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-900/60 p-3 rounded-lg text-emerald-400">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">En Proceso / Ruta</span>
            <span className="block text-2xl font-black font-display text-amber-400">{totalEnProcesoCount.toLocaleString()}</span>
            <span className="block text-[10px] text-amber-500/80 font-mono">Pendientes de cierre</span>
          </div>
          <div className="bg-amber-950/40 border border-amber-900/60 p-3 rounded-lg text-amber-400">
            <Store size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Sub Navigation Views */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setVistaAgrupada('DASHBOARD')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                vistaAgrupada === 'DASHBOARD'
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 size={14} className="text-indigo-300" /> Dashboard Ejecutivo
            </button>
            <button
              onClick={() => setVistaAgrupada('CLIENTES')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                vistaAgrupada === 'CLIENTES'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users size={14} /> Clientes por Tienda
            </button>
            <button
              onClick={() => setVistaAgrupada('TIENDAS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                vistaAgrupada === 'TIENDAS'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 size={14} /> Resumen por Tienda
            </button>
            <button
              onClick={() => setVistaAgrupada('DETALLADO')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                vistaAgrupada === 'DETALLADO'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package size={14} /> Lista Detallada Pedidos
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="text"
              placeholder="Buscar cliente, ticket, teléfono, dirección..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Dropdown Filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Origen de Datos
            </label>
            <select
              value={origenDatos}
              onChange={(e) => setOrigenDatos(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none font-medium"
            >
              <option value="TODOS">Todos (Activos + Historial)</option>
              <option value="ACTIVOS">Solo Pedidos Activos</option>
              <option value="HISTORIAL">Solo Historial de Entregas</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Filtrar por Tienda
            </label>
            <select
              value={filtroTienda}
              onChange={(e) => setFiltroTienda(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none font-medium"
            >
              <option value="TODAS">Todas las tiendas</option>
              {tiendas.map(t => (
                <option key={t.nombre} value={t.nombre}>{t.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Estatus del Pedido
            </label>
            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none font-medium"
            >
              <option value="TODOS">Todos los estatus</option>
              <option value="FINALIZADO">FINALIZADO (Entregado)</option>
              <option value="EN RUTA">EN RUTA</option>
              <option value="PROGRAMADO">PROGRAMADO</option>
              <option value="CARGADO">CARGADO</option>
              <option value="REVISADO">REVISADO</option>
              <option value="PENDIENTE">PENDIENTE</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Ordenar por
            </label>
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none font-medium"
            >
              <option value="pedidos">Mayor volumen de pedidos</option>
              <option value="nombre">Nombre de cliente (A-Z)</option>
              <option value="tienda">Tienda / Sucursal</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 0: DASHBOARD GENERAL OPERATIVO */}
      {vistaAgrupada === 'DASHBOARD' && (
        <DashboardGeneralOperaciones
          pedidos={pedidosFiltrados}
          tiendas={tiendas}
          onPrintDashboard={handleImprimirDashboardPDF}
        />
      )}

      {/* VIEW 1: CLIENTES POR TIENDA */}
      {vistaAgrupada === 'CLIENTES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h4 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                <Users size={15} className="text-indigo-400" /> Directorio de Clientes y Frecuencia de Compra
              </h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Total de {reporteClientes.length} clientes encontrados en el periodo seleccionado.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-indigo-950/60 text-indigo-400 border border-indigo-900/50 px-2.5 py-1 rounded-full font-bold">
              {pedidosFiltrados.length} pedidos asociados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Teléfono(s)</th>
                  <th className="py-3 px-4">Tienda(s) Origen</th>
                  <th className="py-3 px-4">Dirección Habitual</th>
                  <th className="py-3 px-3 text-center">Pedidos</th>
                  <th className="py-3 px-3 text-center">Entregados</th>
                  <th className="py-3 px-3 text-center">En Proceso</th>
                  <th className="py-3 px-4 text-right">Último Pedido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reporteClientes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                      No se encontraron clientes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  reporteClientes.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-100 block text-sm">
                          {c.cliente}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Tickets: {c.tickets.slice(0, 3).join(', ')}{c.tickets.length > 3 ? ` (+${c.tickets.length - 3})` : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-teal-400">
                        {c.telefonosStr}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block bg-slate-950 border border-slate-800 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          {c.tiendasStr}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-400 max-w-xs truncate" title={c.direccionesStr}>
                        {c.direccionesStr}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block bg-indigo-950 text-indigo-300 font-bold px-2 py-0.5 rounded-full text-xs font-mono border border-indigo-900/40">
                          {c.totalPedidos}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-400">
                        {c.entregados}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-400">
                        {c.enProceso}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-[10px] text-slate-400">
                        {c.ultimoPedidoFecha ? formatedDisplayDateTime(c.ultimoPedidoFecha) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: RESUMEN POR TIENDA */}
      {vistaAgrupada === 'TIENDAS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportePorTienda.map(t => (
            <div key={t.tienda} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-950/60 text-indigo-400 rounded-lg">
                    <Building2 size={18} />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-slate-100 text-sm">{t.tienda}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">Sucursal de Venta</span>
                  </div>
                </div>
                <span className="bg-indigo-950 border border-indigo-900/60 text-indigo-300 px-2.5 py-1 rounded-full text-xs font-black font-mono">
                  {t.totalPedidos} pedidos
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="block text-[9px] uppercase font-bold text-slate-500">Clientes</span>
                  <span className="block text-lg font-black text-teal-400 font-mono">{t.clientesUnicos.size}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="block text-[9px] uppercase font-bold text-slate-500">Entregados</span>
                  <span className="block text-lg font-black text-emerald-400 font-mono">{t.entregados}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="block text-[9px] uppercase font-bold text-slate-500">En Proceso</span>
                  <span className="block text-lg font-black text-amber-400 font-mono">{t.enProceso}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Tasa de Entrega:</span>
                  <span className="font-black text-emerald-400 font-mono">
                    {t.totalPedidos > 0 ? `${((t.entregados / t.totalPedidos) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${t.totalPedidos > 0 ? (t.entregados / t.totalPedidos) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: DETALLADO PEDIDOS */}
      {vistaAgrupada === 'DETALLADO' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h4 className="font-extrabold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                <Package size={15} className="text-teal-400" /> Listado Individual de Pedidos y Rutas
              </h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Mostrando {pedidosFiltrados.length} pedidos ordenados cronológicamente.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="sticky top-0 bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 font-mono z-10">
                <tr>
                  <th className="py-3 px-3">Ticket</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Tienda</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">Teléfono</th>
                  <th className="py-3 px-3">Dirección & Referencia</th>
                  <th className="py-3 px-3 text-center">Estatus</th>
                  <th className="py-3 px-3">Chofer</th>
                  <th className="py-3 px-3 text-right">F. Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                      No hay pedidos con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((p) => (
                    <tr key={p.ticket} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-mono font-black text-indigo-400">
                        #{p.ticket}
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-400">
                        {p.fecha ? formatedDisplayDateTime(p.fecha) : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          {p.tienda}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-100">
                        {p.cliente}
                      </td>
                      <td className="py-3 px-3 font-mono text-teal-400 text-[11px]">
                        {p.tel || '—'}
                      </td>
                      <td className="py-3 px-3 max-w-xs text-[11px] text-slate-400 truncate" title={`${p.dir} - Ref: ${p.ref || 'Sin ref'}`}>
                        {p.dir}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-black uppercase font-mono ${
                          p.estatus === 'FINALIZADO' 
                            ? 'bg-emerald-950/70 border border-emerald-900/60 text-emerald-400' 
                            : p.estatus === 'EN RUTA'
                            ? 'bg-amber-950/70 border border-amber-900/60 text-amber-400 animate-pulse'
                            : 'bg-indigo-950/70 border border-indigo-900/60 text-indigo-400'
                        }`}>
                          {p.estatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium text-[11px]">
                        {p.chofer || 'Sin chofer'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[10px] text-slate-400">
                        {p.fechaFinalizado ? formatedDisplayDateTime(p.fechaFinalizado) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
