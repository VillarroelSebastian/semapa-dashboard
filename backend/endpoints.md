# Documentación de Endpoints (SEMAPA Backend)

Este documento detalla la estructura de datos, parámetros y respuestas de todos los endpoints disponibles en el servicio Backend de SEMAPA.

El host predeterminado para las pruebas locales es `http://localhost:8080`.

---

## 1. Subir Nueva Lectura

Calcula el consumo en metros cúbicos ($m^3$) basado en la diferencia con la última lectura y registra la información en la base de datos.

- **URL**: `/api/lectura`
- **Método**: `POST`
- **Body** (JSON):
  ```json
  {
    "medidor_iot": "ID-MEDIDOR-123",
    "lectura_actual": 195.5,
    "fecha": "2026-05-01 10:30:00"
  }
  ```

- **Respuesta Exitosa** (200 OK):
  ```json
  {
    "message": "Lectura insertada exitosamente",
    "medidor": "ID-MEDIDOR-123",
    "consumo_m3": 31.0
  }
  ```

---

## 2. Deudas por Número de Catastro

Devuelve el historial de deudas (facturas) asociadas a una infraestructura específica (por su número de catastro), desglosado por contrato y mes.

- **URL**: `/api/deudas/catastro`
- **Método**: `GET`
- **Parámetros de Query**:
  - `catastro` (string, requerido): El número de catastro (ej. `09-14-926-4480-000`).

- **Respuesta Exitosa** (200 OK):
  ```json
  [
    {
      "mes": "2026-04",
      "contrato": "CT-00022921",
      "deuda_bs": 194.70,
      "deuda_usd": 79.97,
      "estado": "Pendiente"
    }
  ]
  ```

---

## 3. Consumo por Distrito (Agrupación por Hora)

Retorna la cantidad de agua consumida hora a hora en un distrito determinado para una fecha exacta.

- **URL**: `/api/consumo/distrito/hora`
- **Método**: `GET`
- **Parámetros de Query**:
  - `distrito` (string, requerido): ID o nombre del distrito (ej. `1`).
  - `fecha` (string, requerido): Fecha en formato `YYYY-MM-DD`.

- **Respuesta Exitosa** (200 OK):
  ```json
  [
    {
      "hora": 8,
      "consumo_m3": 450.2
    },
    {
      "hora": 9,
      "consumo_m3": 510.4
    }
  ]
  ```

---

## 4. Consumo por Distrito (Agrupación Semanal)

Retorna el consumo total agregado por cada semana de un año específico, permitiendo evaluar rangos de tiempo más amplios.

- **URL**: `/api/consumo/distrito/semana`
- **Método**: `GET`
- **Parámetros de Query**:
  - `distrito` (string, requerido): ID o nombre del distrito (ej. `1`).
  - `anio` (string, requerido): Año de consulta (ej. `2026`).

- **Respuesta Exitosa** (200 OK):
  ```json
  [
    {
      "semana": 14,
      "consumo_m3": 12500.8
    },
    {
      "semana": 15,
      "consumo_m3": 13100.5
    }
  ]
  ```

---

## 5. Auditoría de Consumo Excesivo

Lista todos los contratos que superaron el límite de consumo normal o establecido por normativas (ej. > 45 $m^3$) en un mes determinado.

- **URL**: `/api/consumo/excesivo`
- **Método**: `GET`
- **Parámetros de Query**:
  - `mes` (string, requerido): Mes de consulta en formato `YYYY-MM`.

- **Respuesta Exitosa** (200 OK):
  ```json
  [
    {
      "contrato": "CT-00043204",
      "tarifa": "R4",
      "consumo_m3": 58.0,
      "exceso_porcentaje": 28.88
    }
  ]
  ```

---

## 6. Proyección Financiera e Ingresos

Devuelve el total de dinero recaudado o proyectado por tipo de tarifa en un mes específico, tanto en Bolivianos como en Dólares.

- **URL**: `/api/ingresos/proyeccion`
- **Método**: `GET`
- **Parámetros de Query**:
  - `mes` (string, requerido): Mes de consulta en formato `YYYY-MM`.

- **Respuesta Exitosa** (200 OK):
  ```json
  [
    {
      "tarifa": "R3",
      "alias": "Residencial",
      "consumo_m3": 15000.5,
      "consumo_ft3": 529737.9,
      "ingreso_usd": 25000.0,
      "ingreso_bs": 174000.0
    }
  ]
  ```

---

## 7. Facturas y Consumo por Propietario

Agrupa la información a nivel de "Propietario" o Titular, resumiendo todas las propiedades y contratos que tiene a su nombre.

- **URL**: `/api/propietario/facturas`
- **Método**: `GET`
- **Parámetros de Query**:
  - `propietario` (string, requerido): Nombre completo del propietario.

- **Respuesta Exitosa** (200 OK):
  ```json
  [
    {
      "mes": "2026-04",
      "contrato": "CT-00022921",
      "cantidad_facturas": 1,
      "consumo_m3": 31.5,
      "usd": 15.2,
      "bs": 105.79
    }
  ]
  ```

---

## 8. Medidores Cancelados por Modelo

Permite obtener el registro de todos los medidores IoT que fueron dados de baja, clasificados por el modelo (o tipo de medidor).

- **URL**: `/api/medidores/cancelados`
- **Método**: `GET`
- **Parámetros de Query**:
  - `modelo` (string, requerido): Código o ID del modelo (ej. `MOD-001`).

- **Respuesta Exitosa** (200 OK):
  ```json
  [
    {
      "fecha_desinstalacion": "2026-03-15",
      "medidor_iot": "IOT-89423"
    }
  ]
  ```
