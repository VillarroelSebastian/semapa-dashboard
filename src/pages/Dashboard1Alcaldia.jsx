import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip as MapTip } from 'react-leaflet';
import {
  AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, Cell, PieChart, Pie, Line
} from 'recharts';
import { getKPIsResumen } from '../api/semapa';
const Ico = ({ n, s = 18, c = '#64748b' }) => (
  <img src={`https://api.iconify.design/lucide:${n}.svg?color=${encodeURIComponent(c)}`}
    width={s} height={s} alt="" style={{ display:'block', flexShrink:0 }} />
);
import { kpiAlcaldia, demandaProyectada5Anos } from '../data/mockData';

/* ──────────────────────────────────────────────────
   COLORES RECHARTS (tema claro)
   ────────────────────────────────────────────────── */
const PALETTE = ['#0d9488','#0369a1','#059669','#b45309','#be123c','#6d28d9','#0891b2'];
const G_STROKE = '#e2e8f0';
const A_STROKE = '#94a3b8';

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'9px 14px', boxShadow:'0 4px 6px rgba(15,23,42,0.08)' }}>
      <div style={{ fontSize:11, color:'#64748b', marginBottom:5, fontWeight:600 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ fontSize:12, color:'#334155', display:'flex', gap:8, alignItems:'center', marginTop:3 }}>
          <span style={{ width:7,height:7,borderRadius:'50%',background:p.color,display:'inline-block',flexShrink:0 }} />
          <span style={{ color:'#64748b' }}>{p.name}:</span>
          <strong style={{ color:'#0f172a' }}>{typeof p.value==='number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MAPA GEOGRÁFICO — Cochabamba (CartoDB Positron)
   ══════════════════════════════════════════════════ */
const DISTRICT_GEO = [
  { name:'TUNARI',      lat:-17.368, lng:-66.154, stress:82, consumo:132300, medidores:28450, cobertura:94,  color:'#be123c' },
  { name:'MOLLE',       lat:-17.398, lng:-66.179, stress:78, consumo:100200, medidores:24100, cobertura:89,  color:'#dc2626' },
  { name:'ALEJO C.',    lat:-17.418, lng:-66.138, stress:71, consumo:78000,  medidores:18900, cobertura:83,  color:'#ea580c' },
  { name:'VALLE H.',    lat:-17.432, lng:-66.166, stress:65, consumo:95100,  medidores:21800, cobertura:91,  color:'#d97706' },
  { name:'ITOCTA',      lat:-17.447, lng:-66.122, stress:58, consumo:68900,  medidores:15600, cobertura:76,  color:'#65a30d' },
  { name:'ADELA Z.',    lat:-17.383, lng:-66.196, stress:54, consumo:62000,  medidores:14200, cobertura:88,  color:'#059669' },
  { name:'SACABA',      lat:-17.392, lng:-66.062, stress:45, consumo:45000,  medidores:12100, cobertura:85,  color:'#0891b2' },
  { name:'QUILLACOLLO', lat:-17.391, lng:-66.281, stress:38, consumo:38000,  medidores:10800, cobertura:79,  color:'#0369a1' },
];
const MAX_CONSUMO = Math.max(...DISTRICT_GEO.map(d => d.consumo));

function MapaCochabamba() {
  return (
    <div className="map-panel">
      <div className="map-panel-header">
        <h3>Mapa Metropolitano — Cochabamba</h3>
        <p>Consumo semanal · Estrés hídrico por distrito</p>
      </div>

      <MapContainer
        center={[-17.400, -66.158]} zoom={12}
        style={{ height:'100%', width:'100%' }}
        zoomControl attributionControl={false} scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={18}
        />
        {DISTRICT_GEO.map(d => {
          const radius = 10 + (d.consumo / MAX_CONSUMO) * 22;
          return (
            <CircleMarker key={d.name} center={[d.lat, d.lng]} radius={radius}
              pathOptions={{ fillColor:d.color, fillOpacity:0.75, color:d.color, weight:2, opacity:0.9 }}
            >
              <MapTip direction="top" offset={[0, -radius - 4]}>
                <div style={{ minWidth:162 }}>
                  <div style={{ fontWeight:800, color:d.color, fontSize:13, marginBottom:6, borderBottom:'1px solid #e2e8f0', paddingBottom:4 }}>{d.name}</div>
                  <table style={{ fontSize:11, borderCollapse:'collapse', width:'100%' }}>
                    <tbody>
                      {[
                        ['Consumo semanal', `${(d.consumo/1000).toFixed(1)} k m³`],
                        ['Estrés hídrico',  `${d.stress}%`],
                        ['Medidores IoT',   d.medidores.toLocaleString()],
                        ['Cobertura',       `${d.cobertura}%`],
                      ].map(([k,v]) => (
                        <tr key={k}>
                          <td style={{ color:'#64748b', paddingRight:10, paddingBottom:2 }}>{k}</td>
                          <td style={{ fontWeight:700, color:'#1e293b' }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </MapTip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="map-legend">
        <div className="map-legend-title">Índice de Estrés Hídrico</div>
        {[
          { color:'#be123c', label:'>75 % — Crítico'  },
          { color:'#ea580c', label:'60–75 % — Alto'   },
          { color:'#65a30d', label:'45–60 % — Medio'  },
          { color:'#0369a1', label:'<45 % — Normal'   },
        ].map((l,i) => (
          <div key={i} className="map-legend-item">
            <div className="map-legend-dot" style={{ background:l.color }} />
            <span className="map-legend-text">{l.label}</span>
          </div>
        ))}
        <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid #e2e8f0', fontSize:9, color:'#94a3b8' }}>
          Tamaño de burbuja = consumo semanal
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAPA DE CALOR PROFESIONAL
   Escala YlOrRd (Amarillo → Naranja → Rojo)
   Estándar cartográfico GIS para intensidad
   ══════════════════════════════════════════════════ */

/* Períodos de consumo diario */
const TIME_PERIODS = [
  { id:'T1', label:'Madrugada', range:'00–05 h', mult:0.08 },
  { id:'T2', label:'Amanecer',  range:'05–08 h', mult:0.48 },
  { id:'T3', label:'Mañana',    range:'08–11 h', mult:0.88 },
  { id:'T4', label:'Mediodía',  range:'11–14 h', mult:0.72 },
  { id:'T5', label:'Tarde',     range:'14–17 h', mult:0.60 },
  { id:'T6', label:'Vespertino',range:'17–21 h', mult:1.00 },
  { id:'T7', label:'Noche',     range:'21–24 h', mult:0.34 },
];

/* Distritos con base de intensidad */
const HM_ROWS = [
  { name:'TUNARI',       base:0.88 },
  { name:'MOLLE',        base:0.83 },
  { name:'ALEJO C.',     base:0.76 },
  { name:'VALLE H.',     base:0.78 },
  { name:'ITOCTA',       base:0.68 },
  { name:'ADELA Z.',     base:0.62 },
  { name:'SACABA',       base:0.55 },
  { name:'QUILLACOLLO',  base:0.46 },
];

/* Ruido determinístico para realismo */
const noise = (di, ti) => {
  const x = Math.sin(di * 17.3 + ti * 11.7) * 10000;
  return (x - Math.floor(x)) * 0.18 - 0.08;
};

/* Matriz de datos [districtIndex][timeIndex] → 0..1 */
const HM_DATA = HM_ROWS.map((r, di) =>
  TIME_PERIODS.map((p, ti) =>
    Math.max(0.02, Math.min(1.0, r.base * p.mult + noise(di, ti)))
  )
);

/* Escala de color YlOrRd (7 stops, estándar ColorBrewer) */
const YL_OR_RD = [
  [255, 255, 204],
  [254, 217, 118],
  [254, 178,  76],
  [253, 141,  60],
  [252,  78,  42],
  [227,  26,  28],
  [177,   0,  38],
];

const heatColor = v => {
  const n = YL_OR_RD.length - 1;
  const pos = Math.max(0, Math.min(1, v)) * n;
  const i = Math.min(Math.floor(pos), n - 1);
  const t = pos - i;
  const [r1,g1,b1] = YL_OR_RD[i];
  const [r2,g2,b2] = YL_OR_RD[Math.min(i+1, n)];
  return `rgb(${Math.round(r1+t*(r2-r1))},${Math.round(g1+t*(g2-g1))},${Math.round(b1+t*(b2-b1))})`;
};

/* Contraste texto sobre celda */
const cellText = v => v > 0.52 ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.85)';

function MapaCalor() {
  return (
    <div className="heat-panel">
      <div className="heat-panel-header">
        <div>
          <h3>Mapa de Calor — Consumo Hídrico</h3>
          <p>Intensidad de demanda por distrito y franja horaria · Feb–Abr 2026</p>
        </div>
        <span className="chart-tag violet" style={{ alignSelf:'flex-start' }}>7 períodos · 8 distritos</span>
      </div>

      <div className="heat-panel-body">
        {/* Cabeceras de columnas */}
        <div style={{ display:'flex', marginLeft:90, marginBottom:4, gap:2, flexShrink:0 }}>
          {TIME_PERIODS.map(p => (
            <div key={p.id} style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:9.5, fontWeight:700, color:'#0f172a', lineHeight:1.2 }}>{p.label}</div>
              <div style={{ fontSize:8.5, color:'#64748b' }}>{p.range}</div>
            </div>
          ))}
        </div>

        {/* Filas de datos */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:2 }}>
          {HM_ROWS.map((row, ri) => (
            <div key={row.name} style={{ display:'flex', gap:2, alignItems:'stretch' }}>
              {/* Etiqueta distrito */}
              <div style={{
                width:90, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'flex-end',
                paddingRight:9,
                fontSize:9.5, fontWeight:700, color:'#475569',
                letterSpacing:'0.02em',
              }}>
                {row.name}
              </div>
              {/* Celdas */}
              {HM_DATA[ri].map((v, ti) => (
                <div
                  key={ti}
                  title={`${row.name} — ${TIME_PERIODS[ti].label}: ${(v*100).toFixed(1)}%`}
                  style={{
                    flex: 1,
                    background: heatColor(v),
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'default',
                    transition: 'transform 0.12s, box-shadow 0.12s',
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.55)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.08)';
                    e.currentTarget.style.zIndex = 10;
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(15,23,42,0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.zIndex = 1;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize:10, fontWeight:800, color:cellText(v), lineHeight:1 }}>
                    {(v*100).toFixed(0)}
                  </span>
                  <span style={{ fontSize:7.5, color:cellText(v), opacity:0.75, lineHeight:1, marginTop:1 }}>%</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Leyenda escala de color */}
        <div style={{ flexShrink:0, marginTop:10, marginLeft:90 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:9, color:'#94a3b8', fontWeight:600, whiteSpace:'nowrap' }}>Bajo consumo</span>
            <div style={{ flex:1, height:9, borderRadius:4, overflow:'hidden', display:'flex', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.08)' }}>
              {Array.from({length:42}, (_,i) => (
                <div key={i} style={{ flex:1, background:heatColor(i/41) }} />
              ))}
            </div>
            <span style={{ fontSize:9, color:'#94a3b8', fontWeight:600, whiteSpace:'nowrap' }}>Alto consumo</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
            {[0,25,50,75,100].map(v => (
              <span key={v} style={{ fontSize:8.5, color:'#94a3b8' }}>{v}%</span>
            ))}
          </div>
          <div style={{ marginTop:6, fontSize:9, color:'#94a3b8', fontStyle:'italic' }}>
            Escala YlOrRd (ColorBrewer) · Patrón: picos vespertinos 17–21 h
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   KPI TICKER
   ══════════════════════════════════════════════════ */
const TICKER = [
  { ico:'droplets',       c:'#0d9488', val:'87.4%',   label:'Cobertura potable',     cls:'good'     },
  { ico:'home',           c:'#059669', val:'82.1%',   label:'Hogares conectados',    cls:'good'     },
  { ico:'bar-chart-3',    c:'#0369a1', val:'245.8 k', label:'m³ consumidos / día',   cls:'info'     },
  { ico:'radio',          c:'#059669', val:'114.230', label:'Medidores IoT activos',  cls:'good'     },
  { ico:'x-circle',       c:'#b45309', val:'4.81 %',  label:'Sensores con fallas',   cls:'warning'  },
  { ico:'alert-triangle', c:'#be123c', val:'342',     label:'Alertas sobreconsumo',  cls:'critical' },
  { ico:'thermometer',    c:'#be123c', val:'8 zonas', label:'Estrés hídrico crítico',cls:'critical' },
  { ico:'wifi',           c:'#059669', val:'91.3 %',  label:'Calidad señal LoRaWAN', cls:'good'     },
  { ico:'zap',            c:'#0369a1', val:'1.247',   label:'Nuevas conexiones/mes', cls:'info'     },
];

/* ══════════════════════════════════════════════════
   DATOS GRÁFICOS
   ══════════════════════════════════════════════════ */
const scatterData = Array.from({length:30}, (_, i) => ({
  temperatura: 12 + (i * 0.47 + Math.sin(i) * 1.5),
  consumo: 200000 + Math.sin(i * 0.8) * 40000 + i * 1200,
  mes: ['Feb','Mar','Abr'][Math.floor(i / 10)]
}));

const perCapitaTrend = [
  {mes:'Ene',consumo:175},{mes:'Feb',consumo:181},{mes:'Mar',consumo:187},
  {mes:'Abr',consumo:192},{mes:'May',consumo:198},{mes:'Jun',consumo:205},
];

const coberturaDistrito = [
  {distrito:'TUNARI',    cobertura:94},{distrito:'MOLLE',    cobertura:89},
  {distrito:'ALEJO C.',  cobertura:83},{distrito:'VALLE H.', cobertura:91},
  {distrito:'ITOCTA',    cobertura:76},{distrito:'ADELA Z.', cobertura:88},
];

const senalLoRa = [
  {base:'Teléferico',  calidad:95,medidores:35200},
  {base:'ParqueLincon',calidad:92,medidores:28450},
  {base:'ParqueVial',  calidad:89,medidores:21800},
  {base:'Petrolera',   calidad:87,medidores:24100},
];

const pieEstado = [
  {name:'Activos',   value:114230},
  {name:'Fallas',    value:4890},
  {name:'Sin señal', value:880},
];

const MES_HOY = new Date().toISOString().substring(0, 7);

/* ══════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════ */
export default function Dashboard1Alcaldia() {
  const [kpis, setKpis] = useState(null);
  const [apiVivo, setApiVivo] = useState(false);

  useEffect(() => {
    getKPIsResumen(MES_HOY)
      .then(data => { setKpis(data); setApiVivo(true); })
      .catch(() => {});
  }, []);

  const medActivos   = kpis?.medidores_activos  ?? 114230;
  const medInactivos = kpis?.medidores_inactivos ?? 4890;
  const pctFallas    = kpis ? kpis.pct_fallas.toFixed(2) : '4.81';
  const totalConsumo = kpis ? (kpis.total_consumo_m3 / 1000).toFixed(1) + 'k' : '245.8 k';
  const totalContrs  = kpis?.total_contratos ?? 98234;

  return (
    <div>

      {/* ── Page header ─────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard Alcaldía Municipal — Smart City Cochabamba</h1>
          <p>Indicadores ODS · Cobertura hídrica · Impacto climático · Infraestructura IoT · 120 000 medidores</p>
        </div>
        <div className="page-header-badges">
          <div className={`badge-pill ${apiVivo ? 'live' : ''}`} style={apiVivo ? {} : {background:'#fef3c7',color:'#92400e',borderColor:'#fcd34d'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block'}} />
            {apiVivo ? 'API en vivo' : 'Simulado'}
          </div>
          <div className="badge-pill">Feb – Abr 2026</div>
          <div className="badge-pill">Cbba, Bolivia</div>
        </div>
      </div>

      {/* ── KPI Ticker ───────────────────────────── */}
      <div className="kpi-ticker">
        {[
          { ico:'droplets',       c:'#0d9488', val:'87.4%',          label:'Cobertura potable',     cls:'good'     },
          { ico:'home',           c:'#059669', val:'82.1%',          label:'Hogares conectados',    cls:'good'     },
          { ico:'bar-chart-3',    c:'#0369a1', val:totalConsumo,     label:'m³ consumidos / día',   cls:'info'     },
          { ico:'radio',          c:'#059669', val:medActivos.toLocaleString(), label:'Medidores IoT activos', cls:'good' },
          { ico:'x-circle',       c:'#b45309', val:`${pctFallas} %`, label:'Sensores con fallas',   cls:'warning'  },
          { ico:'alert-triangle', c:'#be123c', val:'342',            label:'Alertas sobreconsumo',  cls:'critical' },
          { ico:'thermometer',    c:'#be123c', val:'8 zonas',        label:'Estrés hídrico crítico',cls:'critical' },
          { ico:'wifi',           c:'#059669', val:'91.3 %',         label:'Calidad señal LoRaWAN', cls:'good'     },
          { ico:'zap',            c:'#0369a1', val:totalContrs.toLocaleString(), label:'Contratos activos', cls:'info' },
        ].map((t,i) => (
          <div key={i} className={`ticker-item ${t.cls}`}>
            <span className="ticker-icon"><Ico n={t.ico} s={18} c={t.c} /></span>
            <div>
              <span className="ticker-val">{t.val}</span>
              <span className="ticker-label">{t.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── HERO: Mapa geográfico + Mapa de calor ── */}
      <div className="hero-row">
        <MapaCochabamba />
        <MapaCalor />
      </div>

      {/* ── Analytics ────────────────────────────── */}
      <div className="page-content">

        {/* ODS */}
        <div className="ods-grid">
          {[
            { num:6,  title:'Agua limpia y saneamiento',  val:'87.4%',  label:'Cobertura potable',  color:'#0369a1', bg:'#e0f2fe' },
            { num:11, title:'Ciudades sostenibles',        val:'82.1%',  label:'Hogares conectados', color:'#059669', bg:'#d1fae5' },
            { num:13, title:'Acción climática',            val:'73.2%',  label:'Índice ahorro agua', color:'#6d28d9', bg:'#ede9fe' },
            { num:3,  title:'Salud y bienestar',           val:'187 L',  label:'Per cápita / día',   color:'#b45309', bg:'#fef3c7' },
          ].map(o => (
            <div key={o.num} className="ods-card">
              <div className="ods-number" style={{ background:o.color }}>{o.num}</div>
              <div className="ods-info">
                <div className="ods-title">{o.title}</div>
                <div className="ods-value" style={{ color:o.color }}>{o.val}</div>
                <div className="ods-label">{o.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* KPIs fila 1 */}
        <div className="kpi-grid kpi-grid-5" style={{ marginBottom:12 }}>
          {[
            { cls:'teal',  ico:'droplets',       c:'#0d9488', label:'Cobertura Potable',    val:'87.4%',  sub:<><span className="trend-up">+2.1 %</span> vs año anterior</> },
            { cls:'green', ico:'home',           c:'#059669', label:'Hogares Conectados',   val:'82.1%',  sub:<><span className="trend-up">+1 247</span> nuevas/mes</> },
            { cls:'ocean', ico:'bar-chart-3',    c:'#0369a1', label:'Consumo Diario Total', val:'245.8 k',sub:'m³/día acumulado' },
            { cls:'amber', ico:'alert-triangle', c:'#b45309', label:'Alertas Sobreconsumo', val:'342',    sub:<><span className="trend-down">+18</span> esta semana</> },
            { cls:'rose',  ico:'thermometer',    c:'#be123c', label:'Zonas Estrés Hídrico', val:'8',      sub:'Zonas en estado crítico' },
          ].map((k,i) => (
            <div key={i} className={`kpi-card ${k.cls}`}>
              <div className="kpi-icon"><Ico n={k.ico} s={18} c={k.c} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.val}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* KPIs fila 2 */}
        <div className="kpi-grid kpi-grid-4">
          {[
            { cls:'green', ico:'radio',         c:'#059669', label:'Medidores IoT Activos', val:'114 230', sub:'de 120 000 instalados' },
            { cls:'rose',  ico:'x-circle',      c:'#be123c', label:'Sensores con Fallas',   val:'4.81 %',  sub:'5 770 medidores afectados' },
            { cls:'teal',  ico:'wifi',          c:'#0d9488', label:'Calidad Señal LoRaWAN', val:'91.3 %',  sub:'14 radiobases activas' },
            { cls:'violet',ico:'zap',           c:'#6d28d9', label:'Nuevas Conexiones/Mes', val:'1 247',   sub:<><span className="trend-up">+12 %</span> vs mes anterior</> },
          ].map((k,i) => (
            <div key={i} className={`kpi-card ${k.cls}`}>
              <div className="kpi-icon"><Ico n={k.ico} s={18} c={k.c} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.val}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Consumo vs Temperatura */}
        <div className="section-header">
          <span className="section-badge" style={{ background:'linear-gradient(135deg,#be123c,#b45309)' }}>OBLIGATORIO</span>
          <div>
            <h2>Impacto Climático — Consumo vs Temperatura</h2>
            <p>Correlación mensual entre demanda hídrica y temperatura ambiente</p>
          </div>
        </div>

        <div className="chart-grid chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Consumo vs Temperatura (Feb–Abr 2026)</h3>
                <p>m³ consumidos y temperatura promedio mensual</p>
              </div>
              <span className="chart-tag rose">Obligatorio</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={kpiAlcaldia.consumoVsTemperatura}>
                <CartesianGrid strokeDasharray="3 3" stroke={G_STROKE} />
                <XAxis dataKey="mes" stroke={A_STROKE} fontSize={11} />
                <YAxis yAxisId="left"  stroke={A_STROKE} fontSize={10} tickFormatter={v=>(v/1000).toFixed(0)+'k'} />
                <YAxis yAxisId="right" orientation="right" stroke={A_STROKE} fontSize={10} unit="°C" />
                <Tooltip content={<CT />} />
                <Legend />
                <Bar   yAxisId="left"  dataKey="consumo"     name="Consumo (m³)"    fill="#0d9488" opacity={0.85} radius={[4,4,0,0]} />
                <Line  yAxisId="right" dataKey="temperatura" name="Temperatura (°C)" stroke="#b45309" strokeWidth={3} dot={{fill:'#b45309',r:6}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Dispersión: Temperatura vs Demanda Diaria</h3>
                <p>Correlación por lecturas horarias (90 días)</p>
              </div>
              <span className="chart-tag amber">Análisis</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={G_STROKE} />
                <XAxis dataKey="temperatura" name="Temp (°C)" stroke={A_STROKE} fontSize={10} unit="°C" />
                <YAxis dataKey="consumo"     name="Consumo"   stroke={A_STROKE} fontSize={10} tickFormatter={v=>(v/1000).toFixed(0)+'k'} />
                <Tooltip content={<CT />} cursor={{strokeDasharray:'3 3'}} />
                <Scatter data={scatterData.filter(d=>d.mes==='Feb')} name="Febrero" fill="#0369a1" opacity={0.75} />
                <Scatter data={scatterData.filter(d=>d.mes==='Mar')} name="Marzo"   fill="#0d9488" opacity={0.75} />
                <Scatter data={scatterData.filter(d=>d.mes==='Abr')} name="Abril"   fill="#b45309" opacity={0.75} />
                <Legend />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas + Estrés hídrico + IoT Pie */}
        <div className="chart-grid chart-grid-3">
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Alertas por Sobreconsumo</h3>
                <p>Zonas con consumo sobre umbral permitido</p>
              </div>
              <span className="chart-tag rose">Obligatorio</span>
            </div>
            <div className="alert-list">
              {[
                {zona:'CALA CALA — TUNARI',   nivel:'CRÍTICO',  exceso:'58 %', cls:'rose'},
                {zona:'SARCO — MOLLE',        nivel:'CRÍTICO',  exceso:'46 %', cls:'rose'},
                {zona:'SARCOBAMBA — MOLLE',   nivel:'ALTO',     exceso:'32 %', cls:'amber'},
                {zona:'JAIHUAYCO — ALEJO C.', nivel:'ALTO',     exceso:'28 %', cls:'amber'},
                {zona:'VILLA BUSCH — MOLLE',  nivel:'MODERADO', exceso:'19 %', cls:'teal'},
                {zona:'CONDEBAMBA — TUNARI',  nivel:'MODERADO', exceso:'15 %', cls:'teal'},
              ].map((a,i) => {
                const borderMap = {rose:'var(--rose)',amber:'var(--amber)',teal:'var(--teal)'};
                return (
                  <div key={i} className={`alert-item ${a.cls==='amber'?'warning':a.cls==='teal'?'info':''}`}>
                    <img src={`https://api.iconify.design/lucide:alert-triangle.svg?color=${encodeURIComponent(borderMap[a.cls])}`} width={13} height={13} alt="" style={{flexShrink:0}} />
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:11.5,color:'var(--text-h)'}}>{a.zona}</div>
                      <div style={{color:'var(--text-m)',fontSize:10.5}}>{a.nivel} — exceso: {a.exceso}</div>
                    </div>
                    <span className={`chip chip-${a.cls==='rose'?'danger':a.cls==='amber'?'warning':'info'}`}>{a.nivel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Zonas Críticas — Estrés Hídrico</h3>
                <p>Índice disponibilidad vs demanda por zona</p>
              </div>
              <span className="chart-tag rose">Obligatorio</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={[
                {zona:'CALA CALA',estres:82},{zona:'SARCO',estres:78},
                {zona:'SARCOBAMBA',estres:71},{zona:'JAIHUAYCO',estres:68},
                {zona:'VILLA BUSCH',estres:65},{zona:'LA MAICA',estres:61},
              ]}>
                <PolarGrid stroke={G_STROKE} />
                <PolarAngleAxis dataKey="zona" tick={{fill:'#64748b',fontSize:9.5}} />
                <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fill:'#94a3b8',fontSize:8}} />
                <Radar name="Estrés" dataKey="estres" stroke="#be123c" fill="#be123c" fillOpacity={0.18} />
                <Tooltip content={<CT />} />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:5}}>
              {[
                {zona:'CALA CALA',idx:82},{zona:'SARCO',idx:78},{zona:'SARCOBAMBA',idx:71},
                {zona:'JAIHUAYCO',idx:68},{zona:'VILLA BUSCH',idx:65},{zona:'LA MAICA',idx:61},
                {zona:'CONDEBAMBA',idx:58},{zona:'1° DE MAYO',idx:54},
              ].map((z,i) => (
                <span key={i} className={`chip chip-${z.idx>75?'danger':z.idx>60?'warning':'info'}`}>
                  {z.zona} ({z.idx})
                </span>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Estado del Parque de Medidores IoT</h3>
                <p>Distribución de los 120 000 medidores</p>
              </div>
              <span className="chart-tag rose">Obligatorio</span>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={pieEstado} cx="50%" cy="50%" innerRadius={46} outerRadius={74}
                  dataKey="value" nameKey="name"
                  label={({name,percent})=>`${name} ${(percent*100).toFixed(1)}%`}
                  labelLine={false} fontSize={10}>
                  <Cell fill="#059669"/><Cell fill="#b45309"/><Cell fill="#be123c"/>
                </Pie>
                <Tooltip content={<CT />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{display:'flex',gap:14,marginTop:8,justifyContent:'center'}}>
              {[
                {label:'Activos',  val:'114 230',color:'var(--emerald)'},
                {label:'Fallas',   val:'4 890',  color:'var(--amber)'},
                {label:'Sin señal',val:'880',     color:'var(--rose)'},
              ].map((s,i)=>(
                <div key={i} style={{textAlign:'center'}}>
                  <div style={{fontSize:15,fontWeight:900,color:s.color}}>{s.val}</div>
                  <div style={{fontSize:10,color:'var(--text-m)'}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Proyección 5 años + Cobertura */}
        <div className="chart-grid chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Proyección de Demanda 2025–2029 por Distrito</h3>
                <p>Factor crecimiento poblacional 2.6 %/año (INE)</p>
              </div>
              <span className="chart-tag green">Sostenibilidad</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={['2025','2026','2027','2028','2029'].map(yr=>{
                const r={año:yr};
                demandaProyectada5Anos.forEach(d=>r[d.distrito]=d[yr]);
                return r;
              })}>
                <defs>
                  {demandaProyectada5Anos.map((d,i)=>(
                    <linearGradient key={d.distrito} id={`grd${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={PALETTE[i]} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={PALETTE[i]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={G_STROKE}/>
                <XAxis dataKey="año" stroke={A_STROKE} fontSize={11}/>
                <YAxis stroke={A_STROKE} fontSize={10} tickFormatter={v=>(v/1000).toFixed(0)+'k'}/>
                <Tooltip content={<CT />}/>
                <Legend fontSize={10}/>
                {demandaProyectada5Anos.map((d,i)=>(
                  <Area key={d.distrito} type="monotone" dataKey={d.distrito}
                    stroke={PALETTE[i]} fill={`url(#grd${i})`} strokeWidth={2}/>
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div><h3>Cobertura del Servicio por Distrito</h3><p>% hogares con acceso a red SEMAPA</p></div>
              <span className="chart-tag green">Cobertura</span>
            </div>
            {coberturaDistrito.map(d=>(
              <div key={d.distrito} className="progress-item">
                <div className="progress-header">
                  <span style={{color:'var(--text)',fontWeight:600,fontSize:12}}>{d.distrito}</span>
                  <span style={{color:d.cobertura>90?'var(--emerald)':d.cobertura>80?'var(--amber)':'var(--rose)',fontWeight:800}}>{d.cobertura}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width:d.cobertura+'%',
                    background:d.cobertura>90?'var(--emerald)':d.cobertura>80?'var(--amber)':'var(--rose)'
                  }}/>
                </div>
              </div>
            ))}
            <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>
              <div className="chart-card-header" style={{marginBottom:8}}>
                <div><h3>Estado Radiobases LoRaWAN</h3><p>Calidad de señal por radiobase</p></div>
                <span className="chart-tag ocean">IoT</span>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={senalLoRa} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={G_STROKE} horizontal={false}/>
                  <XAxis type="number" stroke={A_STROKE} fontSize={10} domain={[0,100]} unit="%"/>
                  <YAxis type="category" dataKey="base" stroke={A_STROKE} fontSize={10} width={90}/>
                  <Tooltip content={<CT />}/>
                  <Bar dataKey="calidad" name="Calidad señal %" fill="#0d9488" radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tendencia per cápita */}
        <div className="chart-card" style={{marginBottom:0}}>
          <div className="chart-card-header">
            <div>
              <h3>Tendencia de Consumo Per Cápita y Variación Estacional</h3>
              <p>Litros por habitante/día — Referencia ONU: 300 L/hab/día</p>
            </div>
            <span className="chart-tag green">Sostenibilidad Hídrica</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={perCapitaTrend}>
              <defs>
                <linearGradient id="gPC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={G_STROKE}/>
              <XAxis dataKey="mes" stroke={A_STROKE} fontSize={11}/>
              <YAxis stroke={A_STROKE} fontSize={10} unit=" L" domain={[150,220]}/>
              <Tooltip content={<CT />}/>
              <Area type="monotone" dataKey="consumo" name="L/hab/día" stroke="#0d9488" fill="url(#gPC)" strokeWidth={3} dot={{fill:'#0d9488',r:5}}/>
              <Line type="monotone" dataKey={()=>300} stroke="#be123c" strokeDasharray="6 4" strokeWidth={2} dot={false} name="Referencia ONU (300 L)"/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{marginTop:8,padding:'8px 12px',background:'#f0fdf4',borderRadius:8,border:'1px solid rgba(5,150,105,0.2)',fontSize:11.5,color:'var(--text-2)'}}>
            <strong style={{color:'var(--emerald)'}}>Uso eficiente:</strong> El consumo per cápita actual (187 L/hab/día) se mantiene muy por debajo de la referencia ONU de 300 L/hab/día.
          </div>
        </div>

      </div>
    </div>
  );
}
