import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  consumoPorDistritoHorario, comparativa4Semanas, contratosExcesivos,
  medidoresActivosPorZona, medidoresFueraDeSservicio, fallosPorModelo,
  consumoPorTarifaDistrito, consumoAnomaloPorModelo, lecturasFallidasPorModelo,
  topConsumidoresPorDistrito, coberturaAntenas, demandaProyectada5Anos,
  impactoCambioTarifa, medidoresSinReporte, proyeccionIngresosTarifa
} from '../data/mockData';
import {
  getConsumoHora, transformConsumoHora,
  getConsumoSemana, transformComparativa,
  getConsumoExcesivo, getMedidoresResumenZona,
  getConsumoTarifaDistrito, getConexionesRadiobase,
  getTopConsumidores,
} from '../api/semapa';

// ── Colores hardcoded para el panel CQL (tema oscuro propio) ──────
const C = {
  sidebar:  '#1e293b',
  sideItem: '#0f172a',
  border:   '#334155',
  muted:    '#94a3b8',
  teal:     '#0d9488',
  ocean:    '#0369a1',
  amber:    '#b45309',
  rose:     '#be123c',
  text:     '#f1f5f9',
  subtext:  '#94a3b8',
};

const COLORS = ['#0ea5e9', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6', '#f43f5e', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, color: p.color || '#f1f5f9', display: 'flex', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', marginTop: 3 }} />
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const QUERIES = [
  { id: 1, title: '¿Consumo promedio por distrito en un rango de 8 horas?', puntos: true },
  { id: 2, title: '¿Comparativa de consumo entre las 4 últimas semanas de 3+ distritos?', puntos: true },
  { id: 3, title: '¿Identificación de contratos con consumo excesivo (>45 m³)?', puntos: true },
  { id: 4, title: '¿Cuántos medidores activos en cada distrito y zona?', puntos: true },
  { id: 5, title: '¿Cuántos medidores fuera de servicio y en qué distritos?', puntos: true },
  { id: 6, title: '¿Qué modelos tienen mayor tasa de fallos?', puntos: false },
  { id: 7, title: '¿Consumo promedio mensual por tarifa y distrito?', puntos: false },
  { id: 8, title: '¿Qué zonas tienen más medidores con consumo anómalo?', puntos: false },
  { id: 9, title: '¿Cuántas lecturas fallidas por tipo de medidor?', puntos: false },
  { id: 10, title: '¿% de medidores con más de 4 años de antigüedad?', puntos: false },
  { id: 11, title: '¿Qué zonas tienen mayor consumo per cápita residencial?', puntos: false },
  { id: 12, title: 'Top 3 clientes que más consumen por distrito', puntos: false },
  { id: 13, title: '¿Qué zonas requieren renovación de medidores?', puntos: false },
  { id: 15, title: '¿Zonas con más errores dado distrito X = "MOLLE"?', puntos: false },
  { id: 17, title: '¿Qué zonas tienen mayor cobertura de antenas LoRaWAN?', puntos: false },
  { id: 18, title: '¿Demanda proyectada 5 años por crecimiento poblacional (2.6%/año)?', puntos: false },
  { id: 20, title: '¿Impacto cambio tarifario Preferencial → Residencial R4?', puntos: false },
  { id: 21, title: '¿Qué medidores no reportaron consumo?', puntos: false },
  { id: 22, title: '¿Proyección de ingresos por tarifa para el mes activo?', puntos: false },
];

function CqlCode({ code }) {
  return (
    <div className="cql-block">
      {code.split('\n').map((line, i) => {
        const colored = line
          .replace(/(CREATE TABLE|SELECT|FROM|WHERE|AND|ORDER BY|LIMIT|INSERT INTO|VALUES|WITH|PRIMARY KEY|PARTITION KEY|CLUSTERING ORDER BY|GROUP BY|IN|ALLOW FILTERING|CREATE KEYSPACE|REPLICATION|IF NOT EXISTS|DROP|TRUNCATE)/g,
            '<kw>$1</kw>')
          .replace(/(uuid|text|int|bigint|float|double|boolean|timestamp|list|map|set|frozen|counter)/gi,
            '<tp>$1</tp>')
          .replace(/(--[^\n]*)/g, '<cm>$1</cm>')
          .replace(/'([^']*)'/g, "<st>'$1'</st>");

        return (
          <div key={i} dangerouslySetInnerHTML={{
            __html: colored
              .replace(/<kw>/g, '<span style="color:#ff7b72;font-weight:600">')
              .replace(/<\/kw>/g, '</span>')
              .replace(/<tp>/g, '<span style="color:#79c0ff">')
              .replace(/<\/tp>/g, '</span>')
              .replace(/<cm>/g, '<span style="color:#8b949e;font-style:italic">')
              .replace(/<\/cm>/g, '</span>')
              .replace(/<st>/g, '<span style="color:#a5d6ff">')
              .replace(/<\/st>/g, '</span>')
          }} />
        );
      })}
    </div>
  );
}

function ResultTable({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
      <table className="data-table">
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  fontWeight: j === 0 ? 600 : 400,
                  color: j === row.length - 1 && typeof cell === 'string' && cell.includes('%') ?
                    (parseFloat(cell) > 30 ? '#be123c' : '#0d9488') : 'var(--text)'
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const HOY  = new Date().toISOString().split('T')[0];
const MES  = HOY.substring(0, 7);
const ANIO = HOY.substring(0, 4);
const DISTRITOS_COMP = ['TUNARI', 'MOLLE', 'ALEJO CALATAYUD', 'VALLE HERMOSO'];

export default function ConsultasCQL() {
  const [activeQ, setActiveQ] = useState(1);
  const [liveQ1, setLiveQ1]   = useState(null);
  const [liveQ2, setLiveQ2]   = useState(null);
  const [liveQ3, setLiveQ3]   = useState(null);
  const [liveQ4, setLiveQ4]   = useState(null);
  const [liveQ7, setLiveQ7]   = useState(null);
  const [liveQ12, setLiveQ12] = useState(null);
  const [liveQ17, setLiveQ17] = useState(null);
  const [apiVivo, setApiVivo] = useState(false);

  useEffect(() => {
    getConsumoHora('TUNARI', HOY)
      .then(d => { if (d.length > 0) { setLiveQ1(transformConsumoHora(d)); setApiVivo(true); }})
      .catch(() => {});

    Promise.all(DISTRITOS_COMP.map(d => getConsumoSemana(d, ANIO).catch(() => [])))
      .then(results => {
        const byD = Object.fromEntries(DISTRITOS_COMP.map((d, i) => [d, results[i]]));
        const merged = transformComparativa(byD);
        if (merged.length > 0) setLiveQ2(merged);
      })
      .catch(() => {});

    getConsumoExcesivo(MES)
      .then(d => { if (d.length > 0) setLiveQ3(d); })
      .catch(() => {});

    getMedidoresResumenZona()
      .then(d => { if (d.length > 0) { setLiveQ4(d); setApiVivo(true); }})
      .catch(() => {});

    getConsumoTarifaDistrito(MES)
      .then(d => { if (d.length > 0) setLiveQ7(d); })
      .catch(() => {});

    getTopConsumidores(MES)
      .then(d => { if (d.length > 0) setLiveQ12(d); })
      .catch(() => {});

    getConexionesRadiobase()
      .then(d => { if (d.length > 0) setLiveQ17(d); })
      .catch(() => {});
  }, []);

  const renderQuery = () => {
    switch (activeQ) {
      case 1: return <Query1 liveData={liveQ1} />;
      case 2: return <Query2 liveData={liveQ2} />;
      case 3: return <Query3 liveData={liveQ3} />;
      case 4: return <Query4 liveData={liveQ4} />;
      case 5: return <Query5 liveData={liveQ4} />;
      case 6: return <Query6 />;
      case 7: return <Query7 liveData={liveQ7} />;
      case 8: return <Query8 />;
      case 9: return <Query9 />;
      case 10: return <Query10 />;
      case 11: return <Query11 />;
      case 12: return <Query12 liveData={liveQ12} />;
      case 13: return <Query13 />;
      case 15: return <Query15 />;
      case 17: return <Query17 liveData={liveQ17} />;
      case 18: return <Query18 />;
      case 20: return <Query20 />;
      case 21: return <Query21 />;
      case 22: return <Query22 />;
      default: return <div style={{ color: '#94a3b8', padding: 24 }}>Selecciona una consulta</div>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Consultas CQL — Apache Cassandra</h1>
          <p>25 queries sobre el modelo de datos distribuido de SEMAPA Cochabamba</p>
        </div>
        <div className="page-header-badges">
          <div className="badge-pill">Keyspace: semapa_iot</div>
          <div className="badge-pill">RF: 2 | CL: QUORUM</div>
          <div className={`badge-pill ${apiVivo ? 'live' : ''}`} style={apiVivo ? {} : {background:'#fef3c7',color:'#92400e',borderColor:'#fcd34d'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block'}} />
            {apiVivo ? 'API en vivo' : 'Simulado'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        {/* Panel lateral de consultas */}
        <div style={{ width: 320, background: '#1e293b', borderRight: '1px solid #334155', overflowY: 'auto', padding: '16px 12px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, paddingLeft: 8 }}>
            Consultas disponibles
          </div>
          {QUERIES.map(q => (
            <div key={q.id}
              onClick={() => setActiveQ(q.id)}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                background: activeQ === q.id ? 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(99,102,241,0.2))' : 'transparent',
                border: activeQ === q.id ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                  background: q.puntos ? 'linear-gradient(135deg,#ef4444,#f59e0b)' : (activeQ === q.id ? '#0d9488' : '#334155'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: 'white', marginTop: 1
                }}>
                  {q.id}
                </span>
                <div>
                  <div style={{ fontSize: 12, color: activeQ === q.id ? 'white' : '#94a3b8', lineHeight: 1.4, fontWeight: activeQ === q.id ? 600 : 400 }}>
                    {q.title}
                  </div>
                  {q.puntos && (
                    <span style={{ fontSize: 10, color: '#b45309', fontWeight: 700 }}>★ Con puntos</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Panel principal */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {renderQuery()}
        </div>
      </div>
    </div>
  );
}

// ======= QUERY COMPONENTS ========

function QueryHeader({ num, title, puntos }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{
          background: puntos ? 'linear-gradient(135deg,#ef4444,#f59e0b)' : 'linear-gradient(135deg, #0d9488, #0369a1)',
          color: 'white', borderRadius: 8, padding: '4px 12px', fontWeight: 800, fontSize: 14
        }}>Q{num}</span>
        {puntos && <span className="chip chip-warning">★ Con puntos evaluación</span>}
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'white', lineHeight: 1.4 }}>{title}</h2>
    </div>
  );
}

function Query1({ liveData }) {
  const chartData = liveData ?? consumoPorDistritoHorario.filter(d => d.distrito === 'TUNARI');
  const isLive = !!liveData;
  return (
    <div>
      <QueryHeader num={1} title="¿Consumo promedio por distrito en un rango de 8 horas?" puntos />
      <CqlCode code={`-- Tabla: consumo_por_distrito_horario
-- Partition Key: distrito | Clustering Columns: rango_horas

CREATE TABLE IF NOT EXISTS semapa_iot.consumo_horario_distrito (
    distrito    text,
    fecha       date,
    rango_horas text,   -- '00:00-08:00' | '08:00-16:00' | '16:00-24:00'
    total_m3    double,
    num_lecturas int,
    PRIMARY KEY ((distrito), fecha, rango_horas)
) WITH CLUSTERING ORDER BY (fecha DESC, rango_horas ASC);

-- Consulta: consumo promedio por distrito en rango de 8 horas
SELECT distrito, rango_horas,
       SUM(total_m3) AS consumo_total_m3,
       AVG(total_m3) AS consumo_promedio_m3
FROM semapa_iot.consumo_horario_distrito
WHERE distrito = 'TUNARI'
  AND fecha >= '2026-02-01'
  AND fecha <= '2026-04-30'
GROUP BY distrito, rango_horas;`} />
      <ResultTable
        headers={['Distrito', 'Rango Horario', 'Consumo Total (m³)', 'Promedio (m³)']}
        rows={[
          ['TUNARI', '00:00-08:00', '1,254,004', '418,001'],
          ['TUNARI', '08:00-16:00', '6,854,221', '2,284,740'],
          ['TUNARI', '16:00-24:00', '7,254,133', '2,418,044'],
          ['MOLLE', '00:00-08:00', '980,123', '326,708'],
          ['MOLLE', '08:00-16:00', '5,421,087', '1,807,029'],
          ['MOLLE', '16:00-24:00', '6,123,456', '2,041,152'],
          ['ALEJO CALATAYUD', '00:00-08:00', '760,234', '253,411'],
          ['ALEJO CALATAYUD', '08:00-16:00', '4,234,567', '1,411,522'],
          ['ALEJO CALATAYUD', '16:00-24:00', '4,987,654', '1,662,551'],
        ]}
      />
      {isLive && (
        <div style={{ marginBottom: 10, fontSize: 11, color: '#0d9488', fontWeight: 600 }}>
          ★ Datos en vivo desde Cassandra — TUNARI · {HOY}
        </div>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={isLive ? chartData : consumoPorDistritoHorario.filter(d => ['TUNARI','MOLLE','ALEJO CALATAYUD'].includes(d.distrito))}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={isLive ? 'hora' : 'rango'} stroke="#94a3b8" fontSize={10} interval={isLive ? 2 : 0} />
          <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => isLive ? (v/1000).toFixed(0)+'k L' : (v/1_000_000).toFixed(1)+'M'} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="consumo" name={isLive ? 'Consumo (litros)' : 'Consumo m³'} fill="#0ea5e9" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Query2({ liveData }) {
  const chartData = liveData ?? comparativa4Semanas;
  return (
    <div>
      <QueryHeader num={2} title="¿Comparativa de consumo entre las 4 últimas semanas de 3+ distritos?" puntos />
      {liveData && <div style={{ marginBottom: 10, fontSize: 11, color: '#0d9488', fontWeight: 600 }}>★ Datos en vivo desde Cassandra</div>}
      <CqlCode code={`-- Tabla: consumo_semanal_distrito
-- Partition Key: anio_mes | Clustering: semana, distrito

CREATE TABLE IF NOT EXISTS semapa_iot.consumo_semanal_distrito (
    anio_mes  text,      -- '2026-04'
    semana    text,      -- 'S1', 'S2', 'S3', 'S4'
    distrito  text,
    total_m3  double,
    variacion double,
    PRIMARY KEY ((anio_mes), semana, distrito)
) WITH CLUSTERING ORDER BY (semana ASC, distrito ASC);

-- Comparativa últimas 4 semanas, múltiples distritos
SELECT semana, distrito, SUM(total_m3) AS consumo_m3
FROM semapa_iot.consumo_semanal_distrito
WHERE anio_mes = '2026-04'
  AND distrito IN ('TUNARI', 'MOLLE', 'ALEJO CALATAYUD', 'VALLE HERMOSO')
ORDER BY semana ASC;`} />
      <ResultTable
        headers={['Semana', 'TUNARI (m³)', 'MOLLE (m³)', 'ALEJO CALATAYUD (m³)', 'VALLE HERMOSO (m³)']}
        rows={[
          ['S1', '125,000', '98,000', '76,000', '89,000'],
          ['S2', '127,500', '97,500', '75,800', '91,200'],
          ['S3', '130,000', '99,000', '76,200', '93,400'],
          ['S4', '132,300', '100,200', '78,000', '95,100'],
        ]}
      />
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="semana" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => (v/1000).toFixed(0)+'k'} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {['TUNARI','MOLLE','ALEJO CALATAYUD','VALLE HERMOSO'].map((d, i) => (
            <Line key={d} type="monotone" dataKey={d} stroke={COLORS[i]} strokeWidth={3} dot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Query3({ liveData }) {
  const isLive = !!liveData && liveData.length > 0;
  const excesivos = isLive
    ? liveData
    : contratosExcesivos.filter(c => c.consumoM3 > 45);
  return (
    <div>
      <QueryHeader num={3} title="¿Identificación de contratos con consumo excesivo? (>45 m³ residencial)" puntos />
      {isLive && <div style={{ marginBottom: 10, fontSize: 11, color: '#0d9488', fontWeight: 600 }}>★ Datos en vivo desde Cassandra</div>}
      <CqlCode code={`-- Tabla: contratos_consumo_excesivo
-- Partition Key: tarifa | Clustering: consumo_m3 DESC

CREATE TABLE IF NOT EXISTS semapa_iot.contratos_consumo (
    tarifa          text,
    contrato_id     bigint,
    ci_cliente      text,
    consumo_litros  double,
    consumo_m3      double,
    exceso_pct      double,
    mes             text,
    PRIMARY KEY ((tarifa), consumo_m3, contrato_id)
) WITH CLUSTERING ORDER BY (consumo_m3 DESC);

-- ONU: 300 L/día × 30 días × 5 hab = 45 m³/mes umbral residencial
-- Contratos residenciales con consumo > 45 m³
SELECT contrato_id, tarifa, consumo_litros, consumo_m3,
       (consumo_m3 - 45) / 45 * 100 AS exceso_pct
FROM semapa_iot.contratos_consumo
WHERE tarifa IN ('Residencial R1','Residencial R2','Residencial R3','Residencial R4')
  AND consumo_m3 > 45
ORDER BY consumo_m3 DESC
LIMIT 100 ALLOW FILTERING;`} />
      <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(14,165,233,0.1)', borderRadius: 8, border: '1px solid rgba(14,165,233,0.2)', fontSize: 12, color: '#94a3b8' }}>
        <strong style={{ color: '#0d9488' }}>Umbral ONU:</strong> 300 litros/hab/día × 30 días × 5 habitantes = <strong>45 m³/mes</strong>
      </div>
      <ResultTable
        headers={['Contrato', 'Tarifa', 'Consumo m³', 'Exceso %']}
        rows={isLive
          ? excesivos.slice(0, 20).map(c => [
              c.contrato ?? c.numero_contrato, c.tarifa,
              (c.consumo_m3 ?? c.consumoM3 ?? 0).toFixed(1),
              c.exceso_porcentaje != null ? `+${c.exceso_porcentaje.toFixed(2)}%` : `+${((c.consumo_m3 - 45) / 45 * 100).toFixed(2)}%`,
            ])
          : excesivos.map(c => [
              c.contrato, c.tarifa, c.consumoM3.toFixed(1),
              c.excesoPct > 0 ? `+${c.excesoPct.toFixed(2)}%` : `${c.excesoPct.toFixed(2)}%`,
            ])
        }
      />
    </div>
  );
}

function Query4({ liveData }) {
  const isLive = !!liveData && liveData.length > 0;
  return (
    <div>
      <QueryHeader num={4} title="¿Cuántos medidores están actualmente activos en cada distrito y zona?" puntos />
      {isLive && <div style={{ marginBottom: 10, fontSize: 11, color: '#0d9488', fontWeight: 600 }}>★ Datos en vivo desde Cassandra</div>}
      <CqlCode code={`-- Tabla: estado_medidores_zona
-- Partition Key: distrito | Clustering: zona

CREATE TABLE IF NOT EXISTS semapa_iot.estado_medidores_zona (
    distrito        text,
    zona            text,
    total_activos   counter,
    total_inactivos counter,
    total_fallas    counter,
    PRIMARY KEY ((distrito), zona)
) WITH CLUSTERING ORDER BY (zona ASC);

-- Medidores activos por distrito y zona
SELECT distrito, zona,
       total_activos    AS medidores_activos,
       total_inactivos  AS fuera_de_servicio
FROM semapa_iot.estado_medidores_zona
WHERE distrito IN ('TUNARI', 'MOLLE', 'ALEJO CALATAYUD')
ORDER BY zona ASC;`} />
      <ResultTable
        headers={['Distrito', 'Zona', 'Medidores Activos', 'Fuera de Servicio', 'Estado']}
        rows={(isLive ? liveData.slice(0, 20) : medidoresActivosPorZona).map(m => [
          m.distrito ?? m.distrito, m.zona,
          (m.activos ?? m.activos ?? 0).toLocaleString(),
          (m.inactivos ?? m.inactivos ?? 0).toLocaleString(),
          (m.inactivos ?? 0) / ((m.activos ?? 0) + (m.inactivos ?? 0) + 1) < 0.1 ? 'Normal' : 'Atención',
        ])}
      />
    </div>
  );
}

function Query5({ liveData }) {
  const isLive = !!liveData && liveData.length > 0;
  const fueraDeServicio = isLive
    ? liveData.filter(m => m.inactivos > 0).sort((a, b) => b.inactivos - a.inactivos).slice(0, 20)
    : medidoresFueraDeSservicio;
  return (
    <div>
      <QueryHeader num={5} title="¿Cuántos medidores están fuera de servicio y en qué distritos/zonas?" puntos />
      {isLive && <div style={{ marginBottom: 10, fontSize: 11, color: '#0d9488', fontWeight: 600 }}>★ Datos en vivo desde Cassandra</div>}
      <CqlCode code={`-- Tabla: medidores_sin_reporte
-- Partition Key: distrito | Clustering: zona, mac_medidor

CREATE TABLE IF NOT EXISTS semapa_iot.medidores_sin_reporte (
    distrito    text,
    zona        text,
    mac_medidor text,
    numero_serie text,
    direccion   text,
    ultimo_reporte timestamp,
    PRIMARY KEY ((distrito), zona, mac_medidor)
) WITH CLUSTERING ORDER BY (zona ASC, mac_medidor ASC);

-- Medidores que no reportaron en las últimas 24 horas (fuera de servicio)
SELECT distrito, zona,
       COUNT(*) AS medidores_fuera_servicio
FROM semapa_iot.medidores_sin_reporte
WHERE ultimo_reporte < toTimestamp(now()) - 86400000
GROUP BY distrito, zona
ORDER BY medidores_fuera_servicio DESC;`} />
      <ResultTable
        headers={['Distrito', 'Zona', 'Medidores Fuera de Servicio']}
        rows={fueraDeServicio.map(m => [
          m.distrito, m.zona,
          isLive ? (m.inactivos ?? 0).toLocaleString() : m.fueraDeSservicio.toLocaleString()
        ])}
      />
    </div>
  );
}

function Query6() {
  return (
    <div>
      <QueryHeader num={6} title="¿Qué modelos de medidores tienen mayor tasa de fallos?" />
      <CqlCode code={`-- Tabla: fallos_por_modelo
-- Partition Key: modelo | Clustering: codigo_fallo

CREATE TABLE IF NOT EXISTS semapa_iot.fallos_por_modelo (
    modelo          text,
    codigo_fallo    int,
    descripcion     text,
    total_fallos    counter,
    PRIMARY KEY ((modelo), codigo_fallo)
);

SELECT modelo, descripcion,
       SUM(total_fallos) AS total_fallos
FROM semapa_iot.fallos_por_modelo
GROUP BY modelo
ORDER BY total_fallos DESC;`} />
      <ResultTable
        headers={['Modelo', 'Fallo Principal', 'Total Fallos']}
        rows={fallosPorModelo.map(f => [f.modelo, f.fallo, f.cantidad.toLocaleString()])}
      />
    </div>
  );
}

function Query7({ liveData }) {
  const isLive = !!liveData && liveData.length > 0;
  return (
    <div>
      <QueryHeader num={7} title="¿Consumo promedio mensual en m³ por tarifa y distrito?" />
      {isLive && <div style={{ marginBottom: 10, fontSize: 11, color: '#0d9488', fontWeight: 600 }}>★ Datos en vivo desde Cassandra</div>}
      <CqlCode code={`-- Tabla: consumo_por_tarifa_distrito
-- Partition Key: (anio_mes, distrito) | Clustering: tarifa

CREATE TABLE IF NOT EXISTS semapa_iot.consumo_tarifa_distrito (
    anio_mes  text,
    distrito  text,
    tarifa    text,
    consumo_m3 double,
    num_contratos int,
    PRIMARY KEY ((anio_mes, distrito), tarifa)
);

SELECT distrito, tarifa,
       AVG(consumo_m3) AS promedio_m3
FROM semapa_iot.consumo_tarifa_distrito
WHERE anio_mes = '2026-03'
GROUP BY distrito, tarifa;`} />
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Distrito</th>
              <th>Residencial</th>
              <th>Comercial</th>
              <th>Com. Especial</th>
              <th>Industrial</th>
              <th>Preferencial</th>
              <th>Social</th>
            </tr>
          </thead>
          <tbody>
            {(isLive ? liveData : consumoPorTarifaDistrito).map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{row.distrito}</td>
                <td>{(row.Residencial ?? row.R1 ?? row.R2 ?? 0).toLocaleString()}</td>
                <td>{(row.Comercial ?? row.C ?? 0).toLocaleString()}</td>
                <td>{(row['Comercial Especial'] ?? row.CE ?? 0).toLocaleString()}</td>
                <td>{(row.Industrial ?? row.I ?? 0).toLocaleString()}</td>
                <td>{(row.Preferencial ?? row.P ?? 0).toLocaleString()}</td>
                <td>{(row.Social ?? row.S ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Query8() {
  return (
    <div>
      <QueryHeader num={8} title="¿Qué zonas tienen más medidores con consumo anómalo (cero o excesivo)?" />
      <CqlCode code={`-- Tabla: consumo_anomalo_zona
-- Partition Key: modelo | Clustering: zona

CREATE TABLE IF NOT EXISTS semapa_iot.consumo_anomalo_zona (
    modelo   text,
    zona     text,
    tipo     text, -- 'CERO' | 'EXCESIVO'
    cantidad counter,
    PRIMARY KEY ((modelo), zona, tipo)
);

SELECT modelo, zona, SUM(cantidad) AS total_anomalos
FROM semapa_iot.consumo_anomalo_zona
GROUP BY modelo, zona
ORDER BY total_anomalos DESC;`} />
      <ResultTable
        headers={['Modelo', 'Total Anómalos', 'Zonas Afectadas']}
        rows={consumoAnomaloPorModelo.map(m => [m.modelo, m.total.toLocaleString(), m.zonas])}
      />
    </div>
  );
}

function Query9() {
  return (
    <div>
      <QueryHeader num={9} title="¿Cuántas lecturas fallidas o inconsistentes por tipo de medidor?" />
      <CqlCode code={`-- Tabla: lecturas_fallidas_modelo
-- Partition Key: mes | Clustering: codigo_fallo, modelo

CREATE TABLE IF NOT EXISTS semapa_iot.lecturas_fallidas (
    mes          text,
    codigo_fallo int,
    descripcion  text,
    modelo       text,
    cantidad     counter,
    PRIMARY KEY ((mes), codigo_fallo, modelo)
);

SELECT codigo_fallo, descripcion, modelo,
       SUM(cantidad) AS total_fallidas
FROM semapa_iot.lecturas_fallidas
WHERE mes = '2026-04'
GROUP BY codigo_fallo, modelo;`} />
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>ITC 100</th>
              <th>Siconia WM-NB</th>
              <th>OY1320 LoRaWAN</th>
              <th>WP20</th>
              <th>Medidor IoT</th>
            </tr>
          </thead>
          <tbody>
            {lecturasFallidasPorModelo.map((row, i) => (
              <tr key={i}>
                <td><span className="chip chip-warning">{row.codigo}</span></td>
                <td style={{ fontSize: 12 }}>{row.descripcion}</td>
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
  );
}

function Query10() {
  return (
    <div>
      <QueryHeader num={10} title="¿Qué porcentaje de medidores tienen más de 4 años de antigüedad?" />
      <CqlCode code={`-- Tabla: medidores_antiguedad
-- Partition Key: distrito | Clustering: anio_instalacion DESC

CREATE TABLE IF NOT EXISTS semapa_iot.medidores (
    mac_medidor    text,
    distrito       text,
    zona           text,
    modelo         text,
    anio_instalacion int,
    PRIMARY KEY ((distrito), anio_instalacion, mac_medidor)
) WITH CLUSTERING ORDER BY (anio_instalacion DESC, mac_medidor ASC);

-- % medidores con > 4 años de antigüedad (instalados antes de 2022)
SELECT COUNT(*) AS total_medidores,
       COUNT(CASE WHEN anio_instalacion < 2022 THEN 1 END) AS fuera_garantia
FROM semapa_iot.medidores;`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Total Medidores', val: '120,000', color: '#0d9488' },
          { label: 'Medidores >4 años', val: '6,256', color: '#b45309' },
          { label: '% Fuera de Garantía', val: '5.21%', color: '#be123c' },
        ].map((item, i) => (
          <div key={i} style={{ background: '#334155', borderRadius: 10, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: item.color }}>{item.val}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Query11() {
  return (
    <div>
      <QueryHeader num={11} title="¿Qué zonas presentan mayor consumo per cápita por categoría residencial?" />
      <CqlCode code={`-- Tabla: consumo_percapita_zona
-- Partition Key: mes | Clustering: tarifa, zona

CREATE TABLE IF NOT EXISTS semapa_iot.consumo_percapita_zona (
    mes     text,
    tarifa  text,  -- 'R1', 'R2', 'R3', 'R4'
    zona    text,
    consumo_m3 double,
    habitantes int,
    percapita  double,
    PRIMARY KEY ((mes), tarifa, zona)
) WITH CLUSTERING ORDER BY (tarifa ASC, zona ASC);

SELECT zona, tarifa, percapita AS consumo_percapita_m3
FROM semapa_iot.consumo_percapita_zona
WHERE mes = '2026-04'
ORDER BY percapita DESC;`} />
      <ResultTable
        headers={['Zona', 'R1 (m³)', 'R2 (m³)', 'R3 (m³)', 'R4 (m³)']}
        rows={[
          ['SARCOBAMBA', '2,772', '519', '5,176', '9,591'],
          ['VILLA BUSCH', '2,425', '4,450', '3,509', '2,166'],
          ['CHIQUICOLLO', '7,132', '2,903', '7,734', '3,761'],
          ['LA CHIMBA', '698', '2,917', '1,413', '5,676'],
        ]}
      />
    </div>
  );
}

function Query12({ liveData }) {
  const isLive = !!liveData && liveData.length > 0;
  return (
    <div>
      <QueryHeader num={12} title="Top 3 clientes/servicios que más consumen por cada Distrito del mes activo" />
      {isLive && <div style={{ marginBottom: 10, fontSize: 11, color: '#0d9488', fontWeight: 600 }}>★ Datos en vivo desde Cassandra</div>}
      <CqlCode code={`-- Tabla: top_consumidores_distrito
-- Partition Key: (mes, distrito) | Clustering: consumo_m3 DESC

CREATE TABLE IF NOT EXISTS semapa_iot.top_consumidores_distrito (
    mes         text,
    distrito    text,
    consumo_m3  double,
    servicio_id bigint,
    cliente     text,
    PRIMARY KEY ((mes, distrito), consumo_m3, servicio_id)
) WITH CLUSTERING ORDER BY (consumo_m3 DESC, servicio_id ASC);

SELECT distrito, servicio_id, cliente, consumo_m3
FROM semapa_iot.top_consumidores_distrito
WHERE mes = '2026-04' AND distrito = 'TUNARI'
LIMIT 3;
-- Ejecutar por cada distrito`} />
      <ResultTable
        headers={['Distrito', 'Servicio', 'Cliente', 'Consumo m³']}
        rows={isLive
          ? liveData.slice(0, 18).map(c => [
              c.distrito, c.contrato ?? c.servicio, c.cliente, (c.consumo_m3 ?? c.consumo ?? 0).toFixed(1)
            ])
          : topConsumidoresPorDistrito.map(c => [c.distrito, c.servicio, c.cliente, c.consumo])}
      />
    </div>
  );
}

function Query13() {
  return (
    <div>
      <QueryHeader num={13} title="¿Qué zonas requieren renovación basados en cantidad de errores?" />
      <CqlCode code={`-- Tabla: errores_por_zona
-- Partition Key: (codigo_fallo, distrito) | Clustering: total_reportes DESC

CREATE TABLE IF NOT EXISTS semapa_iot.errores_zona (
    codigo_fallo int,
    descripcion  text,
    distrito     text,
    zona         text,
    total_reportes counter,
    PRIMARY KEY ((codigo_fallo, distrito), total_reportes, zona)
) WITH CLUSTERING ORDER BY (total_reportes DESC, zona ASC);

SELECT codigo_fallo, descripcion, distrito, zona,
       SUM(total_reportes) AS nro_reportes
FROM semapa_iot.errores_zona
GROUP BY codigo_fallo, distrito
ORDER BY nro_reportes DESC
LIMIT 20;`} />
      <ResultTable
        headers={['Código', 'Descripción', 'Distrito', 'Zona', 'Nro Reportes']}
        rows={[
          ['3', 'Falla alimentación eléctrica', 'TUNARI', 'SARCOBAMBA', '7,407'],
          ['4', 'Fallo conectividad de red', 'MOLLE', 'VILLA BUSCH', '7,729'],
          ['5', 'Config. incorrecta sensor/gateway', 'ALEJO CALATAYUD', 'CHIQUICOLLO', '2,696'],
        ]}
      />
    </div>
  );
}

function Query15() {
  return (
    <div>
      <QueryHeader num={15} title='¿Qué zonas tienen mayor cantidad de errores dado un distrito X = "MOLLE"?' />
      <CqlCode code={`-- Usando tabla: errores_zona
-- Consulta filtrada por distrito específico

SELECT codigo_fallo, descripcion, zona,
       SUM(total_reportes) AS nro_reportes
FROM semapa_iot.errores_zona
WHERE distrito = 'MOLLE'
GROUP BY codigo_fallo, zona
ORDER BY nro_reportes DESC;`} />
      <ResultTable
        headers={['Código', 'Descripción', 'Zona', 'Nro Reportes']}
        rows={[
          ['3', 'Falla en la alimentación eléctrica', 'SARCOBAMBA', '7,407'],
          ['4', 'Fallo en la conectividad de red', 'VILLA BUSCH', '7,729'],
          ['5', 'Configuración incorrecta sensor/gateway', 'CHIQUICOLLO', '2,696'],
        ]}
      />
    </div>
  );
}

function Query17({ liveData }) {
  const isLive = !!liveData && liveData.length > 0;
  return (
    <div>
      <QueryHeader num={17} title="¿Qué zonas tienen mayor cobertura de antenas LoRaWAN?" />
      {isLive && <div style={{ marginBottom: 10, fontSize: 11, color: '#0d9488', fontWeight: 600 }}>★ Datos en vivo desde Cassandra</div>}
      <CqlCode code={`-- Tabla: cobertura_antenas
-- Partition Key: radiobase | Clustering: conexiones DESC, zona

CREATE TABLE IF NOT EXISTS semapa_iot.cobertura_antenas (
    radiobase   text,
    zona        text,
    conexiones  counter,
    PRIMARY KEY ((radiobase), conexiones, zona)
) WITH CLUSTERING ORDER BY (conexiones DESC, zona ASC);

SELECT radiobase, zona, conexiones
FROM semapa_iot.cobertura_antenas
ORDER BY conexiones DESC;`} />
      <ResultTable
        headers={['RadioBase', 'Zona', 'Conexiones']}
        rows={isLive
          ? liveData.slice(0, 20).map(c => [c.radiobase, c.zona, (c.conexiones ?? 0).toLocaleString()])
          : coberturaAntenas.map(c => [c.radioBase, c.zona, c.conexiones.toLocaleString()])}
      />
    </div>
  );
}

function Query18() {
  return (
    <div>
      <QueryHeader num={18} title="¿Cuál será la demanda proyectada para los próximos 5 años por distrito? (2.6%/año)" />
      <CqlCode code={`-- Tabla: proyeccion_demanda
-- Calculada desde consumo base × (1 + 0.026)^n

CREATE TABLE IF NOT EXISTS semapa_iot.proyeccion_demanda (
    distrito    text,
    anio        int,
    demanda_m3  double,
    tasa_crecimiento double,
    PRIMARY KEY ((distrito), anio)
) WITH CLUSTERING ORDER BY (anio ASC);

-- Factor: 2.6% crecimiento poblacional (INE Bolivia)
SELECT distrito, anio,
       ROUND(demanda_m3, 0) AS demanda_proyectada_m3
FROM semapa_iot.proyeccion_demanda
WHERE anio IN (2025, 2026, 2027, 2028, 2029)
ORDER BY anio ASC;`} />
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table className="data-table">
          <thead>
            <tr><th>Distrito</th><th>2025</th><th>2026</th><th>2027</th><th>2028</th><th>2029</th></tr>
          </thead>
          <tbody>
            {demandaProyectada5Anos.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{row.distrito}</td>
                {['2025','2026','2027','2028','2029'].map(yr => (
                  <td key={yr} style={{ textAlign: 'right' }}>{row[yr].toLocaleString()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Query20() {
  const d = impactoCambioTarifa;
  return (
    <div>
      <QueryHeader num={20} title="¿Cómo impactaría un cambio de tarifa Preferencial → Residencial R4 en los ingresos?" />
      <CqlCode code={`-- Tabla: contratos_por_tarifa
-- Partition Key: tarifa | Clustering: contrato_id

CREATE TABLE IF NOT EXISTS semapa_iot.contratos_tarifa (
    tarifa       text,
    contrato_id  bigint,
    consumo_m3   double,
    monto_us     double,
    PRIMARY KEY ((tarifa), contrato_id)
);

-- Simulación de migración: Preferencial (P) → Residencial R4
-- P: $us 4.58/m³ | R4: $us 8.69/m³
SELECT
    COUNT(*)                          AS nro_contratos,
    SUM(consumo_m3)                   AS total_m3,
    SUM(consumo_m3 * 4.58)            AS ingreso_tarifa_P_us,
    SUM(consumo_m3 * 8.69)            AS ingreso_tarifa_R4_us,
    SUM(consumo_m3 * (8.69 - 4.58))   AS incremento_us
FROM semapa_iot.contratos_tarifa
WHERE tarifa = 'Preferencial';`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
        {[
          { label: 'Contratos Preferencial (P)', val: d.nroContratosP.toLocaleString(), color: '#0d9488' },
          { label: 'Consumo Total m³', val: d.consumoM3.toLocaleString(), color: 'var(--text)' },
          { label: 'Ingreso actual (P @ $4.58)', val: `$us ${d.ingresoActualP_USD.toLocaleString()}`, color: '#b45309' },
          { label: 'Ingreso nuevo (R4 @ $8.69)', val: `$us ${d.ingresoNuevoR4_USD.toLocaleString()}`, color: '#0d9488' },
          { label: 'Incremento en $us', val: `+$us ${d.incrementoUSD.toLocaleString()}`, color: '#be123c' },
          { label: 'Incremento en Bs', val: `+Bs ${d.incrementoBs.toLocaleString()}`, color: '#be123c' },
        ].map((item, i) => (
          <div key={i} style={{ background: '#334155', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.val}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Query21() {
  return (
    <div>
      <QueryHeader num={21} title="¿Cuáles son los medidores que no reportaron su consumo?" />
      <CqlCode code={`-- Tabla: medidores_sin_reporte
-- Partition Key: distrito | Clustering: zona, mac_medidor

SELECT distrito, zona, direccion, numero_serie,
       ultimo_reporte
FROM semapa_iot.medidores_sin_reporte
WHERE ultimo_reporte < toTimestamp(now()) - 86400000
ALLOW FILTERING;`} />
      <ResultTable
        headers={['Distrito', 'Zona', 'Dirección', 'Número de Serie']}
        rows={medidoresSinReporte.map(m => [m.distrito, m.zona, m.direccion, m.numeroSerie])}
      />
    </div>
  );
}

function Query22() {
  return (
    <div>
      <QueryHeader num={22} title="¿Cuál es la proyección de ingresos por tipo de tarifa para este mes?" />
      <CqlCode code={`-- Tabla: proyeccion_ingresos_tarifa
-- Partition Key: anio_mes | Clustering: tarifa

CREATE TABLE IF NOT EXISTS semapa_iot.proyeccion_ingresos (
    anio_mes    text,
    categoria   text,
    alias       text,
    consumo_m3  double,
    tarifa_usd  double,
    ingresos_usd double,
    ingresos_bs  double,
    PRIMARY KEY ((anio_mes), categoria)
);

SELECT categoria, alias, consumo_m3,
       ingresos_usd AS ingresos_a_cobrar_usd,
       ingresos_bs  AS ingresos_a_cobrar_bs
FROM semapa_iot.proyeccion_ingresos
WHERE anio_mes = '2026-05'
ORDER BY ingresos_usd DESC;`} />
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Alias</th>
              <th style={{ textAlign: 'right' }}>Consumo m³</th>
              <th style={{ textAlign: 'right' }}>Ingresos $us</th>
              <th style={{ textAlign: 'right' }}>Ingresos Bs</th>
            </tr>
          </thead>
          <tbody>
            {proyeccionIngresosTarifa.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{row.categoria}</td>
                <td><span className="chip chip-info">{row.alias}</span></td>
                <td style={{ textAlign: 'right' }}>{row.consumoM3.toLocaleString()}</td>
                <td style={{ textAlign: 'right', color: '#0d9488', fontWeight: 700 }}>
                  ${row.ingresoUSD.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', color: '#0d9488' }}>
                  Bs {row.ingresoBs.toLocaleString()}
                </td>
              </tr>
            ))}
            <tr style={{ background: '#334155' }}>
              <td colSpan={2} style={{ fontWeight: 700 }}>TOTAL</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{proyeccionIngresosTarifa.reduce((a, b) => a + b.consumoM3, 0).toLocaleString()}</td>
              <td style={{ textAlign: 'right', fontWeight: 800, color: '#0d9488', fontSize: 14 }}>
                ${proyeccionIngresosTarifa.reduce((a, b) => a + b.ingresoUSD, 0).toLocaleString()}
              </td>
              <td style={{ textAlign: 'right', fontWeight: 800, color: '#0d9488', fontSize: 14 }}>
                Bs {proyeccionIngresosTarifa.reduce((a, b) => a + b.ingresoBs, 0).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
