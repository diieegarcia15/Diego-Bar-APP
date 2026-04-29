# Sistema de Pedidos QR para Restaurantes

## Descripción General

Sistema completo de pedidos por QR para restaurantes con dos interfaces principales:
- **Cliente móvil** (`/mesa/[id]`): Menú visual con categorías, carrito y confirmación de pedido
- **Panel de administración** (`/admin`): Dashboard en tiempo real con pedidos entrantes, timers y gestión de mesas

Comunicación en tiempo real vía WebSockets (Socket.IO) para que los pedidos aparezcan instantáneamente en el panel admin.

---

## Arquitectura del Sistema

```mermaid
graph TB
    subgraph Frontend ["Frontend - Next.js + Tailwind CSS"]
        C["/mesa/[id] - Cliente Móvil"]
        A["/admin - Panel Admin"]
    end
    
    subgraph Backend ["Backend - Node.js + Express"]
        API["REST API"]
        WS["Socket.IO Server"]
    end
    
    subgraph Database ["PostgreSQL"]
        DB["Tablas: mesas, categorias, productos, pedidos, detalle_pedidos, historial_pedidos"]
    end
    
    C -->|HTTP + WS| API
    A -->|HTTP + WS| WS
    API --> DB
    WS --> DB
```

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS 3 |
| Backend | Node.js + Express + Socket.IO |
| Base de datos | PostgreSQL |
| ORM/Query | pg (node-postgres) |
| Tiempo real | Socket.IO |
| Deployment | Local dev con npm scripts concurrentes |

---

## Esquema de Base de Datos

```sql
-- Mesas del restaurante
CREATE TABLE mesas (
    id SERIAL PRIMARY KEY,
    numero INTEGER UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'disponible', -- disponible, ocupada, por_cobrar
    created_at TIMESTAMP DEFAULT NOW()
);

-- Categorías de productos
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    icono VARCHAR(50),
    orden INTEGER DEFAULT 0
);

-- Productos del menú
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen_url VARCHAR(500),
    categoria_id INTEGER REFERENCES categorias(id),
    disponible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pedidos activos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    mesa_id INTEGER REFERENCES mesas(id),
    estado VARCHAR(20) DEFAULT 'recibido', -- recibido, en_preparacion, listo, entregado
    notas TEXT,
    total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Detalle de cada pedido
CREATE TABLE detalle_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    notas VARCHAR(500)
);

-- Historial (para cuando se cierra una mesa)
CREATE TABLE historial_pedidos (
    id SERIAL PRIMARY KEY,
    mesa_numero INTEGER NOT NULL,
    pedido_original_id INTEGER,
    detalle JSONB NOT NULL, -- snapshot completo del pedido + items
    total DECIMAL(10,2) NOT NULL,
    cerrado_at TIMESTAMP DEFAULT NOW(),
    metodo_pago VARCHAR(50)
);
```

---

## Estructura de Carpetas

```
c:\Diego IA\
├── .env
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
│
├── server/
│   ├── index.js              # Express + Socket.IO server
│   ├── db.js                 # PostgreSQL connection pool
│   ├── routes/
│   │   ├── mesas.js          # CRUD mesas
│   │   ├── productos.js      # CRUD productos + categorías
│   │   ├── pedidos.js        # CRUD pedidos + detalle
│   │   └── historial.js      # Historial + cierre de mesa
│   └── seed.js               # Script de inicialización con datos de prueba
│
├── src/
│   ├── app/
│   │   ├── layout.js         # Root layout con fuentes + metadata
│   │   ├── page.js           # Landing / redirect
│   │   ├── globals.css       # Tailwind + custom styles
│   │   ├── mesa/
│   │   │   └── [id]/
│   │   │       └── page.js   # Interfaz del cliente (mobile-first)
│   │   └── admin/
│   │       └── page.js       # Panel de administración (desktop-first)
│   │
│   ├── components/
│   │   ├── cliente/
│   │   │   ├── MenuGrid.js       # Grid de productos con imágenes
│   │   │   ├── CategoryTabs.js   # Tabs de categorías
│   │   │   ├── ProductCard.js    # Tarjeta de producto
│   │   │   ├── Cart.js           # Carrito / Ticket lateral
│   │   │   └── OrderConfirm.js   # Modal de confirmación
│   │   │
│   │   ├── admin/
│   │   │   ├── OrderBoard.js     # Board de pedidos en tiempo real
│   │   │   ├── OrderCard.js      # Tarjeta de pedido con timer
│   │   │   ├── OrderTimer.js     # Contador de tiempo transcurrido
│   │   │   ├── MesaPanel.js      # Panel de estado de mesas
│   │   │   └── HistorialView.js  # Vista de historial
│   │   │
│   │   └── shared/
│   │       ├── Header.js
│   │       └── StatusBadge.js
│   │
│   └── lib/
│       ├── socket.js         # Socket.IO client singleton
│       └── api.js            # Fetch helpers
│
└── public/
    └── images/               # Imágenes de productos
```

---

## Propuestas de Cambio por Componente

### 1. Configuración del Proyecto

#### [NEW] package.json
- Next.js 14, React 18, Tailwind CSS 3
- Express, Socket.IO, pg (node-postgres)
- Scripts: `dev` (concurrently frontend + backend), `seed` (inicializar DB)

#### [NEW] .env
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/restaurante_qr
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
PORT=3001
```

#### [NEW] next.config.js / tailwind.config.js / postcss.config.js
- Configuración estándar con colores custom (verde restaurante, fondo oscuro, acentos)

---

### 2. Backend (server/)

#### [NEW] server/index.js
- Express server en puerto 3001
- Socket.IO integrado con CORS para Next.js (puerto 3000)
- Eventos WebSocket: `nuevo_pedido`, `actualizar_pedido`, `cerrar_mesa`, `mesa_actualizada`

#### [NEW] server/db.js
- Pool de conexiones PostgreSQL usando `DATABASE_URL`

#### [NEW] server/routes/mesas.js
- `GET /api/mesas` — listar todas
- `GET /api/mesas/:id` — detalle con pedidos activos
- `PATCH /api/mesas/:id` — actualizar estado
- `POST /api/mesas/:id/cerrar` — **Lógica de Cierre**: guarda en historial, elimina pedidos activos, resetea estado a 'disponible'

#### [NEW] server/routes/productos.js
- `GET /api/productos` — listar todos con categoría
- `GET /api/categorias` — listar categorías

#### [NEW] server/routes/pedidos.js
- `GET /api/pedidos` — todos los pedidos activos (para admin)
- `POST /api/pedidos` — crear pedido + emitir WebSocket `nuevo_pedido`
- `PATCH /api/pedidos/:id` — cambiar estado + emitir WebSocket `actualizar_pedido`

#### [NEW] server/routes/historial.js
- `GET /api/historial` — listar historial de pedidos cerrados

#### [NEW] server/seed.js
- Crea tablas si no existen
- Inserta 8 mesas, 6 categorías (Favoritos, Aperitivos, Sopas, Ensaladas, Bebidas Calientes, Platos Fuertes)
- Inserta ~20 productos de prueba con precios y descripciones

---

### 3. Frontend — Cliente Móvil (`/mesa/[id]`)

> **Diseño:** Mobile-first, fondo oscuro (#1a1a2e → #16213e), tarjetas con imágenes de platos, barra de categorías horizontal, ticket/carrito deslizable, botones verdes (#2ecc71)

#### [NEW] src/app/mesa/[id]/page.js
- Carga productos y categorías vía API
- Grid de productos filtrados por categoría activa
- Carrito lateral (slide-up en móvil) con resumen, impuestos y total
- Botón "GUARDAR" y "COBRAR" (envía pedido vía POST + WebSocket)
- Modal de confirmación con animación

---

### 4. Frontend — Panel Admin (`/admin`)

> **Diseño:** Desktop-first, sidebar con mesas, área central con pedidos en columnas por estado, colores de estado (verde=recibido, amarillo=preparando, azul=listo)

#### [NEW] src/app/admin/page.js
- Conexión WebSocket para recibir pedidos en tiempo real
- Board tipo Kanban con columnas: Recibidos | En Preparación | Listos
- Cada tarjeta de pedido muestra: mesa, items, total, **timer dinámico**
- Panel lateral con estado de mesas (disponible/ocupada/por_cobrar)
- Botón "Cerrar Mesa" que ejecuta la lógica de archivado
- Vista de Historial mejorada con:
    - Pestaña de **Lista**: registros cronológicos de ventas.
    - Pestaña de **Calendario**: visualización mensual de recaudación por día.
    - Detalle diario interactivo al hacer clic en un día del calendario.
    - Resumen de recaudación mensual automática.

#### [NEW] src/components/admin/OrderTimer.js
- `useEffect` con `setInterval` cada segundo
- Calcula diferencia entre `created_at` del pedido y `Date.now()`
- Muestra formato `MM:SS`
- Cambia color según tiempo: verde (<5min), amarillo (5-10min), rojo (>10min)

---

### 5. Paleta de Colores (basada en la captura de referencia)

| Elemento | Color | Uso |
|----------|-------|-----|
| Fondo principal | `#1a1a2e` / `#0f0f23` | Background oscuro premium |
| Fondo tarjetas | `#16213e` / `#1e293b` | Cards de productos |
| Acento primario | `#2ecc71` / `#27ae60` | Botones, categoría activa, badges |
| Texto principal | `#f8f9fa` | Títulos y precios |
| Texto secundario | `#94a3b8` | Descripciones |
| Alerta/Timer rojo | `#e74c3c` | Timer > 10 min |
| Timer amarillo | `#f39c12` | Timer 5-10 min |
| Borde sutil | `#2d3748` | Separadores |

---

## User Review Required

> [!IMPORTANT]
> **Base de datos PostgreSQL**: El sistema requiere PostgreSQL instalado localmente. ¿Ya tienes PostgreSQL instalado? Si no, puedo incluir instrucciones de instalación o usar SQLite como alternativa más simple.

> [!IMPORTANT]
> **Imágenes de productos**: La captura muestra fotos reales de platos. Usaré URLs de placeholder (picsum/unsplash) para los datos de prueba. ¿Tienes imágenes propias que quieras usar?

> [!IMPORTANT]
> **Tailwind CSS**: Confirmo usar Tailwind CSS v3 como solicitaste. Lo configuraré con la paleta de colores extraída de tu captura de referencia.

## Open Questions

> [!NOTE]
> 1. **Autenticación del admin**: ¿El panel `/admin` necesita login/contraseña o será acceso directo por ahora?
> 2. **Cantidad de mesas**: La referencia muestra un restaurante mediano. ¿Cuántas mesas necesitas en los datos de prueba? (Default: 8)
> 3. **Moneda**: La captura muestra precios en € (euros). ¿Usar euros o pesos/otra moneda?
> 4. **Impuestos**: La captura muestra un campo "Tax". ¿Qué porcentaje de impuesto aplicar? (Default: 5%)

---

## Plan de Verificación

### Tests Automatizados
1. `npm run seed` — Verificar que la DB se inicializa correctamente
2. `npm run dev` — Levantar frontend + backend
3. Abrir `/mesa/1` en el navegador — Verificar que carga el menú
4. Hacer un pedido desde el cliente — Verificar que aparece en `/admin` en tiempo real
5. Verificar que el timer cuenta correctamente en cada tarjeta de pedido
6. Ejecutar "Cerrar Mesa" — Verificar que los datos se archivan en historial y la mesa vuelve a 'disponible'

### Verificación Manual (Browser)
- Navegar a la interfaz del cliente en viewport móvil
- Navegar al admin en viewport desktop
- Confirmar comunicación WebSocket en tiempo real
- Verificar que la UI coincide con la captura de referencia
