// ============================================================
// DATOS SIMULADOS - SEMAPA COCHABAMBA
// ============================================================

// Solo las 6 sub-alcaldías del Cercado de Cochabamba (área de SEMAPA)
export const DISTRITOS = [
  "TUNARI", "MOLLE", "ALEJO CALATAYUD", "VALLE HERMOSO", "ITOCTA", "ADELA ZAMUDIO",
];

export const ZONAS_POR_DISTRITO = {
  "TUNARI": ["QUERU QUERU ALTO", "ARANJUEZ ALTO", "MESADILLA", "MAYORAZGO", "CALA CALA", "CONDEBAMBA", "TEMPORAL PAMPA", "LA TEMIBLE CARA CARA"],
  "MOLLE": ["SARCO", "HIPODROMO", "SARCOBAMBA", "VILLA BUSCH", "CHIQUICOLLO", "LA CHIMBA", "COÑA COÑA"],
  "ALEJO CALATAYUD": ["SUDESTE", "LA MAICA", "JAIHUAYCO", "ALALAY NORTE", "LACMA", "TICTI", "VALLE HERMOSO", "USPHA USPHA"],
  "VALLE HERMOSO": ["ALALAY NORTE", "ALALAY SUD", "VALLE HERMOSO"],
  "ITOCTA": ["LA MAICA", "COÑA COÑA", "TAMBORADA PUKARITA", "1° DE MAYO", "PUKARA GRANDE NORTE", "VALLE HERMOSO OESTE", "PUKARA GRANDE SUR", "PUKARA GRANDE OESTE", "KHARA KHARA ARRUMANI"],
  "ADELA ZAMUDIO": ["NOROESTE", "NORESTE", "SUDOESTE", "SUDESTE", "MUYURINA", "LAS CUADRAS", "ALALAY NORTE", "SARCO", "CALA CALA", "QUERU QUERU", "TUPURAYA", "HIPODROMO"],
};

export const MODELOS_MEDIDORES = ["ITC 100", "Siconia WATER WM-NB", "OY1320 LoRaWAN", "WP20", "Medidor 100% IoT"];

// 14 radiobases LoRaWAN dentro del Cercado de Cochabamba
export const RADIOBASES = [
  "LoRaWan-ParqueLincon", "LoRaWan-Teleferico", "LoRaWan-Petrolera", "LoRaWan-ParqueVial",
  "LoRaWan-CentroHistorico", "LoRaWan-Aeropuerto", "LoRaWan-Sarco",
  "LoRaWan-Alalay", "LoRaWan-Tamborada", "LoRaWan-Hipodromo",
  "LoRaWan-CalaCala", "LoRaWan-VillaAdela", "LoRaWan-LaMarofa", "LoRaWan-ConoSur"
];

// KPIs principales Dashboard 1 - Alcaldía
export const kpiAlcaldia = {
  coberturaPoblacion: 87.4,
  hogaresConectados: 82.1,
  nuevasConexionesMes: 1247,
  consumoTotalDiario: 245800, // m³
  consumoPerCapita: 187, // litros/habitante/día
  indiceAhorroAgua: 73.2,
  medidoresIoTActivos: 114230,
  medidoresFallas: 5770,
  porcentajeFallas: 4.81,
  calidadSenalLoRaWAN: 91.3,
  alertasSobreconsumo: 342,
  zonasCriticasEstresHidrico: 8,
  temperaturaPromedio: 18.5,
  consumoVsTemperatura: [
    { mes: "Feb", consumo: 238000, temperatura: 19.2 },
    { mes: "Mar", consumo: 245800, temperatura: 18.5 },
    { mes: "Abr", consumo: 251200, temperatura: 17.1 },
  ],
  tendenciaMensual: [
    { mes: "Feb", consumo: 238000 },
    { mes: "Mar", consumo: 245800 },
    { mes: "Abr", consumo: 251200 },
  ],
};

// KPIs principales Dashboard 2 - Gerencia
export const kpiGerencia = {
  totalConsumoAcumulado: 735000, // m³ (3 meses)
  consumoPromedioDiario: 8167, // m³
  picoMaximoHorario: 12400, // m³
  totalMedidoresActivos: 114230,
  medidoresInactivos: 5770,
  medidoresDuplicando: 84, // 0.07%
  sensoresConErrores: 5770,
  edadPromedioMedidores: 3.2, // años
  lecturasAppMovil: 28450,
  contratosActivos: 98234,
  contratosSuspendidos: 1766,
  preaviosEnviados: 12340,
  tasaAperturaMsg: 68.4,
  usuariosDigitales: 45230,
  disponibilidadSistema: 99.7,
  latenciaIngestion: 142, // ms
};

// KPIs principales Dashboard 3 - Financiero
export const kpiFinanciero = {
  montoFacturadoMensual: 45234567, // Bs
  facturacionAcumuladaAnual: 135703701, // Bs
  ticketPromedio: 460, // Bs
  carteraVencida: 8934521, // Bs
  indiceMora: 19.8, // %
  contratosEnRiesgo: 4521,
  preaviosEmitidos: 12340,
  tasaEntregaPreaviso: 94.2,
  tasaAperturaPreaviso: 68.4,
  conversionPago: 42.1,
  montoRecaudado: 36187654, // Bs
  porcentajeRecuperacion: 79.9,
};

// Consumo por distrito por rango de 8 horas
export const consumoPorDistritoHorario = [
  { distrito: "TUNARI", rango: "00:00-08:00", consumo: 1254004 },
  { distrito: "TUNARI", rango: "08:00-16:00", consumo: 6854221 },
  { distrito: "TUNARI", rango: "16:00-24:00", consumo: 7254133 },
  { distrito: "MOLLE", rango: "00:00-08:00", consumo: 980123 },
  { distrito: "MOLLE", rango: "08:00-16:00", consumo: 5421087 },
  { distrito: "MOLLE", rango: "16:00-24:00", consumo: 6123456 },
  { distrito: "ALEJO CALATAYUD", rango: "00:00-08:00", consumo: 760234 },
  { distrito: "ALEJO CALATAYUD", rango: "08:00-16:00", consumo: 4234567 },
  { distrito: "ALEJO CALATAYUD", rango: "16:00-24:00", consumo: 4987654 },
  { distrito: "VALLE HERMOSO", rango: "00:00-08:00", consumo: 890345 },
  { distrito: "VALLE HERMOSO", rango: "08:00-16:00", consumo: 5123456 },
  { distrito: "VALLE HERMOSO", rango: "16:00-24:00", consumo: 5678901 },
];

// Top 10 zonas mayor demanda
export const top10ZonasDemanda = [
  { zona: "SARCOBAMBA", distrito: "MOLLE", consumo: 42500 },
  { zona: "CALA CALA", distrito: "TUNARI", consumo: 38900 },
  { zona: "VILLA BUSCH", distrito: "MOLLE", consumo: 36700 },
  { zona: "SARCO", distrito: "MOLLE", consumo: 35200 },
  { zona: "CHIQUICOLLO", distrito: "MOLLE", consumo: 33800 },
  { zona: "MAYORAZGO", distrito: "TUNARI", consumo: 32100 },
  { zona: "CONDEBAMBA", distrito: "TUNARI", consumo: 30500 },
  { zona: "LA MAICA", distrito: "ALEJO CALATAYUD", consumo: 28900 },
  { zona: "JAIHUAYCO", distrito: "ALEJO CALATAYUD", consumo: 27400 },
  { zona: "NOROESTE", distrito: "ADELA ZAMUDIO", consumo: 26100 },
];

// Comparativa 4 semanas
export const comparativa4Semanas = [
  { semana: "S1", TUNARI: 125000, MOLLE: 98000, "ALEJO CALATAYUD": 76000, "VALLE HERMOSO": 89000, ITOCTA: 65000 },
  { semana: "S2", TUNARI: 127500, MOLLE: 97500, "ALEJO CALATAYUD": 75800, "VALLE HERMOSO": 91200, ITOCTA: 67800 },
  { semana: "S3", TUNARI: 130000, MOLLE: 99000, "ALEJO CALATAYUD": 76200, "VALLE HERMOSO": 93400, ITOCTA: 66200 },
  { semana: "S4", TUNARI: 132300, MOLLE: 100200, "ALEJO CALATAYUD": 78000, "VALLE HERMOSO": 95100, ITOCTA: 68900 },
];

// Contratos con consumo excesivo (>45 m³)
export const contratosExcesivos = [
  { contrato: "65412354", tarifa: "Residencial R2", consumoLitros: 110000, consumoM3: 110, excesoPct: 26.70 },
  { contrato: "88745212", tarifa: "Residencial R3", consumoLitros: 154236, consumoM3: 154.2, excesoPct: 46.60 },
  { contrato: "65641122", tarifa: "Residencial R4", consumoLitros: 125441, consumoM3: 125.4, excesoPct: 12.36 },
  { contrato: "74123698", tarifa: "Residencial R2", consumoLitros: 98500, consumoM3: 98.5, excesoPct: 8.90 },
  { contrato: "32165498", tarifa: "Residencial R3", consumoLitros: 162000, consumoM3: 162, excesoPct: 54.20 },
  { contrato: "45678912", tarifa: "Residencial R1", consumoLitros: 87300, consumoM3: 87.3, excesoPct: -1.40 },
  { contrato: "98741236", tarifa: "Residencial R4", consumoLitros: 201500, consumoM3: 201.5, excesoPct: 91.80 },
  { contrato: "12369874", tarifa: "Residencial R2", consumoLitros: 78900, consumoM3: 78.9, excesoPct: -9.90 },
];

// Medidores activos por distrito y zona
export const medidoresActivosPorZona = [
  { distrito: "TUNARI", zona: "SARCOBAMBA", activos: 2651, inactivos: 651 },
  { distrito: "MOLLE", zona: "VILLA BUSCH", activos: 1235, inactivos: 135 },
  { distrito: "ALEJO CALATAYUD", zona: "CHIQUICOLLO", activos: 1254, inactivos: 54 },
  { distrito: "TUNARI", zona: "CALA CALA", activos: 3120, inactivos: 280 },
  { distrito: "MOLLE", zona: "SARCO", activos: 2890, inactivos: 310 },
  { distrito: "TUNARI", zona: "MAYORAZGO", activos: 2450, inactivos: 150 },
  { distrito: "ADELA ZAMUDIO", zona: "NOROESTE", activos: 1890, inactivos: 210 },
  { distrito: "ITOCTA", zona: "LA MAICA", activos: 2100, inactivos: 340 },
  { distrito: "VALLE HERMOSO", zona: "ALALAY NORTE", activos: 1760, inactivos: 140 },
  { distrito: "ALEJO CALATAYUD", zona: "JAIHUAYCO", activos: 2340, inactivos: 260 },
];

// Medidores fuera de servicio
export const medidoresFueraDeSservicio = [
  { distrito: "TUNARI", zona: "SARCOBAMBA", fueraDeSservicio: 651 },
  { distrito: "MOLLE", zona: "VILLA BUSCH", fueraDeSservicio: 135 },
  { distrito: "ALEJO CALATAYUD", zona: "CHIQUICOLLO", fueraDeSservicio: 54 },
  { distrito: "TUNARI", zona: "CALA CALA", fueraDeSservicio: 280 },
  { distrito: "MOLLE", zona: "SARCO", fueraDeSservicio: 310 },
  { distrito: "ITOCTA", zona: "LA MAICA", fueraDeSservicio: 340 },
];

// Fallos por modelo
export const fallosPorModelo = [
  { modelo: "ITC 100", fallo: "Falla en la alimentación eléctrica", cantidad: 144 },
  { modelo: "Siconia WATER WM-NB", fallo: "Fallo en la conectividad de red", cantidad: 2622 },
  { modelo: "OY1320 LoRaWAN", fallo: "Configuración incorrecta del sensor o gateway", cantidad: 1224 },
  { modelo: "WP20", fallo: "Falla en la alimentación eléctrica", cantidad: 312 },
  { modelo: "Medidor 100% IoT", fallo: "Fallo en la conectividad de red", cantidad: 890 },
];

// Consumo promedio mensual por tarifa y distrito
export const consumoPorTarifaDistrito = [
  { distrito: "TUNARI", Residencial: 6818, Comercial: 5506, "Comercial Especial": 6083, Industrial: 551, Preferencial: 4181, Social: 7945 },
  { distrito: "MOLLE", Residencial: 5768, Comercial: 526, "Comercial Especial": 1168, Industrial: 3104, Preferencial: 8613, Social: 3987 },
  { distrito: "ALEJO CALATAYUD", Residencial: 7111, Comercial: 9081, "Comercial Especial": 4106, Industrial: 5983, Preferencial: 3140, Social: 8719 },
  { distrito: "VALLE HERMOSO", Residencial: 5258, Comercial: 696, "Comercial Especial": 7194, Industrial: 2190, Preferencial: 5557, Social: 3831 },
  { distrito: "ITOCTA", Residencial: 2972, Comercial: 9159, "Comercial Especial": 8938, Industrial: 1280, Preferencial: 1986, Social: 8351 },
  { distrito: "ADELA ZAMUDIO", Residencial: 2941, Comercial: 9956, "Comercial Especial": 1429, Industrial: 5523, Preferencial: 7759, Social: 1280 },
];

// Facturación por distrito (Bs) — solo 6 sub-alcaldías del Cercado
export const facturacionPorDistrito = [
  { distrito: "TUNARI", monto: 9234567, variacion: 4.2 },
  { distrito: "MOLLE", monto: 8123456, variacion: 3.1 },
  { distrito: "ALEJO CALATAYUD", monto: 7456789, variacion: 5.8 },
  { distrito: "VALLE HERMOSO", monto: 6789012, variacion: 2.9 },
  { distrito: "ITOCTA", monto: 5678901, variacion: -1.2 },
  { distrito: "ADELA ZAMUDIO", monto: 4567890, variacion: 7.3 },
];

// Proyección de ingresos por tarifa
export const proyeccionIngresosTarifa = [
  { categoria: "Residencial R1", alias: "R1", consumoM3: 144237, ingresoUSD: 201210.62, ingresoBs: 1389324 },
  { categoria: "Residencial R2", alias: "R2", consumoM3: 8059139, ingresoUSD: 22411122.37, ingresoBs: 154716734 },
  { categoria: "Residencial R3", alias: "R3", consumoM3: 1012619, ingresoUSD: 5279964.24, ingresoBs: 36431573 },
  { categoria: "Residencial R4", alias: "R4", consumoM3: 1004727, ingresoUSD: 8726054.00, ingresoBs: 60209773 },
  { categoria: "Comercial", alias: "C", consumoM3: 9018678, ingresoUSD: 94064811.54, ingresoBs: 649047199 },
  { categoria: "Comercial Especial", alias: "CE", consumoM3: 849281, ingresoUSD: 10331503.37, ingresoBs: 71287373 },
  { categoria: "Industrial", alias: "I", consumoM3: 2026095, ingresoUSD: 19018278.40, ingresoBs: 131226121 },
  { categoria: "Preferencial", alias: "P", consumoM3: 126323, ingresoUSD: 578559.34, ingresoBs: 3992059 },
  { categoria: "Social", alias: "S", consumoM3: 100392, ingresoUSD: 767329.52, ingresoBs: 5294574 },
];

// Demanda proyectada 5 años
export const demandaProyectada5Anos = [
  { distrito: "TUNARI", "2025": 42983, "2026": 44101, "2027": 45247, "2028": 46424, "2029": 47631 },
  { distrito: "MOLLE", "2025": 75792, "2026": 77763, "2027": 79784, "2028": 81859, "2029": 83987 },
  { distrito: "ALEJO CALATAYUD", "2025": 15632, "2026": 16038, "2027": 16455, "2028": 16883, "2029": 17322 },
  { distrito: "VALLE HERMOSO", "2025": 70637, "2026": 72474, "2027": 74358, "2028": 76291, "2029": 78275 },
  { distrito: "ITOCTA", "2025": 35598, "2026": 36524, "2027": 37473, "2028": 38447, "2029": 39447 },
  { distrito: "ADELA ZAMUDIO", "2025": 18229, "2026": 18703, "2027": 19189, "2028": 19688, "2029": 20200 },
];

// Cartera vencida por antigüedad
export const carteraVencidaAging = [
  { rango: "0-30 días", monto: 1234567, contratos: 890 },
  { rango: "31-60 días", monto: 2345678, contratos: 1234 },
  { rango: "61-90 días", monto: 1987654, contratos: 987 },
  { rango: "91-180 días", monto: 1876543, contratos: 756 },
  { rango: ">180 días", monto: 1490079, contratos: 654 },
];

// Efectividad por canal de cobranza
export const efectividadCanal = [
  { canal: "SMS", enviados: 5420, entregados: 5218, abiertos: 3876, pagaron: 1634, efectividad: 30.1 },
  { canal: "WhatsApp", enviados: 4230, entregados: 4145, abiertos: 3342, pagaron: 1876, efectividad: 44.3 },
  { canal: "Email", enviados: 2690, entregados: 2456, abiertos: 1234, pagaron: 612, efectividad: 22.7 },
];

// Lecturas fallidas por tipo de medidor
export const lecturasFallidasPorModelo = [
  { codigo: 3, descripcion: "Falla en la alimentación eléctrica", "ITC 100": 92, "Siconia WATER WM-NB": 3, "OY1320 LoRaWAN": 60, "WP20": 131, "Medidor IoT": 41 },
  { codigo: 4, descripcion: "Fallo en la conectividad de red", "ITC 100": 40, "Siconia WATER WM-NB": 107, "OY1320 LoRaWAN": 161, "WP20": 173, "Medidor IoT": 160 },
  { codigo: 5, descripcion: "Config. incorrecta sensor/gateway", "ITC 100": 54, "Siconia WATER WM-NB": 177, "OY1320 LoRaWAN": 19, "WP20": 179, "Medidor IoT": 149 },
];

// Top consumidores por distrito
export const topConsumidoresPorDistrito = [
  { distrito: "TUNARI", servicio: 123545, cliente: "Conde Dooku Darth Tyranus", consumo: 77 },
  { distrito: "MOLLE", servicio: 654789, cliente: "Abraham Jebediah Simpson II", consumo: 89 },
  { distrito: "ALEJO CALATAYUD", servicio: 258963, cliente: "Charles Montgomery Burns", consumo: 36 },
  { distrito: "VALLE HERMOSO", servicio: 104785, cliente: "Jacqueline Ingrid Bouvier", consumo: 17 },
  { distrito: "ITOCTA", servicio: 321456, cliente: "Margaret Maggie Simpson", consumo: 49 },
  { distrito: "ADELA ZAMUDIO", servicio: 987654, cliente: "Homero Jay Simpson", consumo: 62 },
];

// Cobertura antenas LoRaWAN
export const coberturaAntenas = [
  { radioBase: "LoRaWan-Teleferico", zona: "SARCOBAMBA", conexiones: 16446 },
  { radioBase: "LoRaWan-Teleferico", zona: "VILLA BUSCH", conexiones: 18762 },
  { radioBase: "LoRaWan-Teleferico", zona: "CHIQUICOLLO", conexiones: 69226 },
  { radioBase: "LoRaWan-Petrolera", zona: "LA CHIMBA", conexiones: 30147 },
  { radioBase: "LoRaWan-ParqueLincon", zona: "CALA CALA", conexiones: 24890 },
  { radioBase: "LoRaWan-ParqueVial", zona: "NOROESTE", conexiones: 19234 },
];

// Consumo anómalo por zona y modelo
export const consumoAnomaloPorModelo = [
  { modelo: "ITC 100", total: 3720, zonas: "QUERU QUERU ALTO, MESADILLA, MAYORAZGO" },
  { modelo: "Siconia WATER WM-NB", total: 8469, zonas: "CONDEBAMBA, TEMPORAL PAMPA, SARCO" },
  { modelo: "OY1320 LoRaWAN", total: 3352, zonas: "COÑA COÑA, SUDESTE, LA MAICA, JAIHUAYCO" },
  { modelo: "WP20", total: 7707, zonas: "ARANJUEZ ALTO, MESADILLA, MAYORAZGO" },
  { modelo: "Medidor 100% IoT", total: 6957, zonas: "CALA CALA, CONDEBAMBA, SARCO" },
];

// Consumo per cápita por zona residencial
export const consumoPercapitaZonaResidencial = [
  { zona: "SARCOBAMBA", R1: 2772, R2: 519, R3: 5176, R4: 9591 },
  { zona: "VILLA BUSCH", R1: 2425, R2: 4450, R3: 3509, R4: 2166 },
  { zona: "CHIQUICOLLO", R1: 7132, R2: 2903, R3: 7734, R4: 3761 },
  { zona: "LA CHIMBA", R1: 698, R2: 2917, R3: 1413, R4: 5676 },
];

// Proyección flujo financiero 3 meses
export const proyeccionFlujo3Meses = [
  { mes: "Jun 2026", ingresoEsperado: 47200000, gastoOperativo: 12400000, utilidad: 34800000 },
  { mes: "Jul 2026", ingresoEsperado: 48100000, gastoOperativo: 12800000, utilidad: 35300000 },
  { mes: "Ago 2026", ingresoEsperado: 49500000, gastoOperativo: 13100000, utilidad: 36400000 },
];

// Medidores sin reporte
export const medidoresSinReporte = [
  { distrito: "MOLLE", zona: "SARCOBAMBA", direccion: "Av. Juan Capriles y Anaya Nro 125", numeroSerie: "SN=254-41269-1411" },
  { distrito: "MOLLE", zona: "SARCOBAMBA", direccion: "Av. Esteban Arce Nro 444", numeroSerie: "SN=254-41881-7854" },
  { distrito: "TUNARI", zona: "SARCOBAMBA", direccion: "Calle Perú Nro 77", numeroSerie: "SN=254-74584-1413" },
  { distrito: "ALEJO CALATAYUD", zona: "JAIHUAYCO", direccion: "Av. Petrolera Km 5 Nro 892", numeroSerie: "SN=254-92341-5521" },
  { distrito: "ITOCTA", zona: "LA MAICA", direccion: "Calle Litoral Nro 234", numeroSerie: "SN=254-67821-9914" },
];

// Impacto cambio tarifario Preferencial → R4
export const impactoCambioTarifa = {
  nroContratosP: 11218,
  consumoM3: 1244795,
  ingresoActualP_USD: 5701161.10,
  ingresoNuevoR4_USD: 10817268.55,
  incrementoUSD: 5116107.45,
  ingresoActualP_Bs: 39337807,
  ingresoNuevoR4_Bs: 74639152,
  incrementoBs: 35301345,
};
