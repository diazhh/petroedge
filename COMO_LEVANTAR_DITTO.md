# 🚀 CÓMO LEVANTAR ECLIPSE DITTO

**Guía rápida para iniciar Eclipse Ditto en el proyecto SCADA+ERP**

---

## ⚠️ IMPORTANTE

Eclipse Ditto se despliega con **K3s + Helm**, **NO con Docker Compose**.

Los intentos previos con Docker Compose fallaron debido a problemas conocidos de autenticación y clustering (ver issues de GitHub #1978, #1507, #443).

---

## 📋 Requisitos Previos

- Sistema Linux (Ubuntu/Debian recomendado)
- Acceso sudo
- Conexión a internet

---

## 🔧 Instalación (Solo Primera Vez)

### 1. Instalar K3s

```bash
# Instalar K3s (Kubernetes ligero)
curl -sfL https://get.k3s.io | sh -

# Configurar permisos
sudo chown $USER:$USER /etc/rancher/k3s/k3s.yaml

# Configurar kubectl
mkdir -p ~/.kube
cp /etc/rancher/k3s/k3s.yaml ~/.kube/config

# Verificar instalación
kubectl get nodes
```

**Resultado esperado**: Debe mostrar un nodo en estado `Ready`

### 2. Instalar Helm

```bash
# Instalar Helm (gestor de paquetes para Kubernetes)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verificar instalación
helm version
```

### 3. Crear Namespace para Ditto

```bash
kubectl create namespace ditto
```

### 4. Instalar Ditto con Helm

```bash
# Instalar Eclipse Ditto v3.6.9
helm install -n ditto eclipse-ditto \
  oci://registry-1.docker.io/eclipse/ditto \
  --version 3.6.9 \
  --wait \
  --timeout 10m
```

**Nota**: Este comando puede tardar 5-10 minutos mientras descarga las imágenes y levanta los servicios.

### 5. Exponer el Servicio

```bash
# Exponer Ditto en puerto 30080
kubectl patch svc eclipse-ditto-nginx -n ditto \
  -p '{"spec":{"type":"NodePort","ports":[{"port":8080,"targetPort":8080,"nodePort":30080}]}}'
```

### 6. Configurar Credenciales de Nginx

```bash
# Generar hash de contraseña
htpasswd -nb ditto ditto

# Crear secret con credenciales
kubectl create secret generic eclipse-ditto-nginx-config-nginx-htpasswd \
  -n ditto \
  --from-literal=nginx.htpasswd='ditto:$apr1$toFZnK8i$/HxHaYwnYzoXBJ.SlqOkZ.' \
  --dry-run=client -o yaml | kubectl apply -f -

# Reiniciar Nginx para aplicar cambios
kubectl rollout restart deployment eclipse-ditto-nginx -n ditto
kubectl rollout status deployment eclipse-ditto-nginx -n ditto
```

---

## ✅ Verificación

### 1. Verificar que todos los pods están corriendo

```bash
kubectl get pods -n ditto
```

**Resultado esperado**: Todos los pods en estado `Running` (1/1 READY)

```
NAME                                          READY   STATUS    RESTARTS   AGE
eclipse-ditto-connectivity-xxx                1/1     Running   0          Xm
eclipse-ditto-dittoui-xxx                     1/1     Running   0          Xm
eclipse-ditto-gateway-xxx                     1/1     Running   0          Xm
eclipse-ditto-mongodb-xxx                     1/1     Running   0          Xm
eclipse-ditto-nginx-xxx                       1/1     Running   0          Xm
eclipse-ditto-policies-xxx                    1/1     Running   0          Xm
eclipse-ditto-swaggerui-xxx                   1/1     Running   0          Xm
eclipse-ditto-things-xxx                      1/1     Running   0          Xm
eclipse-ditto-thingssearch-xxx                1/1     Running   0          Xm
```

### 2. Probar la API

```bash
# Listar Things (debe retornar [])
curl -u ditto:ditto http://localhost:30080/api/2/things
```

**Resultado esperado**: `[]` (lista vacía si no hay Things creados)

### 3. Crear un Thing de prueba

```bash
# Crear Policy
curl -u ditto:ditto -X PUT http://localhost:30080/api/2/policies/test:policy \
  -H "Content-Type: application/json" \
  -d '{
    "entries": {
      "owner": {
        "subjects": {"nginx:ditto": {"type": "nginx basic auth user"}},
        "resources": {
          "thing:/": {"grant": ["READ","WRITE"], "revoke": []},
          "policy:/": {"grant": ["READ","WRITE"], "revoke": []},
          "message:/": {"grant": ["READ","WRITE"], "revoke": []}
        }
      }
    }
  }'

# Crear Thing
curl -u ditto:ditto -X PUT http://localhost:30080/api/2/things/test:thing-1 \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "test:policy",
    "attributes": {"name": "Test Thing"},
    "features": {
      "temperature": {
        "properties": {"value": 23.5}
      }
    }
  }'

# Leer Thing
curl -u ditto:ditto http://localhost:30080/api/2/things/test:thing-1
```

---

## 🔄 Uso Diario

### Iniciar Ditto (si K3s está detenido)

```bash
# K3s se inicia automáticamente con el sistema
# Si necesitas iniciarlo manualmente:
sudo systemctl start k3s

# Verificar estado
kubectl get pods -n ditto
```

### Detener Ditto

```bash
# Detener K3s (detiene todos los servicios)
sudo systemctl stop k3s
```

### Ver Logs

```bash
# Ver logs de un servicio específico
kubectl logs -n ditto -l app.kubernetes.io/name=ditto-gateway --tail=100

# Ver logs de todos los servicios
kubectl logs -n ditto --all-containers --tail=50
```

### Reiniciar un Servicio

```bash
# Reiniciar Gateway
kubectl rollout restart deployment eclipse-ditto-gateway -n ditto

# Reiniciar Nginx
kubectl rollout restart deployment eclipse-ditto-nginx -n ditto
```

---

## 🌐 Endpoints Disponibles

| Endpoint | Descripción | Ejemplo |
|----------|-------------|---------|
| `/api/2/things` | API de Things | `curl -u ditto:ditto http://localhost:30080/api/2/things` |
| `/api/2/policies` | API de Policies | `curl -u ditto:ditto http://localhost:30080/api/2/policies` |
| `/ui/` | Ditto UI (interfaz web) | http://localhost:30080/ui/ |
| `/apidoc/` | Swagger UI (documentación) | http://localhost:30080/apidoc/ |
| `/health` | Health check | `curl http://localhost:30080/health` |

---

## 🔑 Credenciales

- **Usuario**: `ditto`
- **Contraseña**: `ditto`
- **Puerto**: `30080`
- **URL Base**: `http://localhost:30080`

---

## 🛠️ Comandos Útiles

```bash
# Ver todos los pods
kubectl get pods -n ditto

# Ver servicios
kubectl get svc -n ditto

# Ver estado de deployments
kubectl get deployments -n ditto

# Describir un pod (para debugging)
kubectl describe pod -n ditto <pod-name>

# Ver logs en tiempo real
kubectl logs -n ditto -f <pod-name>

# Ejecutar comando dentro de un pod
kubectl exec -it -n ditto <pod-name> -- /bin/sh

# Ver recursos consumidos
kubectl top pods -n ditto
```

---

## 🚨 Troubleshooting

### Problema: Pods en estado `ImagePullBackOff`

**Solución**: Esperar a que se descarguen las imágenes o verificar conexión a internet.

```bash
kubectl describe pod -n ditto <pod-name>
```

### Problema: Error 401 al hacer requests

**Solución**: Verificar que las credenciales de Nginx estén configuradas correctamente.

```bash
# Verificar secret
kubectl get secret eclipse-ditto-nginx-config-nginx-htpasswd -n ditto -o yaml

# Reconfigurar si es necesario
kubectl create secret generic eclipse-ditto-nginx-config-nginx-htpasswd \
  -n ditto \
  --from-literal=nginx.htpasswd='ditto:$apr1$toFZnK8i$/HxHaYwnYzoXBJ.SlqOkZ.' \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl rollout restart deployment eclipse-ditto-nginx -n ditto
```

### Problema: K3s no inicia

**Solución**: Verificar logs del sistema.

```bash
sudo systemctl status k3s
sudo journalctl -u k3s -n 100
```

---

## 🗑️ Desinstalación (si es necesario)

```bash
# Desinstalar Ditto
helm uninstall eclipse-ditto -n ditto

# Eliminar namespace
kubectl delete namespace ditto

# Desinstalar K3s (CUIDADO: esto elimina todo K3s)
/usr/local/bin/k3s-uninstall.sh
```

---

## 📚 Documentación Adicional

- **Documentación completa**: `/infrastructure/k3s/DITTO_K3S_DEPLOYMENT.md`
- **Roadmaps relacionados**:
  - `/roadmap/01_arquitectura/10_ECLIPSE_DITTO_RULE_ENGINE_ADVANCED.md`
  - `/roadmap/01_arquitectura/13_MIGRATION_TO_DITTO.md`
  - `/roadmap/01_arquitectura/14_YACIMIENTOS_DITTO_MIGRATION_EXECUTION.md`
- **Documentación oficial de Ditto**: https://eclipse.dev/ditto/
- **Helm Chart**: https://hub.docker.com/r/eclipse/ditto

---

## 💡 Notas Importantes

1. **NO usar Docker Compose** para Ditto - tiene problemas conocidos de autenticación
2. K3s se inicia automáticamente con el sistema (systemd)
3. Los datos de Ditto se persisten en volúmenes de Kubernetes
4. El Worker Service está configurado para conectarse a `http://localhost:30080`
5. Para producción, considerar usar Ingress en lugar de NodePort

---

**Última actualización**: 2026-01-10  
**Versión de Ditto**: 3.6.9  
**Versión de K3s**: v1.34.3+k3s1  
**Versión de Helm**: v3.19.4
