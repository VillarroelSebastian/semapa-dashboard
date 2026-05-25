package controllers

import (
	"net/http"
	"semapa/backend/database"

	"github.com/gin-gonic/gin"
)

func GetConsumoDistritoHora(c *gin.Context) {
	distrito := c.Query("distrito")
	fecha := c.Query("fecha")
	
	var hora int
	var consumo_m3 float64
	var result []map[string]interface{}

	iter := database.Session.Query(`SELECT hora, consumo_m3 FROM consumo_distrito_hora WHERE distrito = ? AND fecha = ?`, distrito, fecha).Iter()
	for iter.Scan(&hora, &consumo_m3) {
		result = append(result, map[string]interface{}{
			"hora": hora,
			"consumo_m3": consumo_m3,
		})
	}
	
	c.JSON(http.StatusOK, result)
}

func GetConsumoDistritoSemana(c *gin.Context) {
	distrito := c.Query("distrito")
	anio := c.Query("anio")
	
	var semana int
	var consumo_m3 float64
	var result []map[string]interface{}

	iter := database.Session.Query(`SELECT semana, consumo_m3 FROM consumo_distrito_semana WHERE distrito = ? AND anio = ?`, distrito, anio).Iter()
	for iter.Scan(&semana, &consumo_m3) {
		result = append(result, map[string]interface{}{
			"semana": semana,
			"consumo_m3": consumo_m3,
		})
	}
	
	c.JSON(http.StatusOK, result)
}

func GetConsumoExcesivo(c *gin.Context) {
	yearMonth := c.Query("mes")

	var consumo_m3 float64
	var numero_contrato, tarifa string
	var exceso_porcentaje float64
	var result []map[string]interface{}

	iter := database.Session.Query(`SELECT consumo_m3, numero_contrato, tarifa, exceso_porcentaje FROM contratos_consumo_excesivo WHERE year_month = ?`, yearMonth).Iter()
	for iter.Scan(&consumo_m3, &numero_contrato, &tarifa, &exceso_porcentaje) {
		result = append(result, map[string]interface{}{
			"contrato": numero_contrato,
			"tarifa": tarifa,
			"consumo_m3": consumo_m3,
			"exceso_porcentaje": exceso_porcentaje,
		})
	}
	
	c.JSON(http.StatusOK, result)
}

func GetIngresosProyeccion(c *gin.Context) {
	yearMonth := c.Query("mes")

	var tarifa, alias string
	var consumo_m3, consumo_ft3, ingreso_usd, ingreso_bs float64
	var result []map[string]interface{}

	iter := database.Session.Query(`SELECT tarifa, alias, consumo_m3, consumo_ft3, ingreso_usd, ingreso_bs FROM ingresos_tarifa_mes WHERE year_month = ?`, yearMonth).Iter()
	for iter.Scan(&tarifa, &alias, &consumo_m3, &consumo_ft3, &ingreso_usd, &ingreso_bs) {
		result = append(result, map[string]interface{}{
			"tarifa": tarifa,
			"alias": alias,
			"consumo_m3": consumo_m3,
			"consumo_ft3": consumo_ft3,
			"ingreso_usd": ingreso_usd,
			"ingreso_bs": ingreso_bs,
		})
	}
	
	c.JSON(http.StatusOK, result)
}

func GetConsumoPropietario(c *gin.Context) {
	propietario := c.Query("propietario")

	var year_month, numero_contrato string
	var consumo_total_m3, monto_total_usd, monto_total_bs float64
	var facturas_count int
	var result []map[string]interface{}

	iter := database.Session.Query(`SELECT year_month, numero_contrato, consumo_total_m3, facturas_count, monto_total_usd, monto_total_bs FROM consumo_facturas_propietario WHERE propietario = ?`, propietario).Iter()
	for iter.Scan(&year_month, &numero_contrato, &consumo_total_m3, &facturas_count, &monto_total_usd, &monto_total_bs) {
		result = append(result, map[string]interface{}{
			"mes": year_month,
			"contrato": numero_contrato,
			"consumo_m3": consumo_total_m3,
			"cantidad_facturas": facturas_count,
			"usd": monto_total_usd,
			"bs": monto_total_bs,
		})
	}
	
	c.JSON(http.StatusOK, result)
}

func GetMedidoresCancelados(c *gin.Context) {
	modelo := c.Query("modelo")

	var fecha_desinstalacion, medidor_iot string
	var result []map[string]interface{}

	iter := database.Session.Query(`SELECT fecha_desinstalacion, medidor_iot FROM medidores_cancelados_modelo WHERE modelo = ?`, modelo).Iter()
	for iter.Scan(&fecha_desinstalacion, &medidor_iot) {
		result = append(result, map[string]interface{}{
			"fecha_desinstalacion": fecha_desinstalacion,
			"medidor_iot": medidor_iot,
		})
	}
	
	c.JSON(http.StatusOK, result)
}

type LecturaRequest struct {
	MedidorIOT    string  `json:"medidor_iot"`
	LecturaActual float64 `json:"lectura_actual"`
	Fecha         string  `json:"fecha"`
}

func PostLectura(c *gin.Context) {
	var req LecturaRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Fetch previous reading
	var lecturaAnterior float64
	iter := database.Session.Query(`SELECT lectura_actual FROM lecturas_base WHERE medidor_iot = ? LIMIT 1`, req.MedidorIOT).Iter()
	if !iter.Scan(&lecturaAnterior) {
		lecturaAnterior = 0 // first reading
	}

	consumoM3 := req.LecturaActual - lecturaAnterior

	// Insert into DB
	err := database.Session.Query(`INSERT INTO lecturas_base (medidor_iot, fecha_hora_lectura, consumo_m3, lectura_actual, lectura_anterior, radiobase) VALUES (?, ?, ?, ?, ?, ?)`,
		req.MedidorIOT, req.Fecha, consumoM3, req.LecturaActual, lecturaAnterior, "Manual").Exec()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not insert reading"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Lectura insertada exitosamente",
		"medidor": req.MedidorIOT,
		"consumo_m3": consumoM3,
	})
}

func GetDeudasCatastro(c *gin.Context) {
	catastro := c.Query("catastro")

	var year_month, numero_contrato, estado_pago string
	var monto_usd, monto_bs float64
	var result []map[string]interface{}

	iter := database.Session.Query(`SELECT year_month, numero_contrato, monto_usd, monto_bs, estado_pago FROM deudas_catastro WHERE numero_catastro = ?`, catastro).Iter()
	for iter.Scan(&year_month, &numero_contrato, &monto_usd, &monto_bs, &estado_pago) {
		result = append(result, map[string]interface{}{
			"mes": year_month,
			"contrato": numero_contrato,
			"deuda_usd": monto_usd,
			"deuda_bs": monto_bs,
			"estado": estado_pago,
		})
	}
	
	c.JSON(http.StatusOK, result)
}

