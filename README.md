# Autos Colombia

Backend y panel operativo inicial para la gestión de entradas y salidas del parqueadero Autos Colombia.

Esta entrega contiene la primera y segunda iteración del proyecto. La primera iteración registra el ingreso y salida de vehículos. La segunda agrega la gestión de usuarios, mensualidades y estados de celdas, además de las vistas operativas correspondientes.

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
- Registro y listado de usuarios.
- Actualización del estado de mensualidad entre `ACTIVA` y `VENCIDA`.
- Registro y listado de nuevas celdas.
- Cambio controlado de estados de celda entre `DISPONIBLE`, `OCUPADA` y `MANTENIMIENTO`.
- Vistas web de usuarios, mensualidades, novedades y caja preparadas dentro del panel operativo.

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

### Crear usuario

`POST /api/v1/usuarios`

```json
{
  "identificacion": "1003",
  "nombre": "Laura Restrepo",
  "telefono": "3004567890",
  "estado_mensualidad": "ACTIVA"
}
```

Retorna `201 Created` y rechaza identificaciones duplicadas con `400 Bad Request`.

### Listar usuarios

`GET /api/v1/usuarios`

Devuelve todos los usuarios ordenados por nombre.

### Actualizar mensualidad

`PUT /api/v1/usuarios/:id/mensualidad`

```json
{
  "estado_mensualidad": "ACTIVA"
}
```

Acepta los estados `ACTIVA` y `VENCIDA`.

### Crear celda

`POST /api/v1/celdas`

```json
{
  "numero_celda": "C-01"
}
```

La celda se crea inicialmente como `DISPONIBLE`.

### Listar celdas

`GET /api/v1/celdas`

Devuelve el estado, la placa ocupante y la hora de ingreso cuando existe un acceso activo.

### Actualizar estado de celda

`PUT /api/v1/celdas/:id/estado`

```json
{
  "estado": "MANTENIMIENTO"
}
```

Una celda en mantenimiento no se asigna automáticamente. Una celda ocupada debe liberarse mediante el flujo normal de salida para conservar la consistencia con `registro_acceso`.

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

También se verificaron los flujos de entrada con novedad, prevención de entrada duplicada, rechazo de mensualidad vencida, consulta de presentes, salida con liberación de celda, creación de usuarios, actualización de mensualidad, creación de celdas y cambio a mantenimiento.

## Alcance pendiente

Las plantillas de Caja y Pagos y Novedades y Daños están integradas como vistas preparadas. Sus operaciones completas requieren futuras tablas y endpoints para pagos, tarifas, turnos, evidencias, bitácoras y facturación.
