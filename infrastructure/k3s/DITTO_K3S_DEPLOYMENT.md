# Eclipse Ditto - Deployment en K3s + Helm

## ✅ Estado: FUNCIONANDO CORRECTAMENTE

Después de múltiples intentos fallidos con Docker Compose, **Ditto fue desplegado exitosamente usando K3s + Helm**.

---

## 📊 Resumen de Problemas con Docker Compose

Los siguientes problemas fueron recurrentes con Docker Compose:

1. **Autenticación**: Error 401 constante - "No applicable authentication provider was found!"
2. **Clustering**: Configuración contradictoria entre standalone y cluster mode
3. **Complejidad**: 6 microservicios con configuraciones Pekko/Akka complejas
4. **Puertos**: Confusión entre 8080 y 18080
5. **Pre-authentication**: Configuración intrincada que nunca funcionó correctamente

**Conclusión**: Los issues de GitHub (#1978, #1507, #443, #1082) confirman que estos problemas son conocidos y recurrentes con Docker Compose.

---

## 🚀 Solución: K3s + Helm

### Instalación Realizada

```bash
# 1. Instalar K3s
curl -sfL https://get.k3s.io | sh -

# 2. Configurar kubectl
sudo chown $USER:$USER /etc/rancher/k3s/k3s.yaml
mkdir -p ~/.kube && cp /etc/rancher/k3s/k3s.yaml ~/.kube/config

# 3. Verificar instalación
kubectl get nodes

# 4. Instalar Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 5. Crear namespace
kubectl create namespace ditto

# 6. Instalar Ditto con Helm
helm install -n ditto eclipse-ditto oci://registry-1.docker.io/eclipse/ditto --version 3.6.9 --wait --timeout 10m

# 7. Exponer servicio con NodePort
kubectl patch svc eclipse-ditto-nginx -n ditto -p '{"spec":{"type":"NodePort","ports":[{"port":8080,"targetPort":8080,"nodePort":30080}]}}'

# 8. Configurar credenciales de Nginx
htpasswd -nb ditto ditto
kubectl create secret generic eclipse-ditto-nginx-config-nginx-htpasswd -n ditto --from-literal=nginx.htpasswd='ditto:$apr1$toFZnK8i$/HxHaYwnYzoXBJ.SlqOkZ.' --dry-run=client -o yaml | kubectl apply -f -
kubectl rollout restart deployment eclipse-ditto-nginx -n ditto
```

---

## 🔧 Configuración

### Credenciales

- **Usuario**: `ditto`
- **Password**: `ditto`
- **Puerto**: `30080` (NodePort)
- **URL Base**: `http://localhost:30080`

### Endpoints Principales

- **Things API**: `http://localhost:30080/api/2/things`
- **Policies API**: `http://localhost:30080/api/2/policies`
- **Health Check**: `http://localhost:30080/health`
- **Ditto UI**: `http://localhost:30080/ui/`
- **Swagger UI**: `http://localhost:30080/apidoc/`

---

## ✅ Verificación de Funcionamiento

### 1. Verificar Pods

```bash
kubectl get pods -n ditto
```

**Resultado esperado**: Todos los pods en estado `Running`

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

### 2. Probar Autenticación

```bash
curl -u ditto:ditto http://localhost:30080/api/2/things
```

**Resultado esperado**: `[]` (HTTP 200 OK)

### 3. Crear una Policy

```bash
curl -u ditto:ditto -X PUT http://localhost:30080/api/2/policies/org.eclipse.ditto:test-policy \
  -H "Content-Type: application/json" \
  -d '{
    "entries": {
      "owner": {
        "subjects": {
          "nginx:ditto": {
            "type": "nginx basic auth user"
          }
        },
        "resources": {
          "thing:/": {"grant": ["READ","WRITE"], "revoke": []},
          "policy:/": {"grant": ["READ","WRITE"], "revoke": []},
          "message:/": {"grant": ["READ","WRITE"], "revoke": []}
        }
      }
    }
  }'
```

### 4. Crear un Thing

```bash
curl -u ditto:ditto -X PUT http://localhost:30080/api/2/things/org.eclipse.ditto:test-thing-1 \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "org.eclipse.ditto:test-policy",
    "attributes": {
      "location": "Test Location",
      "manufacturer": "ACME"
    },
    "features": {
      "temperature": {
        "properties": {
          "value": 23.5
        }
      }
    }
  }'
```

### 5. Leer el Thing

```bash
curl -u ditto:ditto http://localhost:30080/api/2/things/org.eclipse.ditto:test-thing-1
```

---

## 🔍 Comandos Útiles

### Gestión de K3s

```bash
# Ver todos los pods
kubectl get pods -n ditto

# Ver logs de un servicio específico
kubectl logs -n ditto -l app.kubernetes.io/name=ditto-gateway --tail=100

# Ver servicios
kubectl get svc -n ditto

# Reiniciar un deployment
kubectl rollout restart deployment eclipse-ditto-nginx -n ditto

# Ver estado de un deployment
kubectl rollout status deployment eclipse-ditto-nginx -n ditto

# Describir un pod
kubectl describe pod -n ditto <pod-name>
```

### Gestión de Helm

```bash
# Ver releases instalados
helm list -n ditto

# Ver valores del chart
helm get values eclipse-ditto -n ditto

# Actualizar Ditto
helm upgrade eclipse-ditto oci://registry-1.docker.io/eclipse/ditto --version <nueva-version> -n ditto

# Desinstalar Ditto
helm uninstall eclipse-ditto -n ditto
```

### Gestión de K3s (Sistema)

```bash
# Ver estado de K3s
sudo systemctl status k3s

# Reiniciar K3s
sudo systemctl restart k3s

# Detener K3s
sudo systemctl stop k3s

# Desinstalar K3s (si es necesario)
/usr/local/bin/k3s-uninstall.sh
```

---

## 📝 Configuración del Worker Service

El Worker Service está configurado para usar Ditto en K3s:

**Archivo**: `/home/diazhh/dev/scadaerp/src/worker/.env`

```env
# Eclipse Ditto Configuration (K3s + Helm)
DITTO_URL=http://localhost:30080
DITTO_USERNAME=ditto
DITTO_PASSWORD=ditto
```

**Archivo**: `/home/diazhh/dev/scadaerp/src/worker/src/config/index.ts`

```typescript
ditto: {
  url: process.env.DITTO_URL || 'http://localhost:8080',
  username: process.env.DITTO_USERNAME || 'devops',
  password: process.env.DITTO_PASSWORD || 'ditto',
}
```

---

## 🎯 Próximos Pasos

1. ✅ **Ditto instalado y funcionando**
2. ⬜ Ejecutar script de migración: `src/scripts/migrate-yacimientos-to-ditto.ts`
3. ⬜ Probar integración con Worker Service
4. ⬜ Implementar Digital Twins para Basin, Field, Reservoir, Well
5. ⬜ Configurar Rule Engine con Ditto
6. ⬜ Limpiar código legacy según roadmap

---

## 📚 Referencias

- **Documentación oficial**: https://eclipse.dev/ditto/
- **Helm Chart**: https://hub.docker.com/r/eclipse/ditto
- **K3s Deployment Guide**: https://github.com/eclipse-ditto/ditto/blob/master/deployment/kubernetes/k3s/README.md
- **Issues conocidos con Docker**: 
  - #1978: https://github.com/eclipse-ditto/ditto/issues/1978
  - #1507: https://github.com/eclipse-ditto/ditto/issues/1507
  - #443: https://github.com/eclipse-ditto/ditto/issues/443

---

## ⚠️ Notas Importantes

1. **MongoDB**: La imagen de Bitnami no se pudo descargar, se usó `mongo:6` oficial
2. **Nginx**: Se configuraron credenciales manualmente en el secret
3. **NodePort**: El servicio está expuesto en puerto 30080 para acceso local
4. **Pre-authentication**: Está habilitado en el Gateway, Nginx maneja la autenticación básica
5. **Producción**: Para producción, considerar usar Ingress en lugar de NodePort

---

**Fecha de deployment**: 2026-01-10  
**Versión de Ditto**: 3.6.9  
**Versión de K3s**: v1.34.3+k3s1  
**Versión de Helm**: v3.19.4
