package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gocql/gocql"
)

type Tarifa struct {
	Categoria     string
	Subcategoria  string
	BaseM3        float64
	BaseUSD       float64
	Tarifa13_25   float64
	Tarifa26_50   float64
	Tarifa51_75   float64
	Tarifa76_100  float64
	Tarifa101_150 float64
	TarifaMas151  float64
}

type Contrato struct {
	NumeroContrato string
	NumeroCatastro string
	Titular        string
	Categoria      string
	Subcategoria   string
	MedidorIOT     string
	Estado         string
}

type Infraestructura struct {
	NumeroCatastro string
	Zona           string
	Distrito       string
	Latitud        float64
	Longitud       float64
}

type Lectura struct {
	MedidorIOT      string
	LecturaAnterior float64
	LecturaActual   float64
	FechaHora       time.Time
	Radiobase       string
	ConsumoM3       float64
}

type Medidor struct {
	MedidorIOT         string
	Estado             string
	TipoMedidorID      string
	AnioInstalado      int
	FechaDesinstalacion string
}

type DistritoInfo struct {
	Distrito   string
	Zona       string
	Habitantes int
}

const usdToBs = 6.96

func main() {
	cassandraHost := os.Getenv("CASSANDRA_HOST")
	if cassandraHost == "" {
		cassandraHost = "127.0.0.1"
	}

	csvDir := os.Getenv("CSV_DIR")
	if csvDir == "" {
		csvDir = ".."
	}

	// 1. Connect to Cassandra
	cluster := gocql.NewCluster(cassandraHost)
	cluster.Keyspace = "semapa"
	cluster.Consistency = gocql.One
	session, err := cluster.CreateSession()
	if err != nil {
		log.Fatalf("Error connecting to Cassandra (is it running?): %v", err)
	}
	defer session.Close()

	// 2. Load CSVs into memory
	tarifas := loadTarifas(csvDir + "/estructuraTarifas.csv")
	contratos := loadContratos(csvDir + "/03 Practica 5 Recursos contratos_agua.csv")
	infraestructuras := loadInfraestructuras(csvDir + "/03 Practica 5 Recursos infraestructuras_cochabamba.csv")
	medidores := loadMedidores(csvDir + "/03 Practica 5 Recursos medidores_iot.csv")
	distritos := loadDistritos(csvDir + "/Distritos.csv")
	lecturas := loadLecturas(csvDir + "/03 Practica 5 Recursos lecturas_iot.csv")

	// Create indexes for easy lookup
	contratoByMedidor := make(map[string]Contrato)
	for _, c := range contratos {
		contratoByMedidor[c.MedidorIOT] = c
	}
	
	infraByCatastro := make(map[string]Infraestructura)
	for _, i := range infraestructuras {
		infraByCatastro[i.NumeroCatastro] = i
	}

	medidorByIOT := make(map[string]Medidor)
	for _, m := range medidores {
		medidorByIOT[m.MedidorIOT] = m
	}

	distritoByZona := make(map[string]DistritoInfo)
	for _, d := range distritos {
		distritoByZona[d.Zona] = d
	}

	// 3. Truncate tables to ensure fresh run
	tablesToTruncate := []string{
		"consumo_distrito_hora", "consumo_distrito_semana", "contratos_consumo_excesivo",
		"estado_medidores_zona", "consumo_tarifa_distrito_mes", "consumo_anomalo_zona",
		"consumo_per_capita_zona_residencial", "top_consumidores_distrito_mes",
		"conexiones_radiobase_zona", "ingresos_tarifa_mes", "cobro_minimo_residencial",
		"consumo_facturas_propietario", "medidores_cancelados_modelo", "lecturas_base",
		"contratos_base", "deudas_catastro",
	}
	fmt.Println("Truncating tables...")
	for _, table := range tablesToTruncate {
		_ = session.Query(fmt.Sprintf("TRUNCATE %s", table)).Exec()
	}

	// 4. Process and Insert Contracts
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, 100) // max 100 concurrent workers
	
	fmt.Println("Starting to insert contracts...")
	for _, c := range contratos {
		wg.Add(1)
		semaphore <- struct{}{}
		go func(c Contrato) {
			defer wg.Done()
			defer func() { <-semaphore }()
			
			// Insert Contract
			session.Query(`INSERT INTO contratos_base (numero_contrato, numero_catastro, titular, categoria, subcategoria, medidor_iot, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`,
				c.NumeroContrato, c.NumeroCatastro, c.Titular, c.Categoria, c.Subcategoria, c.MedidorIOT, c.Estado).Exec()
		}(c)
	}
	wg.Wait()

	// 5. Process and Insert Readings
	fmt.Println("Starting to insert records...")

	for _, l := range lecturas {
		wg.Add(1)
		semaphore <- struct{}{} // acquire
		
		go func(l Lectura) {
			defer wg.Done()
			defer func() { <-semaphore }() // release
			
			contrato, hasContrato := contratoByMedidor[l.MedidorIOT]
			infra, hasInfra := infraByCatastro[contrato.NumeroCatastro]
			medidor, hasMedidor := medidorByIOT[l.MedidorIOT]
			
			distrito := "Desconocido"
			zona := "Desconocida"
			propietario := "Desconocido"

			if hasInfra {
				distrito = infra.Distrito
				zona = infra.Zona
				// Fallback si titular_contrato no esta en el contrato
				propietario = contrato.Titular
				if propietario == "" {
					propietario = "Propietario " + infra.NumeroCatastro 
				}
			} else if hasContrato {
				propietario = contrato.Titular
			}

			tarifa, hasTarifa := tarifas[contrato.Subcategoria]
			if !hasTarifa {
				tarifa = tarifas["R1"] // default
			}

			yearMonth := l.FechaHora.Format("2006-01")
			date := l.FechaHora.Format("2006-01-02")
			hour := l.FechaHora.Hour()
			_, week := l.FechaHora.ISOWeek()
			
			// Q0: Insert into lecturas_base
			session.Query(`INSERT INTO lecturas_base (medidor_iot, fecha_hora_lectura, consumo_m3, lectura_actual, lectura_anterior, radiobase) VALUES (?, ?, ?, ?, ?, ?)`,
				l.MedidorIOT, l.FechaHora, l.ConsumoM3, l.LecturaActual, l.LecturaAnterior, l.Radiobase).Exec()

			// Calculate Money (If 0 or missing, apply fixed rate from category)
			var ingresoUSD, ingresoBs float64
			if l.ConsumoM3 <= 0 || l.LecturaActual == 0 {
				ingresoUSD = tarifa.BaseUSD
				ingresoBs = tarifa.BaseM3 // BaseM3 contains the fixed Bolivianos amount in estructuraTarifas
			} else {
				ingresoUSD = calcularIngreso(l.ConsumoM3, tarifa.BaseUSD, tarifa)
				ingresoBs = calcularIngreso(l.ConsumoM3, tarifa.BaseM3, tarifa)
			}

			// Identify Anomalies
			tipoAnomalia := ""
			if l.ConsumoM3 < 0 {
				tipoAnomalia = "negativo"
			} else if l.ConsumoM3 > 45 {
				tipoAnomalia = "excesivo"
			} else if l.LecturaAnterior == 0 {
				tipoAnomalia = "primera_lectura"
			} else if l.LecturaActual == 0 {
				tipoAnomalia = "sin_lectura_radiobase"
			}
			
			// Q1: consumo_distrito_hora
			session.Query(`INSERT INTO consumo_distrito_hora (distrito, fecha, hora, consumo_m3) VALUES (?, ?, ?, ?)`,
				distrito, date, hour, l.ConsumoM3).Exec()

			// Q2: consumo_distrito_semana
			session.Query(`INSERT INTO consumo_distrito_semana (distrito, anio, semana, consumo_m3) VALUES (?, ?, ?, ?)`,
				distrito, l.FechaHora.Year(), week, l.ConsumoM3).Exec()
				
			// Q3: contratos_consumo_excesivo
			if l.ConsumoM3 > 45 && hasContrato {
				exceso := (l.ConsumoM3 - 45) / 45 * 100
				session.Query(`INSERT INTO contratos_consumo_excesivo (year_month, consumo_m3, numero_contrato, tarifa, exceso_porcentaje) VALUES (?, ?, ?, ?, ?)`,
					yearMonth, l.ConsumoM3, contrato.NumeroContrato, contrato.Subcategoria, exceso).Exec()
			}

			// Q4/Q5: estado_medidores_zona
			if hasMedidor {
				session.Query(`INSERT INTO estado_medidores_zona (distrito, zona, estado, medidor_iot) VALUES (?, ?, ?, ?)`,
					distrito, zona, medidor.Estado, l.MedidorIOT).Exec()
			}

			// Q7: consumo_tarifa_distrito_mes
			session.Query(`INSERT INTO consumo_tarifa_distrito_mes (distrito, year_month, tarifa, consumo_promedio_m3) VALUES (?, ?, ?, ?)`,
				distrito, yearMonth, contrato.Subcategoria, l.ConsumoM3).Exec() 

			// Q8: consumo_anomalo_zona
			if tipoAnomalia != "" {
				session.Query(`INSERT INTO consumo_anomalo_zona (zona, year_month, tipo_anomalia, medidor_iot, modelo) VALUES (?, ?, ?, ?, ?)`,
					zona, yearMonth, tipoAnomalia, l.MedidorIOT, medidor.TipoMedidorID).Exec()
			}

			// Q11: consumo_per_capita_zona_residencial
			if strings.HasPrefix(contrato.Categoria, "Residencial") {
				capita := l.ConsumoM3 / 4.0
				session.Query(`INSERT INTO consumo_per_capita_zona_residencial (zona, year_month, subcategoria, consumo_per_capita) VALUES (?, ?, ?, ?)`,
					zona, yearMonth, contrato.Subcategoria, capita).Exec()
			}

			// Q12: top_consumidores_distrito_mes
			if hasContrato {
				session.Query(`INSERT INTO top_consumidores_distrito_mes (distrito, year_month, consumo_m3, numero_contrato, cliente, servicio) VALUES (?, ?, ?, ?, ?, ?)`,
					distrito, yearMonth, l.ConsumoM3, contrato.NumeroContrato, contrato.Titular, contrato.Categoria).Exec()
			}

			// Q15: conexiones_radiobase_zona
			session.Query(`INSERT INTO conexiones_radiobase_zona (radiobase, zona, conexiones) VALUES (?, ?, ?)`,
				l.Radiobase, zona, 1).Exec()

			// Q17, Q19, Q21: ingresos_tarifa_mes
			consumoFt3 := l.ConsumoM3 * 35.3147
			session.Query(`INSERT INTO ingresos_tarifa_mes (year_month, tarifa, alias, consumo_m3, consumo_ft3, ingreso_usd, ingreso_bs) VALUES (?, ?, ?, ?, ?, ?, ?)`,
				yearMonth, contrato.Subcategoria, contrato.Categoria, l.ConsumoM3, consumoFt3, ingresoUSD, ingresoBs).Exec()

			// Q20: cobro_minimo_residencial
			if strings.HasPrefix(contrato.Categoria, "Residencial") && l.ConsumoM3 <= 12 {
				session.Query(`INSERT INTO cobro_minimo_residencial (year_month, numero_contrato, cliente, monto_usd, monto_bs) VALUES (?, ?, ?, ?, ?)`,
					yearMonth, contrato.NumeroContrato, contrato.Titular, ingresoUSD, ingresoBs).Exec()
			}

			// Deudas Catastro
			if hasContrato {
				session.Query(`INSERT INTO deudas_catastro (numero_catastro, year_month, numero_contrato, monto_usd, monto_bs, estado_pago) VALUES (?, ?, ?, ?, ?, ?)`,
					contrato.NumeroCatastro, yearMonth, contrato.NumeroContrato, ingresoUSD, ingresoBs, "Pendiente").Exec()
			}

			// Propietarios y Facturas
			if propietario != "Desconocido" {
				session.Query(`INSERT INTO consumo_facturas_propietario (propietario, year_month, numero_contrato, consumo_total_m3, facturas_count, monto_total_usd, monto_total_bs) VALUES (?, ?, ?, ?, ?, ?, ?)`,
					propietario, yearMonth, contrato.NumeroContrato, l.ConsumoM3, 1, ingresoUSD, ingresoBs).Exec()
			}

			// Medidores Cancelados
			if hasMedidor && medidor.FechaDesinstalacion != "" {
				session.Query(`INSERT INTO medidores_cancelados_modelo (modelo, fecha_desinstalacion, medidor_iot) VALUES (?, ?, ?)`,
					medidor.TipoMedidorID, medidor.FechaDesinstalacion, l.MedidorIOT).Exec()
			}
		}(l)
	}
	wg.Wait()
	
	fmt.Println("ETL Completed Successfully!")
}

func parseDate(dateStr string) time.Time {
	layout := "01/02/06 15:04"
	if len(dateStr) == 8 {
		layout = "01/02/06"
	}
	t, _ := time.Parse(layout, dateStr)
	return t
}

func parseDateOnly(dateStr string) time.Time {
	layout := "2006-01-02"
	t, _ := time.Parse(layout, dateStr)
	return t
}

func parseFloat(s string) float64 {
	f, _ := strconv.ParseFloat(strings.TrimSpace(s), 64)
	return f
}

func calcularIngreso(m3 float64, base float64, t Tarifa) float64 {
	total := base
	if m3 > 12 {
		extra := m3 - 12
		if extra <= 13 {
			total += extra * t.Tarifa13_25
		} else if extra <= 38 {
			total += 13*t.Tarifa13_25 + (extra-13)*t.Tarifa26_50
		} else if extra <= 63 {
			total += 13*t.Tarifa13_25 + 25*t.Tarifa26_50 + (extra-38)*t.Tarifa51_75
		} else {
			total += 13*t.Tarifa13_25 + 25*t.Tarifa26_50 + 25*t.Tarifa51_75 + (extra-63)*t.Tarifa76_100
		}
	}
	return total
}

func readCSV(filename string) [][]string {
	file, err := os.Open(filename)
	if err != nil {
		log.Printf("Cannot open %s: %v", filename, err)
		return nil
	}
	defer file.Close()
	reader := csv.NewReader(file)
	reader.LazyQuotes = true
	reader.FieldsPerRecord = -1
	records, _ := reader.ReadAll()
	return records
}

func loadTarifas(filename string) map[string]Tarifa {
	records := readCSV(filename)
	m := make(map[string]Tarifa)
	if len(records) > 0 {
		for _, row := range records[1:] {
			if len(row) >= 10 {
				m[row[1]] = Tarifa{
					Categoria:     row[0],
					Subcategoria:  row[1],
					BaseM3:        parseFloat(row[2]),
					BaseUSD:       parseFloat(row[3]),
					Tarifa13_25:   parseFloat(row[4]),
					Tarifa26_50:   parseFloat(row[5]),
					Tarifa51_75:   parseFloat(row[6]),
					Tarifa76_100:  parseFloat(row[7]),
					Tarifa101_150: parseFloat(row[8]),
					TarifaMas151:  parseFloat(row[9]),
				}
			}
		}
	}
	return m
}

func loadContratos(filename string) []Contrato {
	records := readCSV(filename)
	var arr []Contrato
	for i, row := range records {
		if i == 0 {
			continue
		}
		if len(row) >= 9 {
			arr = append(arr, Contrato{
				NumeroContrato: row[0],
				NumeroCatastro: row[1],
				Titular:        row[2],
				Categoria:      row[4],
				Subcategoria:   row[5],
				MedidorIOT:     row[6],
				Estado:         row[8],
			})
		}
	}
	return arr
}

func loadInfraestructuras(filename string) []Infraestructura {
	records := readCSV(filename)
	var arr []Infraestructura
	for i, row := range records {
		if i == 0 {
			continue
		}
		if len(row) >= 16 {
			arr = append(arr, Infraestructura{
				NumeroCatastro: row[0],
				Zona:           row[4],
				Distrito:       row[5],
				Latitud:        parseFloat(row[14]),
				Longitud:       parseFloat(row[15]),
			})
		}
	}
	return arr
}

func loadMedidores(filename string) []Medidor {
	records := readCSV(filename)
	var arr []Medidor
	for i, row := range records {
		if i == 0 {
			continue
		}
		if len(row) >= 5 {
			t := parseDateOnly(row[1])
			arr = append(arr, Medidor{
				MedidorIOT:    row[0],
				Estado:        row[3],
				TipoMedidorID: row[4],
				AnioInstalado: t.Year(),
				FechaDesinstalacion: row[2],
			})
		}
	}
	return arr
}

func loadDistritos(filename string) []DistritoInfo {
	records := readCSV(filename)
	var arr []DistritoInfo
	for i, row := range records {
		if i == 0 {
			continue
		}
		if len(row) >= 7 {
			habs, _ := strconv.Atoi(row[6])
			arr = append(arr, DistritoInfo{
				Distrito:   row[1],
				Zona:       row[3],
				Habitantes: habs,
			})
		}
	}
	return arr
}

func loadLecturas(filename string) []Lectura {
	records := readCSV(filename)
	var arr []Lectura
	for i, row := range records {
		if i == 0 {
			continue
		}
		if len(row) >= 5 {
			lAnt := parseFloat(row[1])
			lAct := parseFloat(row[2])
			arr = append(arr, Lectura{
				MedidorIOT:      row[0],
				LecturaAnterior: lAnt,
				LecturaActual:   lAct,
				ConsumoM3:       lAct - lAnt,
				FechaHora:       parseDate(row[3]),
				Radiobase:       row[4],
			})
		}
	}
	return arr
}
