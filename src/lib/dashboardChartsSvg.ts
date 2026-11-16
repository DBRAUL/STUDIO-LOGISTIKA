import {
  ResumenSucursalItem,
  ResumenChoferItem,
  TiempoStats,
  formatDurationHuman
} from './dashboardMetrics';

const escapeXml = (str: string): string =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const buildPdfChartsHtml = (params: {
  totalRegistros: number;
  entregadosCount: number;
  enProcesoCount: number;
  pctEfectividad: string;
  tiemposGlobales: TiempoStats;
  resumenSucursales: ResumenSucursalItem[];
  resumenChoferes: ResumenChoferItem[];
  mesesOrdenados: { mesKey: string; nombreMes: string; procesados: number; finalizados: number; pendientes: number }[];
}): string => {
  const {
    totalRegistros,
    entregadosCount,
    enProcesoCount,
    pctEfectividad,
    tiemposGlobales,
    resumenSucursales,
    resumenChoferes,
    mesesOrdenados
  } = params;

  const maxStore = Math.max(...resumenSucursales.map(s => s.total), 1);
  const maxDriver = Math.max(...resumenChoferes.map(c => c.asignados), 1);
  const maxMonth = Math.max(...mesesOrdenados.map(m => m.procesados), 1);

  // 1. Horizontal bar rows for Stores (top 7)
  const storesHtml = resumenSucursales.slice(0, 7).map(s => {
    const finW = ((s.finalizados / maxStore) * 100).toFixed(1);
    const procW = ((s.enProceso / maxStore) * 100).toFixed(1);
    return `
      <div style="margin-bottom: 6px;">
        <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:2px;">
          <strong style="color:#0f172a;">${escapeXml(s.tienda)}</strong>
          <span style="color:#475569;">
            <strong style="color:#059669;">${s.finalizados}</strong> ent. /
            <strong style="color:#d97706;">${s.enProceso}</strong> pend. (<strong>${s.total}</strong>)
          </span>
        </div>
        <div style="width:100%; height:9px; background:#e2e8f0; border-radius:4px; overflow:hidden; display:flex;">
          ${s.finalizados > 0 ? `<div style="width:${finW}%; background:#10b981; height:100%;"></div>` : ''}
          ${s.enProceso > 0 ? `<div style="width:${procW}%; background:#f59e0b; height:100%;"></div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // 2. Horizontal bar rows for Drivers (top 7)
  const driversHtml = resumenChoferes.slice(0, 7).map(ch => {
    const finW = ((ch.entregados / maxDriver) * 100).toFixed(1);
    const procW = ((ch.pendientes / maxDriver) * 100).toFixed(1);
    return `
      <div style="margin-bottom: 6px;">
        <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:2px;">
          <strong style="color:#0f172a;">${escapeXml(ch.chofer)}</strong>
          <span style="color:#475569;">
            <strong style="color:#059669;">${ch.entregados}</strong>/${ch.asignados} ·
            <strong style="color:#0891b2;">${formatDurationHuman(ch.tiempos.promedioMs)}</strong>
          </span>
        </div>
        <div style="width:100%; height:9px; background:#e2e8f0; border-radius:4px; overflow:hidden; display:flex;">
          ${ch.entregados > 0 ? `<div style="width:${finW}%; background:#0d9488; height:100%;"></div>` : ''}
          ${ch.pendientes > 0 ? `<div style="width:${procW}%; background:#f59e0b; height:100%;"></div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // 3. Monthly SVG Chart
  const svgW = 420;
  const svgH = 148;
  const padL = 28;
  const padR = 12;
  const padT = 18;
  const padB = 26;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const count = mesesOrdenados.length;
  const slotW = count > 0 ? plotW / count : plotW;
  const barW = Math.min(28, Math.max(12, slotW * 0.45));
  const mesAbrev: { [k: string]: string } = {
    '01': 'ENE', '02': 'FEB', '03': 'MAR', '04': 'ABR',
    '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AGO',
    '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DIC'
  };

  const gridSvg = [0, 0.5, 1].map(r => {
    const y = padT + plotH * (1 - r);
    const val = Math.round(maxMonth * r);
    return `
      <line x1="${padL}" y1="${y}" x2="${svgW - padR}" y2="${y}" stroke="#cbd5e1" stroke-width="0.8" ${r > 0 ? 'stroke-dasharray="3 2"' : ''} />
      <text x="${padL - 4}" y="${y + 3}" text-anchor="end" fill="#64748b" font-size="8" font-family="sans-serif">${val}</text>
    `;
  }).join('');

  const barsSvg = mesesOrdenados.map((m, i) => {
    const cx = padL + slotW * i + slotW / 2;
    const h = (m.procesados / maxMonth) * plotH;
    const y = padT + plotH - h;
    const parts = m.mesKey.split('-');
    const lbl = `${mesAbrev[parts[1]] || parts[1]} ${parts[0]?.slice(2) || ''}`;
    return `
      <rect x="${cx - barW / 2}" y="${y}" width="${barW}" height="${Math.max(h, 2)}" rx="3" fill="#3b82f6" />
      <text x="${cx}" y="${y - 4}" text-anchor="middle" fill="#1e3a8a" font-size="8" font-weight="bold" font-family="sans-serif">${m.procesados}</text>
      <text x="${cx}" y="${svgH - 8}" text-anchor="middle" fill="#475569" font-size="8" font-weight="bold" font-family="sans-serif">${escapeXml(lbl)}</text>
    `;
  }).join('');

  const linePts = mesesOrdenados.map((m, i) => {
    const cx = padL + slotW * i + slotW / 2;
    const cy = padT + plotH - (m.finalizados / maxMonth) * plotH;
    return `${cx},${cy}`;
  }).join(' ');

  const dotsSvg = mesesOrdenados.map((m, i) => {
    const cx = padL + slotW * i + slotW / 2;
    const cy = padT + plotH - (m.finalizados / maxMonth) * plotH;
    return `<circle cx="${cx}" cy="${cy}" r="3.5" fill="#ffffff" stroke="#059669" stroke-width="2" />`;
  }).join('');

  const monthlySvg = count > 0 ? `
    <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%; height:auto; display:block;">
      ${gridSvg}
      ${barsSvg}
      ${count > 1 ? `<polyline fill="none" stroke="#059669" stroke-width="2" points="${linePts}" />` : ''}
      ${dotsSvg}
    </svg>
  ` : '<div style="font-size:10px; color:#64748b; padding:20px; text-align:center;">Sin datos mensuales</div>';

  // 4. Dual Donut Rings SVG
  const r = 28;
  const c = 2 * Math.PI * r;
  const effPct = totalRegistros > 0 ? (entregadosCount / totalRegistros) * 100 : 0;
  const effDash = ((effPct / 100) * c).toFixed(2);
  const fastPct = tiemposGlobales.medidos > 0 ? (tiemposGlobales.en24hCount / tiemposGlobales.medidos) * 100 : 0;
  const fastDash = ((fastPct / 100) * c).toFixed(2);

  return `
    <div style="display:flex; gap:12px; margin-bottom:14px;">
      <div style="flex:1; border:1px solid #cbd5e1; border-radius:6px; padding:10px; background:#f8fafc;">
        <div style="font-size:9.5px; font-weight:800; text-transform:uppercase; color:#1e3a8a; margin-bottom:6px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
          Gráfica: Pedidos por Tienda (Entregados vs Pend.)
        </div>
        ${storesHtml || '<div style="font-size:10px; color:#64748b;">Sin datos</div>'}
      </div>

      <div style="flex:1; border:1px solid #cbd5e1; border-radius:6px; padding:10px; background:#f8fafc;">
        <div style="font-size:9.5px; font-weight:800; text-transform:uppercase; color:#0f766e; margin-bottom:6px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
          Gráfica: Carga por Chofer y Tiempo Promedio
        </div>
        ${driversHtml || '<div style="font-size:10px; color:#64748b;">Sin datos</div>'}
      </div>
    </div>

    <div style="display:flex; gap:12px; margin-bottom:14px; align-items:stretch;">
      <div style="flex:1.5; border:1px solid #cbd5e1; border-radius:6px; padding:10px; background:#f8fafc;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
          <span style="font-size:9.5px; font-weight:800; text-transform:uppercase; color:#1e3a8a;">
            Gráfica: Tendencia Mensual de Pedidos
          </span>
          <span style="font-size:8.5px; color:#475569;">
            <span style="color:#3b82f6; font-weight:bold;">■ Procesados</span> &nbsp;
            <span style="color:#059669; font-weight:bold;">● Finalizados</span>
          </span>
        </div>
        ${monthlySvg}
      </div>

      <div style="flex:1; border:1px solid #cbd5e1; border-radius:6px; padding:10px; background:#f8fafc; display:flex; flex-direction:column; justify-content:space-between;">
        <div style="font-size:9.5px; font-weight:800; text-transform:uppercase; color:#1e3a8a; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
          Indicadores Circulares KPI
        </div>
        <div style="display:flex; gap:8px; align-items:center; justify-content:space-around; padding-top:6px;">
          <div style="text-align:center;">
            <svg width="76" height="76" viewBox="0 0 76 76">
              <circle cx="38" cy="38" r="${r}" fill="transparent" stroke="#e2e8f0" stroke-width="8" />
              <circle cx="38" cy="38" r="${r}" fill="transparent" stroke="#10b981" stroke-width="8"
                stroke-dasharray="${effDash} ${c.toFixed(2)}" transform="rotate(-90 38 38)" stroke-linecap="round" />
              <text x="38" y="41" text-anchor="middle" font-size="11" font-weight="900" fill="#0f172a" font-family="sans-serif">${pctEfectividad}%</text>
            </svg>
            <div style="font-size:8.5px; font-weight:800; color:#059669; text-transform:uppercase;">Efectividad</div>
            <div style="font-size:8px; color:#64748b;">${entregadosCount}/${totalRegistros} ped.</div>
          </div>

          <div style="text-align:center;">
            <svg width="76" height="76" viewBox="0 0 76 76">
              <circle cx="38" cy="38" r="${r}" fill="transparent" stroke="#e2e8f0" stroke-width="8" />
              <circle cx="38" cy="38" r="${r}" fill="transparent" stroke="#0891b2" stroke-width="8"
                stroke-dasharray="${fastDash} ${c.toFixed(2)}" transform="rotate(-90 38 38)" stroke-linecap="round" />
              <text x="38" y="41" text-anchor="middle" font-size="11" font-weight="900" fill="#0f172a" font-family="sans-serif">${tiemposGlobales.medidos > 0 ? `${tiemposGlobales.en24hPct}%` : '—'}</text>
            </svg>
            <div style="font-size:8.5px; font-weight:800; color:#0891b2; text-transform:uppercase;">Entrega ≤ 24h</div>
            <div style="font-size:8px; color:#64748b;">Prom: ${formatDurationHuman(tiemposGlobales.promedioMs)}</div>
          </div>
        </div>
        <div style="font-size:8px; color:#475569; text-align:center; border-top:1px solid #e2e8f0; padding-top:4px; margin-top:4px;">
          Pendientes activos: <strong>${enProcesoCount}</strong>
        </div>
      </div>
    </div>
  `;
};
