package routes

import (
	"semapa/backend/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	api := r.Group("/api")
	{
		api.GET("/consumo/distrito/hora", controllers.GetConsumoDistritoHora)
		api.GET("/consumo/distrito/semana", controllers.GetConsumoDistritoSemana)
		api.GET("/consumo/excesivo", controllers.GetConsumoExcesivo)
		api.GET("/ingresos/proyeccion", controllers.GetIngresosProyeccion)
		api.GET("/propietario/facturas", controllers.GetConsumoPropietario)
		api.GET("/medidores/cancelados", controllers.GetMedidoresCancelados)
		api.POST("/lectura", controllers.PostLectura)
		api.GET("/deudas/catastro", controllers.GetDeudasCatastro)
		api.GET("/top-consumidores", controllers.GetTopConsumidores)
		api.GET("/facturacion/distrito", controllers.GetFacturacionDistrito)
		api.GET("/medidores/resumen-zona", controllers.GetMedidoresResumenZona)
		api.GET("/kpis/resumen", controllers.GetKPIsResumen)
	}

	return r
}
