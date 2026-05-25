import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Cell, PieChart, Pie, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  kpiFinanciero, facturacionPorDistrito, proyeccionIngresosTarifa,
  carteraVencidaAging, efectividadCanal, proyeccionFlujo3Meses,
  impactoCambioTarifa, consumoPorTarifaDistrito
} from '../data/mockData';
import { getIngresosProyeccion, transformIngresos, getFacturacionDistrito } from '../api/semapa';

const COLORS = ['#0d9488','#0369a1','#059669','#b45309','#be123c','#6d28d9','#0891b2','#65a30d','#ea580c'];

const Ico = ({ n, s = 18, c = '#64748b' }) => (
  <img src={`https://api.iconify.design/lucide:${n}.svg?color=${encodeURIComponent(c)}`}
    width={s} height={s} alt="" style={{ display:'block', flexShrink:0 }} />
);

const fmtBs  = (n) => `Bs ${(n / 1_000_000).toFixed(2)}M`;
const fmtUSD = (n) => `$us ${(n / 1_000_000).toFixed(2)}M`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'9px 14px', boxShadow:'0 4px 6px rgba(15,23,42,0.08)' }}>
      <div style={{ fontSize:11, color:'#64748b', marginBottom:5, fontWeight:600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize:12, color:'#334155', display:'flex', gap:8, alignItems:'center', marginTop:3 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:p.color, display:'inline-block', flexShrink:0 }} />
          <span style={{ color:'#64748b' }}>{p.name}:</span>
          <strong style={{ color:'#0f172a' }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// Waterfall de ingresos (facturación → recaudación → mora)
const waterfallData = [
  { concepto: 'Facturado', monto: 45234567, color: '#0ea5e9' },
  { concepto: 'Recaudado', monto: 36187654, color: '#10b981' },
  { concepto: 'Cartera Vencida', monto: 9046913, color: '#ef4444' },
];

// Recaudación diaria (últimos 30 días)
const recaudacionDiaria = Array.from({ length: 30 }, (_, i) => ({
  dia: `${i + 1}`,
  recaudado: Math.floor(900000 + Math.random() * 600000),
  meta: 1000000,
}));

// Pie por canal de pago
const canalesPago = [
  { name: 'QR/Billetera', value: 38 },
  { name: 'Banco', value: 28 },
  { name: 'Tótem', value: 18 },
  { name: 'App móvil', value: 11 },
  { name: 'Ventanilla', value: 5 },
];

// Top deudores
const topDeudores = [
  { nombre: 'Industrias ABC S.R.L.', deuda: 124500, meses: 4 },
  { nombre: 'Hotel Central Ltda.', deuda: 98700, meses: 3 },
  { nombre: 'Mercado Calatayud', deuda: 87300, meses: 5 },
  { nombre: 'Constructora DEF', deuda: 76400, meses: 3 },
  { nombre: 'Colegio San Simón', deuda: 54200, meses: 2 },
];

// Embudo de cobranza
const embudoCobranza = [
  { name: 'Preavisos emitidos', value: 12340 },
  { name: 'Entregados', value: 11634 },
  { name: 'Abiertos/Leídos', value: 7956 },
  { name: 'Pagaron', value: 5197 },
];

const MES_ACTIVO = new Date().toISOString().substring(0, 7); // YYYY-MM

export default function Dashboard3Financiero() {
  const [ingresosData, setIngresosData]   = useState(proyeccionIngresosTarifa);
  const [factDistrito, setFactDistrito]   = useState(facturacionPorDistrito);
  const [apiVivo, setApiVivo]             = useState(false);

  useEffect(() => {
    getIngresosProyeccion(MES_ACTIVO)
      .then(data => {
        if (data.length > 0) {
          setIngresosData(transformIngresos(data));
          setApiVivo(true);
        }
      })
      .catch(() => {});

    getFacturacionDistrito(MES_ACTIVO)
      .then(data => {
        if (data.length > 0) {
          setFactDistrito(data.map(d => ({ distrito: d.distrito, monto: Math.round(d.monto_bs) })));
          setApiVivo(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard Departamento Financiero — SEMAPA</h1>
          <p>Facturación · Recaudación · Morosidad · Preavisos · Proyección financiera</p>
        </div>
        <div className="page-header-badges">
          <div className={`badge-pill ${apiVivo ? 'live' : ''}`} style={apiVivo ? {} : {background:'#fef3c7',color:'#92400e',borderColor:'#fcd34d'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block'}} />
            {apiVivo ? 'API en vivo' : 'Simulado'}
          </div>
          <div className="badge-pill" style={{display:'flex',alignItems:'center',gap:5}}>
            <Ico n="calendar" s={13} c="#64748b" /> Mayo 2026
          </div>
          <div className="badge-pill" style={{display:'flex',alignItems:'center',gap:5}}>
            <Ico n="coins" s={13} c="#64748b" /> Bs / $us
          </div>
        </div>
      </div>

      <div className="page-content">

        {/* KPIs financieros principales */}
        <div className="section-header">
          <span className="section-badge">Finanzas</span>
          <div>
            <h2>Indicadores Financieros Clave</h2>
            <p>Métricas obligatorias de facturación, mora y preavisos</p>
          </div>
        </div>

        <div className="kpi-grid kpi-grid-4">
          <div className="kpi-card blue">
            <div className="kpi-icon"><Ico n="receipt" s={18} c="#0369a1" /></div>
            <div className="kpi-label">Monto Facturado Mensual</div>
            <div className="kpi-value">Bs 45.2M</div>
            <div className="kpi-sub"><span className="trend-up">+4.1%</span> vs mes anterior</div>
          </div>
          <div className="kpi-card green">
            <div className="kpi-icon"><Ico n="check-circle" s={18} c="#059669" /></div>
            <div className="kpi-label">Monto Recaudado</div>
            <div className="kpi-value">Bs 36.2M</div>
            <div className="kpi-sub">79.9% de recuperación</div>
          </div>
          <div className="kpi-card red">
            <div className="kpi-icon"><Ico n="alert-triangle" s={18} c="#be123c" /></div>
            <div className="kpi-label">Cartera Vencida</div>
            <div className="kpi-value">Bs 8.9M</div>
            <div className="kpi-sub">Índice mora: 19.8%</div>
          </div>
          <div className="kpi-card orange">
            <div className="kpi-icon"><Ico n="send" s={18} c="#b45309" /></div>
            <div className="kpi-label">Preavisos Emitidos</div>
            <div className="kpi-value">12.340</div>
            <div className="kpi-sub">Tasa entrega: 94.2%</div>
          </div>
        </div>

        <div className="kpi-grid kpi-grid-4" style={{ marginTop: -8 }}>
          <div className="kpi-card teal">
            <div className="kpi-icon"><Ico n="tag" s={18} c="#0d9488" /></div>
            <div className="kpi-label">Ticket Promedio</div>
            <div className="kpi-value">Bs 460</div>
            <div className="kpi-sub">por contrato/mes</div>
          </div>
          <div className="kpi-card purple">
            <div className="kpi-icon"><Ico n="trending-up" s={18} c="#6d28d9" /></div>
            <div className="kpi-label">Facturación Acumulada Anual</div>
            <div className="kpi-value">Bs 135.7M</div>
            <div className="kpi-sub">Ene–May 2026</div>
          </div>
          <div className="kpi-card red">
            <div className="kpi-icon"><Ico n="clipboard-list" s={18} c="#be123c" /></div>
            <div className="kpi-label">Contratos en Riesgo</div>
            <div className="kpi-value">4.521</div>
            <div className="kpi-sub">mora mayor a 2 meses</div>
          </div>
          <div className="kpi-card green">
            <div className="kpi-icon"><Ico n="message-circle" s={18} c="#059669" /></div>
            <div className="kpi-label">Conversión a Pago (Preaviso)</div>
            <div className="kpi-value">42.1%</div>
            <div className="kpi-sub">de los que leyeron el aviso</div>
          </div>
        </div>

        {/* Facturación + Waterfall */}
        <div className="section-header" style={{ marginTop: 8 }}>
          <span className="section-badge">Facturación</span>
          <div>
            <h2>Facturación y Flujo de Ingresos</h2>
          </div>
        </div>

        <div className="chart-grid chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Facturación por Distrito (Bs)</h3>
                <p>Monto facturado mensual por área geográfica</p>
              </div>
              <span className="chart-tag red">Obligatorio</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={factDistrito} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={v => 'Bs ' + (v / 1_000_000).toFixed(1) + 'M'} />
                <YAxis type="category" dataKey="distrito" stroke="#94a3b8" fontSize={11} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="monto" name="Monto facturado (Bs)" radius={[0, 4, 4, 0]}>
                  {factDistrito.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Waterfall Financiero — Facturado vs Recaudado vs Mora</h3>
                <p>Brecha de recaudación del mes activo</p>
              </div>
              <span className="chart-tag blue">Flujo</span>
            </div>
            <div style={{ padding: '16px 0' }}>
              {waterfallData.map((item, i) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{item.concepto}</span>
                    <span style={{ color: item.color, fontWeight: 800 }}>{fmtBs(item.monto)}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 24, borderRadius: 6 }}>
                    <div className="progress-fill" style={{
                      width: `${(item.monto / waterfallData[0].monto) * 100}%`,
                      background: item.color,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 8,
                      fontSize: 11,
                      color: 'var(--text-h)',
                      fontWeight: 700,
                    }}>
                      {((item.monto / waterfallData[0].monto) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', marginTop: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-m)' }}>Brecha no recaudada:</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--rose)' }}>Bs 9.05M</div>
                <div style={{ fontSize: 11, color: 'var(--text-m)' }}>20.1% del total facturado</div>
              </div>
            </div>
          </div>
        </div>

        {/* Proyección por tarifa */}
        <div className="chart-card" style={{ marginBottom: 24 }}>
          <div className="chart-card-header">
            <div>
              <h3>Proyección de Ingresos por Tipo de Tarifa — Mes Activo ($us)</h3>
              <p>Consumo m³ vs ingresos proyectados por categoría tarifaria</p>
            </div>
            <span className="chart-tag blue">Tarifas</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Alias</th>
                  <th style={{ textAlign: 'right' }}>Consumo m³</th>
                  <th style={{ textAlign: 'right' }}>Ingresos $us</th>
                  <th style={{ textAlign: 'right' }}>Ingresos Bs</th>
                  <th>Distribución</th>
                </tr>
              </thead>
              <tbody>
                {ingresosData.map((row, i) => {
                  const totalUSD = ingresosData.reduce((a, b) => a + b.ingresoUSD, 0);
                  const pct = (row.ingresoUSD / totalUSD * 100).toFixed(1);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{row.categoria}</td>
                      <td><span className="chip chip-info">{row.alias}</span></td>
                      <td style={{ textAlign: 'right' }}>{row.consumoM3.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: 'var(--emerald)', fontWeight: 700 }}>
                        ${row.ingresoUSD.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--teal)', fontWeight: 600 }}>
                        Bs {row.ingresoBs.toLocaleString()}
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div className="progress-bar" style={{ height: 8 }}>
                          <div className="progress-fill" style={{ width: pct + '%', background: COLORS[i % COLORS.length] }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-m)', marginTop: 2 }}>{pct}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Morosidad + Aging */}
        <div className="section-header" style={{ marginTop: 8 }}>
          <span className="section-badge" style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)' }}>Mora</span>
          <div>
            <h2>Análisis de Cartera Vencida y Morosidad</h2>
          </div>
        </div>

        <div className="chart-grid chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Aging de Deuda — Cartera Vencida por Antigüedad</h3>
                <p>Distribución de saldos vencidos en Bs</p>
              </div>
              <span className="chart-tag red">Obligatorio</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={carteraVencidaAging}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="rango" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => 'Bs ' + (v / 1_000_000).toFixed(1) + 'M'} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="monto" name="Deuda (Bs)" radius={[4,4,0,0]}>
                  {carteraVencidaAging.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : i === 2 ? '#f97316' : i === 3 ? '#ef4444' : '#7f1d1d'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginTop: 12 }}>
              {carteraVencidaAging.map((a, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{a.contratos}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-m)' }}>{a.rango}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Top 5 Grandes Deudores</h3>
                <p>Contratos con mayor deuda acumulada</p>
              </div>
              <span className="chart-tag red">Riesgo</span>
            </div>
            {topDeudores.map((d, i) => (
              <div key={i} className="ranking-item">
                <div className={`ranking-num ${i < 3 ? 'top3' : ''}`}>{i + 1}</div>
                <div className="ranking-info">
                  <div className="ranking-name">{d.nombre}</div>
                  <div className="ranking-sub">{d.meses} meses de mora</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: 'var(--rose)', fontSize: 14 }}>Bs {d.deuda.toLocaleString()}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: '12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-m)' }}>Total top 5 deudores</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--rose)' }}>
                Bs {topDeudores.reduce((a, b) => a + b.deuda, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Preavisos + Efectividad Canal */}
        <div className="section-header" style={{ marginTop: 8 }}>
          <span className="section-badge">Cobranza</span>
          <div>
            <h2>Preavisos y Efectividad de Cobranza Preventiva</h2>
          </div>
        </div>

        <div className="chart-grid chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Embudo de Cobranza — De Preaviso a Pago</h3>
                <p>Conversión por etapas del proceso</p>
              </div>
              <span className="chart-tag red">Obligatorio</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {embudoCobranza.map((e, i) => {
                const pct = (e.value / embudoCobranza[0].value * 100).toFixed(1);
                const w = `${pct}%`;
                const colors = ['#0ea5e9', '#6366f1', '#f59e0b', '#10b981'];
                return (
                  <div key={i} style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: colors[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-h)', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text)', fontWeight: 500 }}>{e.name}</span>
                        <span style={{ color: colors[i], fontWeight: 700 }}>{e.value.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="progress-bar" style={{ height: 14, borderRadius: 6 }}>
                        <div className="progress-fill" style={{ width: w, background: colors[i], borderRadius: 6 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Efectividad por Canal de Notificación</h3>
                <p>SMS vs WhatsApp vs Email — Tasa de conversión a pago</p>
              </div>
              <span className="chart-tag green">Canal</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              {efectividadCanal.map((c, i) => {
                const canalIco = { SMS: 'smartphone', WhatsApp: 'message-circle', Email: 'mail' };
                return (
                  <div key={i} style={{ background: 'var(--surface-3)', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Ico n={canalIco[c.canal] || 'bell'} s={20} c="#475569" />
                        <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{c.canal}</span>
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: c.efectividad > 40 ? 'var(--emerald)' : c.efectividad > 30 ? 'var(--amber)' : 'var(--rose)' }}>
                        {c.efectividad}%
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, fontSize: 11 }}>
                      {[
                        { label: 'Enviados', val: c.enviados },
                        { label: 'Entregados', val: c.entregados },
                        { label: 'Abiertos', val: c.abiertos },
                        { label: 'Pagaron', val: c.pagaron },
                      ].map((s, j) => (
                        <div key={j} style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{s.val.toLocaleString()}</div>
                          <div style={{ color: 'var(--text-m)' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Proyección financiera 3 meses + Canales de pago */}
        <div className="section-header" style={{ marginTop: 8 }}>
          <span className="section-badge">Proyección</span>
          <div>
            <h2>Proyección Financiera y Escenarios</h2>
          </div>
        </div>

        <div className="chart-grid chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Flujo Proyectado — Próximos 3 Meses (Bs)</h3>
                <p>Ingreso esperado vs gasto operativo vs utilidad</p>
              </div>
              <span className="chart-tag blue">Forecast</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={proyeccionFlujo3Meses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => 'Bs ' + (v / 1_000_000).toFixed(0) + 'M'} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="ingresoEsperado" name="Ingreso Esperado" fill="#0ea5e9" opacity={0.8} radius={[4,4,0,0]} />
                <Bar dataKey="gastoOperativo" name="Gasto Operativo" fill="#ef4444" opacity={0.8} radius={[4,4,0,0]} />
                <Line dataKey="utilidad" name="Utilidad Neta" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Impacto Cambio Tarifario P → R4</h3>
                <p>11.218 contratos Preferencial migrados a Residencial R4</p>
              </div>
              <span className="chart-tag green">Escenario</span>
            </div>
            <div style={{ padding: '12px 0' }}>
              {[
                { label: 'Contratos Preferencial', val: '11.218', color: 'var(--text-m)', ico: 'clipboard-list', ic: '#64748b' },
                { label: 'Consumo total', val: '1.244.795 m³', color: 'var(--teal)', ico: 'droplets', ic: '#0d9488' },
                { label: 'Ingreso actual (P @ $4.58)', val: '$us 5.7M', color: 'var(--amber)', ico: 'dollar-sign', ic: '#b45309' },
                { label: 'Ingreso nuevo (R4 @ $8.69)', val: '$us 10.8M', color: 'var(--emerald)', ico: 'dollar-sign', ic: '#059669' },
                { label: 'Incremento proyectado', val: '$us 5.1M', color: 'var(--rose)', ico: 'trending-up', ic: '#be123c' },
                { label: 'Incremento en Bs', val: 'Bs 35.3M', color: 'var(--rose)', ico: 'arrow-up-right', ic: '#be123c' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                  <Ico n={item.ico} s={18} c={item.ic} />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-m)' }}>{item.label}</span>
                  <span style={{ fontWeight: 800, color: item.color, fontSize: 15 }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canales de pago + Recaudación diaria */}
        <div className="chart-grid chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Canales de Pago Utilizados</h3>
                <p>Distribución de recaudación por canal — mes activo</p>
              </div>
              <span className="chart-tag purple">Recaudación</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={canalesPago} cx="50%" cy="50%" outerRadius={80}
                  dataKey="value" nameKey="name"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={true} fontSize={10}>
                  {canalesPago.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Recaudación Diaria vs Meta (Bs)</h3>
                <p>Últimos 30 días — Tendencia de cobranza</p>
              </div>
              <span className="chart-tag green">Diario</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={recaudacionDiaria}>
                <defs>
                  <linearGradient id="gradRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dia" stroke="#94a3b8" fontSize={10} interval={4} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={v => 'Bs ' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="recaudado" name="Recaudado" stroke="#10b981" fill="url(#gradRec)" strokeWidth={2} />
                <Line type="monotone" dataKey="meta" name="Meta diaria" stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
