# Finansystem

Sistema de contabilidad diaria para tiendas de barrio.

## Tech Stack

| Layer | Tecnología |
|-------|------------|
| Frontend | Next.js 14, React, Zustand |
| Backend | Go, Gin, Clean Architecture |
| DB | PostgreSQL |

## Requisitos

- Go 1.21+
- Node.js 18+
- Docker (para PostgreSQL)

## Setup

### 1. Base de datos

```bash
docker-compose up -d
```

### 2. Backend

```bash
go run cmd/api/main.go
```

El API corre en `http://localhost:8081`

### 3. Frontend

```bash
npm install
npm run dev
```

El frontend corre en `http://localhost:3000`

## Estructura del Proyecto

```
finansystem/
├── cmd/api/              # Entry point del backend
├── internal/             # Código Go (Clean Architecture)
│   ├── domain/           # Entities y Ports
│   ├── application/      # Services
│   ├── infrastructure/    # DB, repositories, security
│   └── delivery/         # Handlers HTTP
├── src/                  # Frontend Next.js
│   ├── app/              # Pages
│   ├── services/         # API clients
│   ├── stores/           # Zustand
│   └── types/            # TypeScript
└── configs/              # Configuración
```

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/users/register | Registro de usuario |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/users/me | Datos del usuario |

## Configuración

Las variables de entorno se configuran en:
- `configs/config.yaml` para el backend
- `.env.local` para el frontend