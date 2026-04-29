# PLAN DE DESARROLLO: SISTEMA DE GESTIÓN GASTRONÓMICA "QR-PEDIDOS"

## 1. VISIÓN GENERAL
Este documento define la arquitectura técnica y funcional para una aplicación de pedidos en tiempo real diseñada para Restaurantes y Bares. El sistema permite la autonomía del cliente mediante escaneo de QR y la gestión centralizada desde una Computadora Maestra.

## 2. ARQUITECTURA TÉCNICA RECOMENDADA
Para garantizar la actualización de los pedidos sin recargar la página, se propone:

- **Frontend (Web App):** React.js o Next.js (Tailwind CSS para estilos responsivos).
- **Backend:** Node.js con Express o Python con FastAPI.
- **Base de Datos:** PostgreSQL (Relacional) para integridad de datos.
- **Comunicación en Tiempo Real:** WebSockets (Socket.io) para notificaciones instantáneas.

## 3. MODELO DE DATOS (ESQUEMA SQL SUGERIDO)

```sql
-- Tablas principales para la base de datos
CREATE TABLE mesas (
    id SERIAL PRIMARY KEY,
    numero_mesa INT UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'libre' -- 'libre', 'ocupada', 'pidiendo_cuenta'
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    disponible BOOLEAN DEFAULT true,
    categoria_id INT REFERENCES categorias(id)
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    mesa_id INT REFERENCES mesas(id),
    estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'entregado', 'cerrado'
    total DECIMAL(10, 2) DEFAULT 0.00,
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id),
    producto_id INT REFERENCES productos(id),
    cantidad INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

CREATE TABLE historial_ventas (
    id SERIAL PRIMARY KEY,
    mesa_id INT,
    total_final DECIMAL(10, 2),
    detalle_json TEXT, -- Respaldo de los productos consumidos
    fecha_cierre TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);