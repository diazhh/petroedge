# TOOLS - SCADA+ERP Petroleum Platform

Este componente contiene herramientas de desarrollo y CLI para facilitar el trabajo con el proyecto.

## CLI (`cli/`)

### scadaerp-cli
Herramienta de línea de comandos para gestión del proyecto:

```bash
# Generar nuevo módulo
scadaerp generate module <name>

# Generar CRUD completo
scadaerp generate crud <entity>

# Ejecutar migraciones
scadaerp db migrate

# Crear seed data
scadaerp db seed

# Verificar dependencias
scadaerp check deps

# Generar tipos desde schema
scadaerp generate types
```

## Generators (`generators/`)

### module-generator.ts
Genera estructura completa de un módulo:
- Controller
- Service
- Repository
- Schema (Zod)
- Types
- Routes
- Tests

### api-generator.ts
Genera endpoints CRUD desde definición:
```bash
scadaerp generate api --entity Well --endpoints list,get,create,update,delete
```

## Scripts (`scripts/`)

### setup-dev.sh
Configura entorno de desarrollo:
- Instala dependencias
- Configura base de datos
- Carga seed data
- Inicia servicios

### generate-types.sh
Genera tipos TypeScript desde esquemas SQL

### check-deps.sh
Verifica versiones de dependencias y compatibilidad

## Uso

```bash
# Instalar CLI globalmente
npm install -g @scadaerp/cli

# O usar con npx
npx @scadaerp/cli generate module wells
```
