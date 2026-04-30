# PRD - Sistema de Contabilidad Diaria para Tienda

## 1. Overview

| Campo | Descripción |
|-------|-------------|
| **Nombre** | finansystem |
| **Tipo** | Aplicación Web |
| **Problema** | El dueño de tienda lleva su contabilidad manualmente en papel, lo cual es propenso a errores y difícil de auditar. |
| **Solución** | Digitalizar el registro diario de movimientos, cálculo automático de ventas y cierre de caja. |

---

## 2. Contexto del Negocio

### 2.1 Flujo Actual (Cómo lo hace el dueño hoy)

```
┌─────────────────────────────────────────────────────────────────┐
│                        DÍA X                                     │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Detalle  │  │  Compras │  │   Base   │  │  Efecto  │         │
│  │          │  │ (proveed)│  │ inicial  │  │ (cierre) │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                  │
│  Al finalizar el día:                                            │
│  Total = (Base + Refuerzos) + Efectivo - Compras                │
│                                                                  │
│  La base del día siguiente = monto apartado del efectivo final   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Fórmula Clave

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Ventas del Día = (Compras + Gastos + Efectivo Final)      │
│                    - (Base Inicial + Refuerzos)            │
│                                                             │
│   Esto calcula implícitamente cuánto dinero "entró"        │
│   por ventas, no solo cuánto quedó.                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Definiciones

| Término | Significado |
|---------|-------------|
| **Base** | Efectivo inicial con el que arranca la caja al inicio del día |
| **Refuerzos** | Dinero adicional agregado a la base durante el día si no alcanzó |
| **Detalle** | Descripción/nombre del movimiento (ej: "Queso", "Moto", "Gasolina") |
| **Compras** | Gastos en proveedores (dinero que sale de la caja para reabastecimiento) |
| **Gastos** | Otros egresos operativos (transporte, servicios, etc.) |
| **Efectivo/Efecto** | Dinero físico que queda en caja al final del día |
| **Total** | Resultado del día: (Base + Refuerzos + Efectivo) - Compras |
| **Base Siguiente** | Monto apartado del efectivo para iniciar el día siguiente |

---

## 4. Requerimientos Funcionales

### 4.1 Gestión de Sesión Diaria

#### RF-01: Inicio de Día
- El sistema debe mostrar la fecha actual al iniciar
- Campo obligatorio: **Base Inicial**
- Por defecto, el sistema sugerirá el monto apartado del día anterior
- El usuario puede modificar la base sugerida

#### RF-02: Refuerzos de Base
- Si durante el día la base no es suficiente, se registra un "Refuerzo"
- Cada refuerzo tiene: **Fecha**, **Monto**, **Detalle/Observación** (opcional)
- Los refuerzos se acumulan durante el día
- Se muestran como línea separada en reportes

---

### 4.2 Registro de Movimientos

#### RF-03: Nueva Compra/Gasto
- Formulario con:
  - **Detalle** (texto libre, ej: "Queso", "Pollo", "Moto")
  - **Monto** (número positivo)
  - **Categoría**: `Proveedor` | `Gasto`
- Sub-categorías sugeridas (para gastos): `Transporte`, `Servicios`, `Insumos Varios`
- Sub-categorías sugeridas (para proveedores): el nombre del proveedor o tipo de producto

#### RF-04: Lista de Movimientos del Día
- Tabla con columnas: Hora | Detalle | Categoría | Monto
- Ordenada por hora de registro (más reciente primero)
- Total acumulado de compras y gastos por separado
- Opción de editar o eliminar un movimiento

---

### 4.3 Cierre de Caja (End of Day - EOD)

#### RF-05: Cálculo Automático
- Botón "Cerrar Caja" disponible solo si hay movimientos registrados
- El sistema muestra un resumen:
  ```
  Base Inicial:        $XXX.XX
  + Refuerzos:         $XX.XX
  ─────────────────────────────
  Total Disponible:    $XXX.XX
  
  Compras a Proveed:   $XX.XX
  Otros Gastos:        $XX.XX
  ─────────────────────────────
  Total Egresos:       $XX.XX
  
  Efectivo en Caja:    $XXX.XX  ← (ingresado por usuario)
  
  ═══════════════════════════════
  TOTAL DEL DÍA:       $XX.XX
  VENTAS (implícitas): $XX.XX
  ═══════════════════════════════
  ```

#### RF-06: Validación de Efectivo
- Campo obligatorio: **Efectivo en Caja** (lo que hay físicamente)
- Al ingresar, se calcula automáticamente el Total y Ventas
- Si hay discrepancia, mostrar alerta pero permitir cerrar de todas formas

#### RF-07: Reserva para Mañana
- Después del cierre, campo para definir **Base para el Siguiente Día**
- Sugerencia por defecto: valor razonable (ej: mínimo $50 o último promedio)
- Este monto se almacenará y aparecerá como sugerencia al iniciar el día siguiente

---

### 4.4 Historial y Reportes

#### RF-08: Historial Diario
- Vista de calendario/lista con todos los días cerrados
- Al seleccionar un día, ver detalle completo del cierre
- No permitir editar días ya cerrados (solo vista)

#### RF-09: Reporte Semanal/Mensual
- Resumen de totales por semana o mes
- Exportación a Excel/CSV para respaldo

---

## 5. Modelo de Datos

### 5.1 Usuario
```
Usuario {
  id: UUID
  email: String (único)
  password_hash: String
  nombre: String
  created_at: DateTime
}
```

### 5.2 Sesión Diaria
```
SesionDiaria {
  id: UUID
  usuario_id: UUID (FK)
  fecha: Date
  base_inicial: Decimal
  refuerzos: Decimal (calculado)
  efectivo_final: Decimal
  base_siguiente: Decimal
  estado: "abierta" | "cerrada"
  created_at: DateTime
  closed_at: DateTime?
}
```

### 5.3 Movimiento
```
Movimiento {
  id: UUID
  sesion_id: UUID (FK)
  detalle: String
  monto: Decimal
  categoria: "proveedor" | "gasto"
  subcategoria: String?
  hora: DateTime
  created_at: DateTime
}
```

### 5.4 Refuerzo
```
Refuerzo {
  id: UUID
  sesion_id: UUID (FK)
  monto: Decimal
  observacion: String?
  hora: DateTime
  created_at: DateTime
}
```

---

## 6. Flujo de Usuario

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   INICIO     │     │    DÍA      │     │    CIERRE    │
│   DE DÍA     │────▶│  OPERATIVO  │────▶│   DE CAJA    │
└──────────────┘     └──────────────┘     └──────────────┘
      │                    │                    │
      ▼                    ▼                    ▼
  - Ingresar           - Agregar           - Ingresar
    Base                 Compras            Efectivo
  - Ver sugerencia     - Agregar           - Ver resumen
    de día anterior      Gastos              automático
  - Agregar            - Agregar           - Definir base
    Refuerzos            Refuerzos           siguiente
                                           - Confirmar cierre
```

---

## 7. Requerimientos No Funcionales

| Aspecto | Requerimiento |
|---------|---------------|
| **Rendimiento** | Respuesta inmediata (<200ms) en todas las operaciones |
| **Portabilidad** | Web responsive (diseño mobile-first para futura versión móvil) |
| **Persistencia** | Datos en la nube (PostgreSQL hosted) |
| **Seguridad** | Autenticación por email/contraseña |
| **Backup** | Exportación a Excel/CSV para respaldo |

---

## 8. Arquitectura

```
┌─────────────────────────────────────────────────┐
│                   ARQUITECTURA                  │
├─────────────────────────────────────────────────┤
│                                                 │
│   ┌─────────────┐         ┌─────────────────┐  │
│   │   Next.js   │ ──────▶ │   API REST      │  │
│   │  (Frontend) │  HTTP   │   (Go)          │  │
│   └─────────────┘         └────────┬────────┘  │
│                                    │           │
│                           ┌────────▼────────┐  │
│                           │   PostgreSQL    │  │
│                           │   (Cloud DB)    │  │
│                           └─────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js |
| **Backend** |Go (Gin/Fiber) con **Clean Architecture** (Hexagonal)|
| **Base de Datos** | PostgreSQL |
| **Despliegue** | Web (v1) → Mobile (v2) |

---

## 9. Fuera de Alcance (MVP)

- ❌ Reportes avanzados / gráficos
- ❌ Gestión de inventario
- ❌ Múltiples usuarios/cajas
- ❌ Integración con contabilidad formal
- ❌ Facturación electrónica
- ❌ App móvil (v2)

---

## 10. Decisiones del Proyecto

| Decisión | Valor |
|----------|-------|
| Stack Frontend | Next.js |
| Stack Backend | Arquitectura Limpia (Hexagonal sugerida) en Go |
| Base de Datos | PostgreSQL (Uso de `NUMERIC` para precisión monetaria) |
| Despliegue | Nube |
| Usuarios | 1 (solo dueño) |
| Cajas | 1 |
| Exportación | Excel/CSV |
| Dispositivo Principal | Web |

---

## 11. Historial de Versiones

| Versión | Fecha | Descripción |
|---------|-------|-------------|
| 1.0 | 2026-03-21 | Creación inicial del PRD |
