-- init.cql

CREATE KEYSPACE IF NOT EXISTS semapa WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 2};

USE semapa;

-- 1. ¿Consumo promedio por distrito en un rango de 8 horas?
CREATE TABLE IF NOT EXISTS consumo_distrito_hora (
    distrito text,
    fecha date,
    hora int,
    consumo_m3 double,
    PRIMARY KEY ((distrito, fecha), hora)
);

-- 2. ¿Comparativa de consumo entre las 4 últimas semanas de 3 o más distritos?
CREATE TABLE IF NOT EXISTS consumo_distrito_semana (
    distrito text,
    anio int,
    semana int,
    consumo_m3 double,
    PRIMARY KEY ((distrito, anio), semana)
) WITH CLUSTERING ORDER BY (semana DESC);

-- 3. ¿Identificación de los contratos con consumo excesivo? (> 45m3)
CREATE TABLE IF NOT EXISTS contratos_consumo_excesivo (
    year_month text,
    consumo_m3 double,
    numero_contrato text,
    tarifa text,
    exceso_porcentaje double,
    PRIMARY KEY ((year_month), consumo_m3, numero_contrato)
) WITH CLUSTERING ORDER BY (consumo_m3 DESC, numero_contrato ASC);

-- 4 y 5. Estado de medidores por distrito y zona (activos / inactivos / fuera de servicio)
CREATE TABLE IF NOT EXISTS estado_medidores_zona (
    distrito text,
    zona text,
    estado text,
    medidor_iot text,
    PRIMARY KEY ((distrito, zona, estado), medidor_iot)
);

-- 6. ¿Qué modelos de medidores tienen mayor tasa de fallos o reportes técnicos?
CREATE TABLE IF NOT EXISTS fallos_modelo_medidor (
    modelo text,
    fallos_reportados int,
    cantidad_medidores int,
    PRIMARY KEY ((modelo))
);

-- 7. ¿Cuál es el consumo promedio mensual en m3 por tarifa por distrito?
CREATE TABLE IF NOT EXISTS consumo_tarifa_distrito_mes (
    distrito text,
    year_month text,
    tarifa text,
    consumo_promedio_m3 double,
    PRIMARY KEY ((distrito, year_month), tarifa)
);

-- 8. Zonas con medidores con consumo anómalo
CREATE TABLE IF NOT EXISTS consumo_anomalo_zona (
    zona text,
    year_month text,
    tipo_anomalia text,
    medidor_iot text,
    modelo text,
    PRIMARY KEY ((zona, year_month), tipo_anomalia, medidor_iot)
);

-- 9. Lecturas fallidas o inconsistentes por tipo de medidor
CREATE TABLE IF NOT EXISTS lecturas_fallidas_tipo_medidor (
    codigo_tipo text,
    descripcion_tipo text,
    year_month text,
    medidor_iot text,
    PRIMARY KEY ((codigo_tipo, year_month), medidor_iot)
);

-- 10. Porcentaje de medidores con más de 4 años de antigüedad
CREATE TABLE IF NOT EXISTS antiguedad_medidores (
    anio_instalacion int,
    medidor_iot text,
    PRIMARY KEY ((anio_instalacion), medidor_iot)
);

-- 11. ¿Qué zonas presentan mayor consumo per cápita por categoría residencial?
CREATE TABLE IF NOT EXISTS consumo_per_capita_zona_residencial (
    zona text,
    year_month text,
    subcategoria text,
    consumo_per_capita double,
    PRIMARY KEY ((zona, year_month), subcategoria)
);

-- 12. Imprima los 3 clientes/servicios que más consume agua por cada Distrito del mes activo
CREATE TABLE IF NOT EXISTS top_consumidores_distrito_mes (
    distrito text,
    year_month text,
    consumo_m3 double,
    numero_contrato text,
    cliente text,
    servicio text,
    PRIMARY KEY ((distrito, year_month), consumo_m3, numero_contrato)
) WITH CLUSTERING ORDER BY (consumo_m3 DESC, numero_contrato ASC);

-- 13 y 14. Zonas que requieren renovación (cantidad de errores) / Sorpresa 1
CREATE TABLE IF NOT EXISTS errores_medidor_distrito_zona (
    distrito text,
    zona text,
    cantidad_errores int,
    medidor_iot text,
    codigo_modelo text,
    descripcion_modelo text,
    PRIMARY KEY ((distrito, zona), cantidad_errores, medidor_iot)
) WITH CLUSTERING ORDER BY (cantidad_errores DESC, medidor_iot ASC);

-- 15. Consulta sorpresa 2: ¿Qué zonas tienen mayor cobertura de las antenas?
CREATE TABLE IF NOT EXISTS conexiones_radiobase_zona (
    radiobase text,
    zona text,
    conexiones int,
    PRIMARY KEY ((radiobase, zona))
);

-- 16. Demanda proyectada de agua para los siguientes 5 años por distrito
CREATE TABLE IF NOT EXISTS demanda_proyectada_distrito (
    distrito text,
    anio int,
    demanda_m3 double,
    PRIMARY KEY ((distrito), anio)
);

-- 17. Consulta sorpresa 4: Impacto de cambio de tarifa
CREATE TABLE IF NOT EXISTS proyeccion_ingresos_tarifa (
    tarifa text,
    year_month text,
    numero_contrato text,
    consumo_m3 double,
    ingreso_usd double,
    ingreso_bs double,
    PRIMARY KEY ((tarifa, year_month), numero_contrato)
);

-- 18. Medidores que no reportaron su consumo
CREATE TABLE IF NOT EXISTS medidores_sin_reporte (
    year_month text,
    distrito text,
    zona text,
    direccion text,
    numero_serie text,
    PRIMARY KEY ((year_month), distrito, zona, numero_serie)
);

-- 19 y 21. Proyección de ingresos por consumo por tipo de tarifa (mes) en m3 y pies3
CREATE TABLE IF NOT EXISTS ingresos_tarifa_mes (
    year_month text,
    tarifa text,
    alias text,
    consumo_m3 double,
    consumo_ft3 double,
    ingreso_usd double,
    ingreso_bs double,
    PRIMARY KEY ((year_month), tarifa)
);

-- 20. Cobro del consumo mínimo de la categoría Residencial
CREATE TABLE IF NOT EXISTS cobro_minimo_residencial (
    year_month text,
    numero_contrato text,
    cliente text,
    monto_usd double,
    monto_bs double,
    PRIMARY KEY ((year_month), numero_contrato)
);

-- Raw data table for ETL to insert base readings
CREATE TABLE IF NOT EXISTS lecturas_base (
    medidor_iot text,
    fecha_hora_lectura timestamp,
    lectura_anterior double,
    lectura_actual double,
    consumo_m3 double,
    radiobase text,
    PRIMARY KEY ((medidor_iot), fecha_hora_lectura)
) WITH CLUSTERING ORDER BY (fecha_hora_lectura DESC);

-- Nuevas Tablas (Propietarios y Cancelaciones)

CREATE TABLE IF NOT EXISTS medidores_cancelados_modelo (
    modelo text,
    fecha_desinstalacion text,
    medidor_iot text,
    PRIMARY KEY ((modelo), fecha_desinstalacion, medidor_iot)
);

CREATE TABLE IF NOT EXISTS consumo_facturas_propietario (
    propietario text,
    year_month text,
    numero_contrato text,
    consumo_total_m3 double,
    facturas_count int,
    monto_total_usd double,
    monto_total_bs double,
    PRIMARY KEY ((propietario), year_month, numero_contrato)
);

CREATE TABLE IF NOT EXISTS contratos_base (
    numero_contrato text PRIMARY KEY,
    numero_catastro text,
    titular text,
    categoria text,
    subcategoria text,
    medidor_iot text,
    estado text
);

CREATE TABLE IF NOT EXISTS deudas_catastro (
    numero_catastro text,
    year_month text,
    numero_contrato text,
    monto_usd double,
    monto_bs double,
    estado_pago text,
    PRIMARY KEY ((numero_catastro), year_month, numero_contrato)
) WITH CLUSTERING ORDER BY (year_month DESC);


