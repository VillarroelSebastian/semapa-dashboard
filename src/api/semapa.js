// ============================================================
// SEMAPA API CLIENT — conecta con el backend Go en :8080
// Proxy configurado en vite.config.js → /api → localhost:8080
// ============================================================

const BASE = '/api'

async function get(path) {
  const r = await fetch(`${BASE}${path}`)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const data = await r.json()
  return Array.isArray(data) ? data : (data ?? [])
}

// ── Consumo por distrito/hora ────────────────────────────────
// GET /api/consumo/distrito/hora?distrito=X&fecha=YYYY-MM-DD
// Respuesta: [{hora: 8, consumo_m3: 450.2}, ...]
export const getConsumoHora = (distrito, fecha) =>
  get(`/consumo/distrito/hora?distrito=${encodeURIComponent(distrito)}&fecha=${fecha}`)

// Transforma respuesta API → formato recharts histograma (24 horas)
export function transformConsumoHora(apiData) {
  const map = {}
  apiData.forEach(d => { map[d.hora] = d.consumo_m3 })
  return Array.from({ length: 24 }, (_, h) => ({
    hora: `${h.toString().padStart(2, '0')}:00`,
    consumo: Math.round((map[h] ?? 0) * 1000), // m³ → litros para escala similar al mock
  }))
}

// ── Consumo por distrito/semana ─────────────────────────────
// GET /api/consumo/distrito/semana?distrito=X&anio=YYYY
// Respuesta: [{semana: 14, consumo_m3: 12500.8}, ...]
export const getConsumoSemana = (distrito, anio) =>
  get(`/consumo/distrito/semana?distrito=${encodeURIComponent(distrito)}&anio=${anio}`)

// Transforma respuestas de múltiples distritos → formato comparativa 4 semanas
// distritoData: { 'TUNARI': [{semana,consumo_m3}], 'MOLLE': [...], ... }
export function transformComparativa(distritoData) {
  const todasSemanas = [...new Set(
    Object.values(distritoData).flat().map(d => d.semana)
  )].sort((a, b) => a - b)

  const ultimas4 = todasSemanas.slice(-4)
  return ultimas4.map((s, i) => {
    const fila = { semana: `S${i + 1}` }
    for (const [distrito, datos] of Object.entries(distritoData)) {
      const found = datos.find(d => d.semana === s)
      fila[distrito] = found ? Math.round(found.consumo_m3) : 0
    }
    return fila
  })
}

// ── Contratos con consumo excesivo >45 m³ ───────────────────
// GET /api/consumo/excesivo?mes=YYYY-MM
// Respuesta: [{contrato, tarifa, consumo_m3, exceso_porcentaje}, ...]
export const getConsumoExcesivo = (mes) =>
  get(`/consumo/excesivo?mes=${mes}`)

// ── Proyección de ingresos por tarifa ───────────────────────
// GET /api/ingresos/proyeccion?mes=YYYY-MM
// Respuesta: [{tarifa, alias, consumo_m3, consumo_ft3, ingreso_usd, ingreso_bs}, ...]
export const getIngresosProyeccion = (mes) =>
  get(`/ingresos/proyeccion?mes=${mes}`)

// Transforma respuesta API → formato tabla Dashboard3
export function transformIngresos(apiData) {
  return apiData.map(d => ({
    categoria: d.tarifa,
    alias: d.alias,
    consumoM3: Math.round(d.consumo_m3),
    ingresoUSD: d.ingreso_usd,
    ingresoBs: d.ingreso_bs,
  }))
}

// ── Medidores cancelados por modelo ─────────────────────────
// GET /api/medidores/cancelados?modelo=X
export const getMedidoresCancelados = (modelo) =>
  get(`/medidores/cancelados?modelo=${encodeURIComponent(modelo)}`)

// ── Deudas por número de catastro ───────────────────────────
// GET /api/deudas/catastro?catastro=X
export const getDeudasCatastro = (catastro) =>
  get(`/deudas/catastro?catastro=${encodeURIComponent(catastro)}`)

// ── Facturas por propietario ─────────────────────────────────
// GET /api/propietario/facturas?propietario=X
export const getFacturasPropietario = (propietario) =>
  get(`/propietario/facturas?propietario=${encodeURIComponent(propietario)}`)

// ── Top consumidores por distrito ───────────────────────────
// GET /api/top-consumidores?mes=YYYY-MM
// Respuesta: [{distrito, contrato, cliente, servicio, consumo_m3}, ...]
export const getTopConsumidores = (mes) =>
  get(`/top-consumidores?mes=${mes}`)

// ── Facturación por distrito ─────────────────────────────────
// GET /api/facturacion/distrito?mes=YYYY-MM
// Respuesta: [{distrito, consumo_m3, monto_bs}, ...]
export const getFacturacionDistrito = (mes) =>
  get(`/facturacion/distrito?mes=${mes}`)

// ── Medidores activos/inactivos por zona ─────────────────────
// GET /api/medidores/resumen-zona
// Respuesta: [{distrito, zona, activos, inactivos}, ...]
export const getMedidoresResumenZona = () =>
  get(`/medidores/resumen-zona`)

// ── KPIs generales del mes ───────────────────────────────────
// GET /api/kpis/resumen?mes=YYYY-MM
// Respuesta: {medidores_activos, medidores_inactivos, total_medidores, pct_fallas, total_consumo_m3, total_ingreso_bs, total_ingreso_usd, total_contratos, mes}
export async function getKPIsResumen(mes) {
  const r = await fetch(`${BASE}/kpis/resumen${mes ? `?mes=${mes}` : ''}`)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// ── Consumo promedio por tarifa y distrito (Q7) ──────────────
// GET /api/consumo/tarifa-distrito?mes=YYYY-MM
// Respuesta: [{distrito, R1, R2, R3, R4, C, CE, I, P, S}, ...]
export const getConsumoTarifaDistrito = (mes) =>
  get(`/consumo/tarifa-distrito?mes=${mes}`)

// ── Conexiones por radiobase y zona (Q17) ────────────────────
// GET /api/conexiones/radiobase
// Respuesta: [{radiobase, zona, conexiones}, ...]
export const getConexionesRadiobase = () =>
  get(`/conexiones/radiobase`)

// ── Registrar nueva lectura (App Móvil) ──────────────────────
// POST /api/lectura  { medidor_iot, lectura_actual, fecha }
export async function postLectura(medidor_iot, lectura_actual, fecha) {
  const r = await fetch(`${BASE}/lectura`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medidor_iot, lectura_actual, fecha }),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}
