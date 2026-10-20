# Autos Colombia

Backend y panel operativo inicial para la gestión de entradas y salidas del parqueadero Autos Colombia.

Esta entrega corresponde a la primera parte del proyecto. El alcance está centrado en registrar el ingreso de vehículos autorizados, controlar las celdas disponibles, registrar novedades opcionales, gestionar la salida y consultar los vehículos presentes.

## Tecnologías

- Node.js
- Express
- TypeScript
- SQLite3
- HTML, CSS y JavaScript para el panel operativo

SQLite se ejecuta como un archivo local, por lo que el proyecto puede iniciarse sin configurar un servidor de base de datos externo.

## Funcionalidades implementadas

- Creación automática de las tablas `usuario`, `vehiculo`, `celda`, `registro_acceso` y `novedad`.
- Carga inicial de usuarios, vehículos y cinco celdas disponibles.
- Validación de vehículo registrado y mensualidad activa antes de permitir el ingreso.
- Asignación automática de la primera celda disponible.
- Prevención de ingresos duplicados para vehículos que ya están dentro.
- Registro opcional de novedades al momento del ingreso.
- Registro de salida y liberación de la celda ocupada.
- Consulta de vehículos presentes y sus novedades.
- Panel web conectado a la API para registrar entradas, buscar salidas y consultar movimientos.
- Mapa operativo de celdas con filtros, búsqueda e inspector de estado.

## Arquitectura

El backend utiliza una arquitectura en capas:

```text
Controllers -> Services -> Repositories -> SQLite
```

- `src/controllers`: recibe las peticiones HTTP y construye las respuestas.
- `src/services`: contiene las validaciones y reglas de negocio.
- `src/repositories`: concentra las consultas SQL y las transacciones.
- `src/config`: inicializa la conexión, las tablas y los datos semilla.
- `src/models`: contiene las interfaces TypeScript.
- `src/routes`: define las rutas de Express.
- `public`: contiene el panel web funcional.
- `mockups`: conserva las referencias visuales originales del diseño.

## Requisitos

- Node.js 18 o superior.
- npm.

## Instalación y ejecución

Instalar dependencias:

```bash
npm install
```

Compilar TypeScript:

```bash
npm run build
```

Iniciar la aplicación compilada:

```bash
npm start
```

Para desarrollo con recarga automática:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

La base de datos se crea automáticamente en `autos-colombia.sqlite` al iniciar el servidor.

## API disponible

### Registrar entrada

`POST /api/v1/acceso/entrada`

```json
{
  "placa": "ABC123",
  "observacionNovedad": "Rayon en puerta derecha"
}
```

Responde con `201 Created`, el registro creado y la celda asignada.

### Registrar salida

`POST /api/v1/acceso/salida`

```json
{
  "placa": "ABC123"
}
```

Responde con `200 OK`, la hora de salida y la celda liberada.

### Consultar vehículos presentes

`GET /api/v1/acceso/presentes`

Devuelve los vehículos con estado activo, celda, hora de ingreso y novedades asociadas.

### Consultar estado de celdas

`GET /api/v1/acceso/celdas`

Devuelve todas las celdas con su estado actual, placa ocupante y hora de ingreso cuando corresponda.

## Datos iniciales

El servidor carga automáticamente estos datos cuando la base está vacía:

- Carlos Pérez, identificación `1001`, mensualidad `ACTIVA`, vehículo `ABC123`.
- Ana Gómez, identificación `1002`, mensualidad `VENCIDA`, vehículo `XYZ987`.
- Celdas `A-01`, `A-02`, `A-03`, `B-01` y `B-02`, inicialmente disponibles.

Por lo tanto, `ABC123` puede ingresar y `XYZ987` debe ser rechazado por mensualidad vencida.

## Validación realizada

La entrega fue compilada correctamente con:

```bash
npm run build
```

También se verificaron los flujos de entrada con novedad, prevención de entrada duplicada, rechazo de mensualidad vencida, consulta de presentes y salida con liberación de celda.
