# INFRASTRUCTURE - SCADA+ERP Petroleum Platform

Este componente contiene toda la infraestructura como código (IaC) y scripts de despliegue para el sistema Edge.

---

## 📋 TRACKING DE PROGRESO

**IMPORTANTE**: El seguimiento de progreso se hace en `/PROGRESS.md` (raíz del proyecto).

### Antes de Trabajar en Infraestructura
1. Consultar `/PROGRESS.md` → Secciones de Fase 1 (Arquitectura, BD, Protocolos)
2. Verificar "Siguiente paso" y dependencias
3. Revisar roadmap en `/roadmap/01_arquitectura/` si es necesario

### Después de Completar Trabajo
1. Actualizar `/PROGRESS.md` → Sección correspondiente
2. Mover tareas a "Completadas"
3. Actualizar porcentaje y "Siguiente paso"
4. Documentar bloqueadores si existen

**NO crear archivos STATUS.md o TODO.md en esta carpeta.**

---

## Componentes

### Docker
- `docker-compose.edge.yml` - Stack completo para Edge
- `docker-compose.cloud.yml` - Stack para Cloud (futuro)
- `docker-compose.dev.yml` - Entorno de desarrollo local

### Kubernetes (K3s)
- `k8s/edge/` - Manifests para despliegue en Edge
- `k8s/cloud/` - Manifests para Cloud (futuro)

### Terraform
- `terraform/aws/` - Infraestructura en AWS
- `terraform/azure/` - Infraestructura en Azure
- `terraform/gcp/` - Infraestructura en GCP

### Ansible
- `ansible/playbooks/` - Playbooks para configuración de Edge devices
- `ansible/inventory/` - Inventario de dispositivos

### Scripts
- `scripts/deploy-edge.sh` - Despliegue automatizado de Edge
- `scripts/backup.sh` - Backup de base de datos
- `scripts/restore.sh` - Restore de backup

## Docker Compose - Edge Stack

### Servicios Incluidos
1. **PostgreSQL + TimescaleDB** - Base de datos
2. **MQTT Broker (Mosquitto)** - Message broker
3. **Backend API** - APIs REST
4. **Frontend** - Interfaz web
5. **Edge Gateway** - Protocolos industriales
6. **Grafana** - Monitoreo (opcional)

### Uso
```bash
# Levantar stack completo
docker-compose -f docker-compose.edge.yml up -d

# Ver logs
docker-compose -f docker-compose.edge.yml logs -f

# Detener stack
docker-compose -f docker-compose.edge.yml down

# Detener y eliminar volúmenes
docker-compose -f docker-compose.edge.yml down -v
```

## K3s - Kubernetes Ligero

### Instalación en Edge Device
```bash
# Instalar K3s
curl -sfL https://get.k3s.io | sh -

# Verificar instalación
sudo k3s kubectl get nodes

# Obtener kubeconfig
sudo cat /var/lib/rancher/k3s/server/node-token
```

### Despliegue de Aplicación
```bash
# Crear namespace
kubectl apply -f k8s/edge/namespace.yaml

# Desplegar PostgreSQL
kubectl apply -f k8s/edge/postgres-statefulset.yaml

# Desplegar MQTT
kubectl apply -f k8s/edge/mqtt-deployment.yaml

# Desplegar Backend
kubectl apply -f k8s/edge/backend-deployment.yaml

# Desplegar Frontend
kubectl apply -f k8s/edge/frontend-deployment.yaml

# Desplegar Edge Gateway
kubectl apply -f k8s/edge/edge-gateway-deployment.yaml

# Crear servicios
kubectl apply -f k8s/edge/services.yaml

# Crear ingress
kubectl apply -f k8s/edge/ingress.yaml
```

### Comandos Útiles K3s
```bash
# Ver todos los pods
kubectl get pods -n scadaerp

# Ver logs de un pod
kubectl logs -f <pod-name> -n scadaerp

# Ejecutar comando en pod
kubectl exec -it <pod-name> -n scadaerp -- /bin/bash

# Ver recursos
kubectl top nodes
kubectl top pods -n scadaerp

# Escalar deployment
kubectl scale deployment backend --replicas=3 -n scadaerp

# Restart deployment
kubectl rollout restart deployment backend -n scadaerp
```

## Ansible - Configuración de Edge Devices

### Estructura
```
ansible/
├── playbooks/
│   ├── edge-setup.yml       # Setup inicial
│   ├── edge-update.yml      # Actualización de software
│   ├── edge-backup.yml      # Backup automático
│   └── edge-monitoring.yml  # Configurar monitoreo
└── inventory/
    ├── production.ini
    └── staging.ini
```

### Uso
```bash
# Setup inicial de edge device
ansible-playbook -i inventory/production.ini playbooks/edge-setup.yml

# Actualizar software
ansible-playbook -i inventory/production.ini playbooks/edge-update.yml

# Configurar backup
ansible-playbook -i inventory/production.ini playbooks/edge-backup.yml

# Ejecutar en un host específico
ansible-playbook -i inventory/production.ini playbooks/edge-setup.yml \
    --limit edge-campo-norte-01
```

### Playbook: edge-setup.yml
Realiza:
1. Actualización de sistema operativo
2. Instalación de Docker
3. Instalación de K3s
4. Configuración de firewall
5. Configuración de networking
6. Instalación de herramientas de monitoreo
7. Configuración de backups automáticos

## Scripts de Despliegue

### deploy-edge.sh
```bash
#!/bin/bash
# Despliegue completo de Edge

# Variables
EDGE_HOST="192.168.1.100"
EDGE_USER="admin"
VERSION="1.0.0"

# Copiar archivos
scp -r ./k8s/edge ${EDGE_USER}@${EDGE_HOST}:/tmp/

# Ejecutar despliegue
ssh ${EDGE_USER}@${EDGE_HOST} << 'EOF'
    cd /tmp/edge
    kubectl apply -f namespace.yaml
    kubectl apply -f postgres-statefulset.yaml
    kubectl apply -f mqtt-deployment.yaml
    kubectl apply -f backend-deployment.yaml
    kubectl apply -f frontend-deployment.yaml
    kubectl apply -f edge-gateway-deployment.yaml
    kubectl apply -f services.yaml
    kubectl apply -f ingress.yaml
EOF

echo "Despliegue completado en ${EDGE_HOST}"
```

### backup.sh
```bash
#!/bin/bash
# Backup de base de datos PostgreSQL

BACKUP_DIR="/var/backups/scadaerp"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.dump"

# Crear directorio si no existe
mkdir -p ${BACKUP_DIR}

# Backup con pg_dump
docker exec postgres pg_dump -U postgres -d scadaerp \
    -F c -b -v -f /tmp/backup.dump

# Copiar desde container
docker cp postgres:/tmp/backup.dump ${BACKUP_FILE}

# Comprimir
gzip ${BACKUP_FILE}

# Limpiar backups antiguos (mantener últimos 30 días)
find ${BACKUP_DIR} -name "backup_*.dump.gz" -mtime +30 -delete

echo "Backup completado: ${BACKUP_FILE}.gz"
```

### restore.sh
```bash
#!/bin/bash
# Restore de backup

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: ./restore.sh <backup_file>"
    exit 1
fi

# Descomprimir si es necesario
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE > /tmp/backup.dump
    BACKUP_FILE=/tmp/backup.dump
fi

# Copiar a container
docker cp ${BACKUP_FILE} postgres:/tmp/backup.dump

# Restore
docker exec postgres pg_restore -U postgres -d scadaerp \
    -v -c /tmp/backup.dump

echo "Restore completado desde ${BACKUP_FILE}"
```

## Networking

### Configuración de Red Edge
```
┌─────────────────────────────────────────────────────────┐
│                    EDGE DEVICE                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Network Interfaces:                                     │
│  ├── eth0: 192.168.1.100/24 (IT Network)               │
│  └── eth1: 10.0.0.1/24 (OT Network - PLCs/RTUs)        │
│                                                          │
│  Firewall Rules:                                         │
│  ├── Allow 443 from IT network (HTTPS)                 │
│  ├── Allow 502 from OT network (Modbus)                │
│  ├── Allow 1883 from OT network (MQTT)                 │
│  └── Block all other incoming                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Firewall (iptables)
```bash
# Permitir HTTPS desde IT
iptables -A INPUT -i eth0 -p tcp --dport 443 -j ACCEPT

# Permitir Modbus desde OT
iptables -A INPUT -i eth1 -p tcp --dport 502 -j ACCEPT

# Permitir MQTT desde OT
iptables -A INPUT -i eth1 -p tcp --dport 1883 -j ACCEPT

# Bloquear todo lo demás
iptables -A INPUT -j DROP
```

## Monitoreo

### Prometheus + Grafana
```bash
# Instalar Prometheus
kubectl apply -f k8s/edge/monitoring/prometheus.yaml

# Instalar Grafana
kubectl apply -f k8s/edge/monitoring/grafana.yaml

# Acceder a Grafana
kubectl port-forward svc/grafana 3000:3000 -n monitoring
```

### Métricas Clave
- CPU/Memory usage por servicio
- Latencia de APIs
- Throughput de base de datos
- Tasa de errores
- Tamaño de cola de sincronización
- Estado de comunicación con PLCs

## Actualizaciones

### Rolling Update con K3s
```bash
# Actualizar imagen de backend
kubectl set image deployment/backend \
    backend=registry.local/scadaerp-backend:1.1.0 \
    -n scadaerp

# Ver progreso
kubectl rollout status deployment/backend -n scadaerp

# Rollback si hay problemas
kubectl rollout undo deployment/backend -n scadaerp
```

### Actualización Manual
```bash
# Detener servicios
docker-compose -f docker-compose.edge.yml down

# Pull nuevas imágenes
docker-compose -f docker-compose.edge.yml pull

# Levantar servicios
docker-compose -f docker-compose.edge.yml up -d
```

## Troubleshooting

### Verificar Estado de Servicios
```bash
# Docker Compose
docker-compose -f docker-compose.edge.yml ps

# K3s
kubectl get pods -n scadaerp
kubectl get services -n scadaerp
kubectl get ingress -n scadaerp
```

### Ver Logs
```bash
# Docker Compose
docker-compose -f docker-compose.edge.yml logs -f backend

# K3s
kubectl logs -f deployment/backend -n scadaerp
```

### Verificar Conectividad
```bash
# Ping a base de datos
docker exec backend ping postgres

# Test de puerto
telnet 192.168.1.100 502  # Modbus
telnet 192.168.1.100 1883 # MQTT
```

## Seguridad

- Secrets gestionados con K8s Secrets o Docker Secrets
- TLS/SSL en todos los endpoints públicos
- Network policies para aislar servicios
- Firewall configurado en host
- Actualizaciones de seguridad automáticas
- Backups encriptados
- Acceso SSH solo con keys (no passwords)
