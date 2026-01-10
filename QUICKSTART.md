# QUICKSTART - SCADA+ERP PETROLERO

Guía rápida para iniciar el proyecto en desarrollo.

---

## 📋 Prerrequisitos

- Node.js 20+
- npm 10+
- Docker y Docker Compose
- Git

---

## 🚀 Inicio Rápido

### 1. Levantar Servicios de Infraestructura

```bash
# Desde la raíz del proyecto
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d

# Verificar que los servicios estén corriendo
docker-compose -f infrastructure/docker/docker-compose.dev.yml ps

# Ver logs si hay problemas
docker-compose -f infrastructure/docker/docker-compose.dev.yml logs -f
```

**Servicios disponibles:**
- PostgreSQL + TimescaleDB: `localhost:15432`
- MQTT Broker: `localhost:15883`
- Redis: `localhost:16379`
- Grafana: `http://localhost:3001` (admin/admin)
- Prometheus: `http://localhost:9090`
- pgAdmin: `http://localhost:5050` (admin@scadaerp.local/admin)

### 2. Iniciar Backend API

```bash
cd src/backend

# Las dependencias ya están instaladas
# Si necesitas reinstalar:
# npm install

# Iniciar en modo desarrollo
npm run dev
```

El backend estará disponible en:
- API: `http://localhost:3000`
- Documentación Swagger: `http://localhost:3000/docs`
- Health Check: `http://localhost:3000/health`

### 3. Iniciar Frontend

```bash
cd src/frontend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar en modo desarrollo
npm run dev
```

El frontend estará disponible en:
- App: `http://localhost:5173`

---

## 🔍 Verificar Instalación

### Backend
```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T...",
  "uptime": 123.45,
  "environment": "development",
  "version": "0.1.0"
}
```

### PostgreSQL
```bash
docker exec -it scadaerp-postgres psql -U scadaerp -d scadaerp -c "SELECT version();"
```

### MQTT
```bash
# Instalar mosquitto-clients si no lo tienes
# sudo apt-get install mosquitto-clients

# Publicar mensaje de prueba
mosquitto_pub -h localhost -t test/topic -m "Hello MQTT"

# Suscribirse a un topic
mosquitto_sub -h localhost -t test/topic
```

---

## 📊 Acceso a Herramientas

### Grafana
- URL: `http://localhost:3001`
- Usuario: `admin`
- Contraseña: `admin`

### pgAdmin
- URL: `http://localhost:5050`
- Email: `admin@scadaerp.local`
- Contraseña: `admin`

**Conectar a PostgreSQL desde pgAdmin:**
- Host: `postgres` (nombre del servicio Docker)
- Port: `5432` (interno) / `15432` (desde host)
- Database: `scadaerp`
- Username: `scadaerp`
- Password: `scadaerp_dev_password`

### Prometheus
- URL: `http://localhost:9090`
- No requiere autenticación en desarrollo

---

## 🛠️ Comandos Útiles

### Docker Compose

```bash
# Ver estado de servicios
docker-compose -f infrastructure/docker/docker-compose.dev.yml ps

# Ver logs de todos los servicios
docker-compose -f infrastructure/docker/docker-compose.dev.yml logs -f

# Ver logs de un servicio específico
docker-compose -f infrastructure/docker/docker-compose.dev.yml logs -f postgres

# Reiniciar un servicio
docker-compose -f infrastructure/docker/docker-compose.dev.yml restart postgres

# Detener todos los servicios
docker-compose -f infrastructure/docker/docker-compose.dev.yml down

# Detener y eliminar volúmenes (⚠️ borra datos)
docker-compose -f infrastructure/docker/docker-compose.dev.yml down -v
```

### Backend

```bash
cd src/backend

# Desarrollo con hot reload
npm run dev

# Build para producción
npm run build

# Ejecutar tests
npm test

# Linter
npm run lint

# Type checking
npm run typecheck
```

### Frontend

```bash
cd src/frontend

# Desarrollo con hot reload
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linter
npm run lint
```

### Base de Datos

```bash
# Conectar a PostgreSQL
docker exec -it scadaerp-postgres psql -U scadaerp -d scadaerp

# Ejecutar SQL desde archivo
docker exec -i scadaerp-postgres psql -U scadaerp -d scadaerp < script.sql

# Backup
docker exec scadaerp-postgres pg_dump -U scadaerp scadaerp > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i scadaerp-postgres psql -U scadaerp scadaerp < backup.sql

# Ver tablas
docker exec -it scadaerp-postgres psql -U scadaerp -d scadaerp -c "\dt"
```

---

## 🐛 Troubleshooting

### Puerto ya en uso

Si un puerto está ocupado:

```bash
# Verificar qué proceso usa el puerto
sudo lsof -i :3000
# o
ss -tuln | grep 3000

# Matar el proceso
kill -9 <PID>
```

Puertos alternativos están documentados en `infrastructure/PORT_CONFIGURATION.md`.

### Docker no inicia

```bash
# Verificar que Docker esté corriendo
sudo systemctl status docker

# Iniciar Docker
sudo systemctl start docker

# Reiniciar Docker
sudo systemctl restart docker
```

### Dependencias de npm

```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install

# O usar npm ci para instalación limpia
npm ci
```

### PostgreSQL no acepta conexiones

```bash
# Ver logs de PostgreSQL
docker-compose -f infrastructure/docker/docker-compose.dev.yml logs postgres

# Reiniciar PostgreSQL
docker-compose -f infrastructure/docker/docker-compose.dev.yml restart postgres

# Verificar que el contenedor esté corriendo
docker ps | grep postgres
```

### Backend no inicia

```bash
# Verificar variables de entorno
cat src/backend/.env

# Verificar que PostgreSQL esté listo
docker exec scadaerp-postgres pg_isready -U scadaerp

# Ver logs detallados
cd src/backend
npm run dev 2>&1 | tee backend.log
```

---

## 📁 Estructura del Proyecto

```
scadaerp/
├── src/
│   ├── backend/          # API REST con Fastify
│   ├── frontend/         # React + Vite
│   └── edge/             # Edge Gateway (futuro)
├── infrastructure/
│   ├── docker/           # Docker Compose
│   ├── k8s/              # Kubernetes manifests
│   └── scripts/          # Scripts de utilidad
├── database/
│   ├── migrations/       # Migraciones de BD
│   ├── seeds/            # Datos de prueba
│   └── schemas/          # Esquemas SQL
├── docs/                 # Documentación técnica
└── roadmap/              # Roadmaps de desarrollo
```

---

## 🔐 Credenciales de Desarrollo

**⚠️ SOLO PARA DESARROLLO - CAMBIAR EN PRODUCCIÓN**

### PostgreSQL
- Host: `localhost:15432`
- Database: `scadaerp`
- User: `scadaerp`
- Password: `scadaerp_dev_password`

### JWT Secrets
- JWT_SECRET: `dev_jwt_secret_change_in_production_min_32_chars_long`
- JWT_REFRESH_SECRET: `dev_refresh_secret_change_in_production_min_32_chars`

### Grafana
- User: `admin`
- Password: `admin`

### pgAdmin
- Email: `admin@scadaerp.local`
- Password: `admin`

---

## 📚 Documentación Adicional

- **Arquitectura**: `docs/ARQUITECTURA_EDGE_CLOUD.md`
- **Backend**: `docs/BACKEND_STACK.md`
- **Frontend**: `docs/FRONTEND_STACK.md`
- **Puertos**: `infrastructure/PORT_CONFIGURATION.md`
- **Estado**: `IMPLEMENTATION_STATUS.md`
- **Roadmap**: `roadmap/00_MASTER_ROADMAP.md`

---

## 🎯 Próximos Pasos

1. ✅ Servicios de infraestructura levantados
2. ⬜ Habilitar TimescaleDB en PostgreSQL
3. ⬜ Crear esquemas de base de datos
4. ⬜ Implementar módulo de autenticación
5. ⬜ Implementar módulo de pozos
6. ⬜ Crear componentes de frontend
7. ⬜ Integrar MQTT para telemetría

---

**¿Necesitas ayuda?** Revisa `IMPLEMENTATION_STATUS.md` para el estado actual del proyecto.
