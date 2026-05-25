package controllers

import (
	"net/http"
	"semapa/backend/database"
	"sort"

	"github.com/gin-gonic/gin"
)

var distritosList = []string{
	"TUNARI", "MOLLE", "ALEJO CALATAYUD", "VALLE HERMOSO",
	"ITOCTA", "ADELA ZAMUDIO", "SACABA", "QUILLACOLLO",
}

// GET /api/top-consumidores?mes=YYYY-MM
// Top 3 consumidores por distrito (tabla top_consumidores_distrito_mes)
func GetTopConsumidores(c *gin.Context) {
	yearMonth := c.Query("mes")
	if yearMonth == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mes requerido (YYYY-MM)"})
		return
	}

	var result []map[string]interface{}
	for _, distrito := range distritosList {
		var consumo_m3 float64
		var numero_contrato, cliente, servicio string
		iter := database.Session.Query(
			`SELECT consumo_m3, numero_contrato, cliente, servicio
			 FROM top_consumidores_distrito_mes
			 WHERE distrito = ? AND year_month = ? LIMIT 3`,
			distrito, yearMonth).Iter()
		for iter.Scan(&consumo_m3, &numero_contrato, &cliente, &servicio) {
			result = append(result, map[string]interface{}{
				"distrito":   distrito,
				"contrato":   numero_contrato,
				"cliente":    cliente,
				"servicio":   servicio,
				"consumo_m3": consumo_m3,
			})
		}
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i]["consumo_m3"].(float64) > result[j]["consumo_m3"].(float64)
	})
	c.JSON(http.StatusOK, result)
}

// GET /api/facturacion/distrito?mes=YYYY-MM
// Consumo total por distrito en el mes (tabla consumo_tarifa_distrito_mes)
func GetFacturacionDistrito(c *gin.Context) {
	yearMonth := c.Query("mes")
	if yearMonth == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mes requerido (YYYY-MM)"})
		return
	}

	type row struct {
		Distrito   string
		ConsumoM3  float64
		MontoBs    float64
	}
	totals := make(map[string]*row)

	for _, distrito := range distritosList {
		var tarifa string
		var consumo_m3 float64
		iter := database.Session.Query(
			`SELECT tarifa, consumo_promedio_m3
			 FROM consumo_tarifa_distrito_mes
			 WHERE distrito = ? AND year_month = ?`,
			distrito, yearMonth).Iter()
		for iter.Scan(&tarifa, &consumo_m3) {
			if totals[distrito] == nil {
				totals[distrito] = &row{Distrito: distrito}
			}
			totals[distrito].ConsumoM3 += consumo_m3
		}
	}

	var result []map[string]interface{}
	for _, r := range totals {
		if r.ConsumoM3 > 0 {
			result = append(result, map[string]interface{}{
				"distrito":   r.Distrito,
				"consumo_m3": r.ConsumoM3,
				"monto_bs":   r.ConsumoM3 * 6.96, // aproximación Bs/m³
			})
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i]["consumo_m3"].(float64) > result[j]["consumo_m3"].(float64)
	})
	c.JSON(http.StatusOK, result)
}

// GET /api/medidores/resumen-zona
// Conteo de medidores activos/inactivos agrupado por distrito+zona
func GetMedidoresResumenZona(c *gin.Context) {
	type ZonaKey struct{ Distrito, Zona string }
	counts := make(map[ZonaKey]map[string]int)

	var distrito, zona, estado, _ string
	iter := database.Session.Query(
		`SELECT distrito, zona, estado, medidor_iot
		 FROM estado_medidores_zona ALLOW FILTERING LIMIT 300000`).Iter()
	for iter.Scan(&distrito, &zona, &estado, &_) {
		key := ZonaKey{distrito, zona}
		if counts[key] == nil {
			counts[key] = map[string]int{"activo": 0, "inactivo": 0}
		}
		if estado == "activo" {
			counts[key]["activo"]++
		} else {
			counts[key]["inactivo"]++
		}
	}

	var result []map[string]interface{}
	for key, m := range counts {
		result = append(result, map[string]interface{}{
			"distrito":  key.Distrito,
			"zona":      key.Zona,
			"activos":   m["activo"],
			"inactivos": m["inactivo"],
		})
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i]["activos"].(int) > result[j]["activos"].(int)
	})
	c.JSON(http.StatusOK, result)
}

// GET /api/kpis/resumen?mes=YYYY-MM
// KPIs agregados: medidores, consumo total, facturación, contratos
func GetKPIsResumen(c *gin.Context) {
	yearMonth := c.Query("mes")

	// Contar medidores por estado
	medActivos, medInactivos := 0, 0
	var estado, _, _ string
	iter := database.Session.Query(
		`SELECT estado, zona, medidor_iot FROM estado_medidores_zona ALLOW FILTERING LIMIT 300000`).Iter()
	for iter.Scan(&estado, &_, &_) {
		if estado == "activo" {
			medActivos++
		} else {
			medInactivos++
		}
	}

	// Totales de consumo e ingreso del mes
	totalConsumoM3, totalIngresoBs, totalIngresoUSD := 0.0, 0.0, 0.0
	var tarifa, alias string
	var consumo_m3, ingreso_bs, ingreso_usd, consumo_ft3 float64
	iter2 := database.Session.Query(
		`SELECT tarifa, alias, consumo_m3, consumo_ft3, ingreso_bs, ingreso_usd
		 FROM ingresos_tarifa_mes WHERE year_month = ?`, yearMonth).Iter()
	for iter2.Scan(&tarifa, &alias, &consumo_m3, &consumo_ft3, &ingreso_bs, &ingreso_usd) {
		totalConsumoM3 += consumo_m3
		totalIngresoBs += ingreso_bs
		totalIngresoUSD += ingreso_usd
	}

	// Contar contratos activos
	totalContratos := 0
	var contrato_id string
	iter3 := database.Session.Query(
		`SELECT numero_contrato FROM contratos_base ALLOW FILTERING LIMIT 200000`).Iter()
	for iter3.Scan(&contrato_id) {
		totalContratos++
	}

	c.JSON(http.StatusOK, gin.H{
		"medidores_activos":   medActivos,
		"medidores_inactivos": medInactivos,
		"total_medidores":     medActivos + medInactivos,
		"pct_fallas":          float64(medInactivos) / float64(medActivos+medInactivos+1) * 100,
		"total_consumo_m3":    totalConsumoM3,
		"total_ingreso_bs":    totalIngresoBs,
		"total_ingreso_usd":   totalIngresoUSD,
		"total_contratos":     totalContratos,
		"mes":                 yearMonth,
	})
}
