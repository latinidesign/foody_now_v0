# 🐳 Configuración de Docker - FoodyNow

## 📋 Resumen de Seguridad

El proyecto está configurado para ejecutarse en Docker Desktop con las siguientes medidas de seguridad:

### 🔒 Restricciones de Acceso
- **Volumen Read-Only**: El código fuente está montado como read-only (`:ro`)
- **Acceso Limitado**: Solo `/app` puede ser accedida por el contenedor
- **Excepciones Controladas**: 
  - `node_modules/` - rw (necesario para dependencias)
  - `.next/` - rw (necesario para caché de Next.js)

### 🛡️ Medidas de Seguridad Implementadas

1. **Usuario No-Root**: El contenedor ejecuta como usuario `nextjs` (UID 1001), no como root
2. **Capacidades Limitadas**: Drop de ALL capabilities, solo NET_BIND_SERVICE para puerto 3000
3. **Priviligios No Escalables**: `no-new-privileges:true`
4. **Limites de Recursos**:
   - CPU máximo: 2 cores
   - Memoria máxima: 2GB
   - Memory reservada: 1GB

5. **Red Aislada**: Contenedor en red privada `foodynow-network`
6. **Health Check**: Verificación automática cada 30 segundos

### ⚡ Multi-Stage Build
- **Etapa 1 (Builder)**: Compila Next.js con todas las dependencias
- **Etapa 2 (Runtime)**: Imagen final más pequeña, solo lo necesario para ejecutar

---

## 🚀 Instrucciones de Uso

### 1. Configurar Variables de Entorno

Copiar el archivo de ejemplo y configurar con tus credenciales:

```bash
cp .env.docker.example .env.local
```

Editar `.env.local` con:
- Credenciales de Supabase
- Credenciales de MercadoPago
- Otras variables necesarias

### 2. Construir la Imagen Docker

```bash
docker-compose build
```

O si prefieres usar Docker directamente:

```bash
docker build -t foodynow:latest .
```

### 3. Ejecutar el Contenedor (Desarrollo)

```bash
docker-compose up
```

O en modo detached:

```bash
docker-compose up -d
```

### 4. Ver Logs

```bash
docker-compose logs -f foodynow
```

### 5. Ejecutar Comandos Dentro del Contenedor

```bash
# Shell interactivo
docker-compose exec foodynow sh

# Ejecutar comando
docker-compose exec foodynow pnpm lint
```

### 6. Detener y Limpiar

```bash
# Detener contenedor
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Eliminar imagen
docker rmi foodynow:latest
```

---

## 📦 Instalación de Dependencias (DENTRO del contenedor)

Las dependencias se instalan automáticamente durante el build de Docker:

```bash
# Este paso ocurre en el Dockerfile (etapa 1)
# No es necesario hacer nada manualmente
```

Si necesitas agregar nuevas dependencias:

```bash
# 1. Editar package.json localmente (en tu editor)
# 2. Reconstruir la imagen
docker-compose build --no-cache

# 3. Reiniciar el contenedor
docker-compose up
```

---

## 🔍 Verificación de Seguridad

### Verificar que el contenedor tiene acceso limitado:

```bash
# Intentar listar archivos fuera de /app (debe fallar)
docker-compose exec foodynow ls /home

# Ver punto de montaje
docker-compose exec foodynow mount | grep app
```

### Verificar que el contenedor ejecuta como usuario no-root:

```bash
docker-compose exec foodynow id
# Output esperado: uid=1001(nextjs) gid=1001(nodejs)
```

### Verificar capacidades limitadas:

```bash
docker-compose exec foodynow grep Cap /proc/1/status
```

---

## 🌍 Acceder a la Aplicación

Una vez que el contenedor está corriendo:

- **URL**: http://localhost:3000
- **Health Check**: http://localhost:3000

---

## 📝 Notas Importantes

### ⚠️ Desarrollo vs Producción

**Configuración Actual**: Desarrollo
- `NODE_ENV=development`
- Volúmenes incluyen node_modules en rw
- Health check activo

Para producción:
- Cambiar `NODE_ENV=production` en `docker-compose.yml`
- Usar `docker build` de multi-stage (optimiza automáticamente)
- Considerar CI/CD pipeline

### 📂 Estructura de Volúmenes

```
Host Machine          →  Docker Container
/foodynow                /app (read-only)
  ├─ node_modules    →    ├─ node_modules (rw - excepto)
  ├─ .next           →    ├─ .next (rw - excepto)
  ├─ app/            →    ├─ app/ (ro)
  ├─ components/     →    ├─ components/ (ro)
  └─ lib/            →    └─ lib/ (ro)
```

### 🔐 Por qué esta configuración es segura

1. **Evita cambios no autorizados**: Código read-only
2. **Protege el sistema host**: Contenedor no puede escribir fuera de /app
3. **Aisla procesos**: Usuario no-root, sin permisos de escalación
4. **Limita recursos**: CPU y memoria restringidas
5. **Control de acceso**: Redes aisladas

---

## 🐛 Troubleshooting

### Error: "Port 3000 already in use"
```bash
# Cambiar puerto en docker-compose.yml
# ports:
#   - "3001:3000"
```

### Error: "Cannot write to .next"
```bash
# Asegurar que .next tiene permisos de escritura en el host
chmod -R 755 .next
```

### Error: "pnpm: not found"
```bash
# pnpm se instala en el Dockerfile automáticamente
# Si persiste, reconstruir sin caché
docker-compose build --no-cache
```

### El contenedor se detiene inmediatamente
```bash
# Ver logs detallados
docker-compose logs foodynow

# Si hay error de build, revisar Dockerfile
```

---

## 📞 Soporte

Para más información sobre Docker y seguridad:
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Node.js Security](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Docker Security](https://docs.docker.com/engine/security/)
