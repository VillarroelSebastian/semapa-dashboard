import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Cell, PieChart, Pie
} from 'recharts';
import {
  kpiGerencia, top10ZonasDemanda, medidoresActivosPorZona,
  medidoresFueraDeSservicio, fallosPorModelo, lecturasFallidasPorModelo,
  consumoPorDistritoHorario, comparativa4Semanas, consumoAnomaloPorModelo
} from '../data/mockData';
import {
  getConsumoHora, transformConsumoHora,
  getConsumoSemana, transformComparativa,
  getConsumoExcesivo,
} from '../api/semapa';

const COLORS = ['#0d9488','#0369a1','#059669','#b45309','#be123c','#6d28d9','#0891b2','#65a30d','#ea580c','#7c3aed'];

const Ico = ({ n, s = 18, c = '#64748b' }) => (
  <img src={`https://api.iconify.design/lucide:${n}.svg?color=${encodeURIComponent(c)}`}
    width={s} height={s} alt="" style={{ display:'block', flexShrink:0 }} />
);

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

// Consumo horario base (mock fallback mientras carga la API)
const consumoHorarioMock = Array.from({ length: 24 }, (_, h) => ({
  hora: `${h.toString().padStart(2, '0')}:00`,
  consumo: Math.floor(3000 + Math.sin((h - 6) * Math.PI / 12) * 8000 + 500)
}));

// Estado medidores pie
const pieEstadoMedidores = [
  { name: 'Activos', value: 114230 },
  { name: 'Inactivos', value: 4890 },
  { name: 'Duplicando', value: 84 },
  { name: 'Sin señal', value: 796 },
];

// Anomalías por zona
const anomalias = [
  { zona: 'CALA CALA', tipo: 'Consumo cero', gravedad: 'Alta', reportes: 142 },
  { zona: 'SARCO', tipo: 'Fuga probable', gravedad: 'Crítica', reportes: 87 },
  { zona: 'SARCOBAMBA', tipo: 'Lectura atípica', gravedad: 'Media', reportes: 231 },
  { zona: 'VILLA BUSCH', tipo: 'Señal perdida', gravedad: 'Alta', reportes: 95 },
  { zona: 'JAIHUAYCO', tipo: 'Consumo excesivo', gravedad: 'Alta', reportes: 178 },
  { zona: 'LA MAICA', tipo: 'Fuga probable', gravedad: 'Crítica', reportes: 64 },
  { zona: 'CONDEBAMBA', tipo: 'Lectura atípica', gravedad: 'Media', reportes: 119 },
];

// sem4Data proviene del estado (API o mock fallback)
// se accede como comparativaData desde el estado del componente

// Fallas por modelo (agregado)
const fallasPorModeloAgg = fallosPorModelo.map(f => ({
  modelo: f.modelo,
  total: f.cantidad,
}));

// Estado contratos
const estadoContratos = [
  { estado: 'Activos', valor: 98234 },
  { estado: 'Suspendidos', valor: 1766 },
];

const HOY = new Date().toISOString().split('T')[0];      // YYYY-MM-DD
const MES = HOY.substring(0, 7);                         // YYYY-MM
const ANIO = HOY.substring(0, 4);                        // YYYY
const DISTRITOS_COMP = ['TUNARI', 'MOLLE', 'ALEJO CALATAYUD', 'VALLE HERMOSO'];

export default function Dashboard2Gerencia() {
  const [consumoHorario, setConsumoHorario]       = useState(consumoHorarioMock);
  const [comparativaData, setComparativaData]     = useState(comparativa4Semanas);
  const [excesivos, setExcesivos]                 = useState([]);
  const [apiVivo, setApiVivo]                     = useState(false);

  useEffect(() => {
    // Histograma horario — GET /api/consumo/distrito/hora
    getConsumoHora('TUNARI', HOY)
      .then(data => {
        if (data.length > 0) {
          setConsumoHorario(transformConsumoHora(data));
          setApiVivo(true);
        }
      })
      .catch(() => {});

    // Comparativa 4 semanas — GET /api/consumo/distrito/semana (4 distritos en paralelo)
    Promise.all(DISTRITOS_COMP.map(d => getConsumoSemana(d, ANIO).catch(() => [])))
      .then(results => {
        const byDistrict = Object.fromEntries(
          DISTRITOS_COMP.map((d, i) => [d, results[i]])
        );
        const merged = transformComparativa(byDistrict);
        if (merged.length > 0) setComparativaData(merged);
      })
      .catch(() => {});

    // Contratos excesivos — GET /api/consumo/excesivo
    getConsumoExcesivo(MES)
      .then(data => { if (data.length > 0) setExcesivos(data); })
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard Gerencia / Directorio SEMAPA</h1>
          <p>Eficiencia operativa · Control de servicio · Anomalías · Comercial</p>
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
            <Ico n="building-2" s={13} c="#64748b" /> SEMAPA Cbba
          </div>
        </div>
      </div>

      <div className="page-content">

        {/* KPIs obligatorios */}
        <div className="section-header">
          <span className="section-badge">Operación</span>
          <div>
            <h2>Indicadores Operativos Clave</h2>
            <p>Métricas obligatorias de nivel táctico-gerencial</p>
          </div>
        </div>

        <div className="kpi-grid kpi-grid-5">
          <div className="kpi-card blue">
            <div className="kpi-icon"><Ico n="droplets" s={18} c="#0369a1" /></div>
            <div className="kpi-label">Total Consumo Acumulado</div>
            <div className="kpi-value">735k</div>
            <div className="kpi-sub">m³ (Feb–Abr 2026)</div>
          </div>
          <div className="kpi-card green">
            <div className="kpi-icon"><Ico n="radio" s={18} c="#059669" /></div>
            <div className="kpi-label">Total Medidores Activos</div>
            <div className="kpi-value">114.230</div>
            <div className="kpi-sub">de 120.000 instalados</div>
          </div>
          <div className="kpi-card red">
            <div className="kpi-icon"><Ico n="alert-triangle" s={18} c="#be123c" /></div>
            <div className="kpi-label">Sensores con Errores</div>
            <div className="kpi-value">5.770</div>
            <div className="kpi-sub">4.81% del total</div>
          </div>
          <div className="kpi-card purple">
            <div className="kpi-icon"><Ico n="smartphone" s={18} c="#6d28d9" /></div>
            <div className="kpi-label">Lecturas App Móvil</div>
            <div className="kpi-value">28.450</div>
            <div className="kpi-sub"><span className="trend-up">+12%</span> vs mes anterior</div>
          </div>
          <div className="kpi-card orange">
            <div className="kpi-icon"><Ico n="bar-chart-2" s={18} c="#b45309" /></div>
            <div className="kpi-label">Pico Máximo Horario</div>
            <div className="kpi-value">12.4k</div>
            <div className="kpi-sub">m³ — 18:00–19:00 hs</div>
          </div>
        </div>

        <div className="kpi-grid kpi-grid-4" style={{ marginTop: -8 }}>
          <div className="kpi-card teal">
            <div className="kpi-icon"><Ico n="clipboard-list" s={18} c="#0d9488" /></div>
            <div className="kpi-label">Contratos Activos</div>
            <div className="kpi-value">98.234</div>
            <div className="kpi-sub">1.766 suspendidos</div>
          </div>
          <div className="kpi-card orange">
            <div className="kpi-icon"><Ico n="mail" s={18} c="#b45309" /></div>
            <div className="kpi-label">Preavisos Enviados</div>
            <div className="kpi-value">12.340</div>
            <div className="kpi-sub">Tasa apertura: 68.4%</div>
          </div>
          <div className="kpi-card blue">
            <div className="kpi-icon"><Ico n="refresh-cw" s={18} c="#0369a1" /></div>
            <div className="kpi-label">Medidores Duplicando</div>
            <div className="kpi-value">84</div>
            <div className="kpi-sub">0.07% — depuración activa</div>
          </div>
          <div className="kpi-card green">
            <div className="kpi-icon"><Ico n="check-circle" s={18} c="#059669" /></div>
            <div className="kpi-label">Disponibilidad Sistema</div>
            <div className="kpi-value">99.7%</div>
            <div className="kpi-sub">SLA: Latencia 142ms</div>
          </div>
        </div>

        {/* Histograma horario + Comparativa 4 semanas */}
        <div className="section-header" style={{ marginTop: 8 }}>
          <span className="section-badge">Consumo</span>
          <div>
            <h2>Análisis de Consumo — Histogramas y Comparativas</h2>
          </div>
        </div>

        <div className="chart-grid chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Histograma de Consumo por Hora del Día</h3>
                <p>m³ promedio · Identifica pico máximo horario</p>
              </div>
              <span className="chart-tag orange">Pico Máximo</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={consumoHorario} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hora" stroke="#94a3b8" fontSize={10} interval={2} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => (v/1000).toFixed(0)+'k'} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="consumo" name="Consumo (m³)" radius={[3,3,0,0]}>
                  {consumoHorario.map((entry, index) => (
                    <Cell key={index} fill={entry.consumo > 9000 ? '#ef4444' : entry.consumo > 6000 ? '#f59e0b' : '#0ea5e9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Comparativa de Consumo — 4 Últimas Semanas</h3>
                <p>3 distritos principales en m³</p>
              </div>
              <span className="chart-tag blue">Comparativa</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={comparativaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="semana" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => (v/1000).toFixed(0)+'k'} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="TUNARI" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 5 }} />
                <Line type="monotone" dataKey="MOLLE" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                <Line type="monotone" dataKey="ALEJO CALATAYUD" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
                <Line type="monotone" dataKey="VALLE HERMOSO" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 zonas demanda OBLIGATORIO + Estado medidores */}
        <div className="chart-grid chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Top 10 Zonas de Mayor Demanda</h3>
                <p>Consumo acumulado en m³ — Ranking distrital</p>
              </div>
              <span className="chart-tag red">Obligatorio</span>
            </div>
            {top10ZonasDemanda.map((z, i) => (
              <div key={i} className="ranking-item">
                <div className={`ranking-num ${i < 3 ? 'top3' : ''}`}>{i + 1}</div>
                <div className="ranking-info">
                  <div className="ranking-name">{z.zona}</div>
                  <div className="ranking-sub">{z.distrito}</div>
                </div>
                <div style={{ flex: 1, margin: '0 12px' }}>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{
                      width: `${(z.consumo / top10ZonasDemanda[0].consumo) * 100}%`,
                      background: i < 3 ? 'linear-gradient(90deg, #ef4444, #f59e0b)' : 'var(--teal)'
                    }} />
                  </div>
                </div>
                <div className="ranking-val">{z.consumo.toLocaleString()} m³</div>
              </div>
            ))}
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Estado del Parque de Medidores IoT</h3>
                <p>Distribución total de 120.000 dispositivos</p>
              </div>
              <span className="chart-tag red">Obligatorio</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieEstadoMedidores} cx="50%" cy="50%" outerRadius={85}
                  dataKey="value" nameKey="name"
                  label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  labelLine={true} fontSize={10}>
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#6366f1" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginTop: 8 }}>
              {[
                { label: 'Activos', val: '114.230', color: 'var(--emerald)' },
                { label: 'Inactivos', val: '4.890', color: 'var(--amber)' },
                { label: 'Duplicando', val: '84', color: 'var(--violet)' },
                { label: 'Sin señal', val: '796', color: 'var(--rose)' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--surface-3)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-m)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fallas por modelo + Medidores por zona */}
        <div className="section-header" style={{ marginTop: 8 }}>
          <span className="section-badge">Anomalías</span>
          <div>
            <h2>Gestión de Anomalías y Estado por Zona</h2>
            <p>Análisis de fallos técnicos, fugas y comportamiento irregular</p>
          </div>
        </div>

        <div className="chart-grid chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Fallos por Modelo de Medidor</h3>
                <p>Total errores técnicos agrupados por tipo de dispositivo</p>
              </div>
              <span className="chart-tag orange">Mantenimiento</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fallasPorModeloAgg} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis type="category" dataKey="modelo" stroke="#94a3b8" fontSize={10} width={130} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Fallos reportados" radius={[0, 4, 4, 0]}>
                  {fallasPorModeloAgg.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Lecturas Fallidas por Tipo de Error y Modelo</h3>
                <p>Último mes — por código de fallo</p>
              </div>
              <span className="chart-tag red">Calidad datos</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th>ITC 100</th>
                    <th>Siconia</th>
                    <th>OY1320</th>
                    <th>WP20</th>
                    <th>IoT</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturasFallidasPorModelo.map((row, i) => (
                    <tr key={i}>
                      <td><span className="chip chip-warning">{row.codigo}</span></td>
                      <td style={{ fontSize: 11, maxWidth: 160 }}>{row.descripcion}</td>
                      <td style={{ textAlign: 'center' }}>{row['ITC 100']}</td>
                      <td style={{ textAlign: 'center' }}>{row['Siconia WATER WM-NB']}</td>
                      <td style={{ textAlign: 'center' }}>{row['OY1320 LoRaWAN']}</td>
                      <td style={{ textAlign: 'center' }}>{row['WP20']}</td>
                      <td style={{ textAlign: 'center' }}>{row['Medidor IoT']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tabla anomalías + Zonas anómalas */}
        <div className="chart-grid chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Panel de Anomalías — Inspección Prioritaria</h3>
                <p>Zonas con comportamiento irregular detectado</p>
              </div>
              <span className="chart-tag red">Despacho</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Zona</th>
                  <th>Tipo Anomalía</th>
                  <th>Gravedad</th>
                  <th>Reportes</th>
                </tr>
              </thead>
              <tbody>
                {anomalias.map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{a.zona}</td>
                    <td>{a.tipo}</td>
                    <td>
                      <span className={`chip ${a.gravedad === 'Crítica' ? 'chip-danger' : a.gravedad === 'Alta' ? 'chip-warning' : 'chip-info'}`}>
                        {a.gravedad}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--teal)' }}>{a.reportes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Consumo Anómalo por Modelo de Medidor</h3>
                <p>Lecturas cero o excesivas — distribución geográfica</p>
              </div>
              <span className="chart-tag orange">Zonas</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={consumoAnomaloPorModelo} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis type="category" dataKey="modelo" stroke="#94a3b8" fontSize={10} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Lecturas anómalas" radius={[0, 4, 4, 0]}>
                  {consumoAnomaloPorModelo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12 }}>
              {consumoAnomaloPorModelo.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i], flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ color: 'var(--text-h)' }}>{m.modelo}:</strong>
                    <span style={{ color: 'var(--text-m)', marginLeft: 4 }}>{m.zonas}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contratos con consumo excesivo >45 m³ — Query 3 */}
        <div className="section-header" style={{ marginTop: 8 }}>
          <span className="section-badge" style={{ background: 'linear-gradient(135deg,#be123c,#b45309)' }}>Q3</span>
          <div>
            <h2>Contratos con Consumo Excesivo — Residencial &gt;45 m³</h2>
            <p>300 L/día × 30 días × 5 hab = 45 m³ límite ONU · {apiVivo ? 'Datos en vivo' : 'Datos simulados'}</p>
          </div>
        </div>
        <div className="chart-card" style={{ marginBottom: 12 }}>
          <div className="chart-card-header">
            <div>
              <h3>Contratos Residenciales con Sobreconsumo</h3>
              <p>Contratos que superaron el límite de consumo normal — mes activo</p>
            </div>
            <span className="chart-tag red">Obligatorio</span>
          </div>
          {excesivos.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contrato</th>
                    <th>Tarifa</th>
                    <th style={{ textAlign: 'right' }}>Consumo m³</th>
                    <th style={{ textAlign: 'right' }}>Exceso %</th>
                    <th>Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {excesivos.slice(0, 20).map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{c.contrato}</td>
                      <td><span className="chip chip-info">{c.tarifa}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--rose)' }}>{c.consumo_m3?.toFixed(1)} m³</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: c.exceso_porcentaje > 50 ? 'var(--rose)' : 'var(--amber)' }}>
                        +{c.exceso_porcentaje?.toFixed(1)}%
                      </td>
                      <td>
                        <span className={`chip ${c.exceso_porcentaje > 50 ? 'chip-danger' : 'chip-warning'}`}>
                          {c.exceso_porcentaje > 50 ? 'Crítico' : 'Alto'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-m)', fontSize: 13 }}>
              Sin datos de contratos excesivos para el período actual
              <div style={{ fontSize: 11, marginTop: 4 }}>Conecta el backend para ver datos reales</div>
            </div>
          )}
        </div>

        {/* Medidores activos vs fuera de servicio por zona */}
        <div className="chart-card" style={{ marginBottom: 24 }}>
          <div className="chart-card-header">
            <div>
              <h3>Medidores Activos vs Fuera de Servicio por Zona y Distrito</h3>
              <p>Estado detallado del parque IoT — consultas 4 y 5 del sistema</p>
            </div>
            <span className="chart-tag green">Obligatorio</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={medidoresActivosPorZona}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="zona" stroke="#94a3b8" fontSize={10} angle={-30} textAnchor="end" height={60} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="activos" name="Medidores Activos" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="inactivos" name="Fuera de Servicio" fill="#ef4444" radius={[4,4,0,0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
