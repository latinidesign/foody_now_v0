# 🔄 Workflow de Desarrollo - FoodyNow

## 🌿 Estructura de Branches

### `main` - Producción
- ✅ **Estable y probado**
- 🚀 **Deploy automático**: https://foodynow.com.ar
- 🔒 **Solo merge desde development**

### `development` - Desarrollo
- 🧪 **Para nuevas funcionalidades**
- 🚀 **Preview deploy**: https://foody-now-v0-git-development-latinidesign.vercel.app
- 🔄 **Base para feature branches**

## 📋 Comandos Principales

### Trabajar en desarrollo
```bash
# Cambiar a development
git checkout development

# Crear nueva feature
git checkout -b feature/nueva-funcionalidad

# Guardar cambios
git add .
git commit -m "feat: nueva funcionalidad"

# Subir feature branch
git push -u origin feature/nueva-funcionalidad
```

### Merge a development
```bash
# Cambiar a development
git checkout development

# Merge de la feature
git merge feature/nueva-funcionalidad

# Subir cambios
git push origin development
```

### Deploy a producción
```bash
# Cambiar a main
git checkout main

# Merge desde development
git merge development

# Subir a producción
git push origin main
```

## 🚀 URLs de Deploy

| Branch | URL | Propósito |
|--------|-----|-----------|
| `main` | https://foodynow.com.ar | Producción |
| `development` | https://foody-now-v0-git-development-*.vercel.app | Testing |
| `feature/*` | https://foody-now-v0-git-feature-*.vercel.app | Preview |

## ✅ Reglas de Oro

1. **Nunca** hacer commit directo a `main`
2. **Siempre** probar en `development` primero
3. **Crear** Pull Request para merge a main
4. **Mantener** branches actualizados

## 🔧 Variables de Entorno

### Development
- Usar base de datos de desarrollo
- WhatsApp en modo sandbox
- Claves de prueba de MercadoPago

### Production
- Base de datos de producción
- WhatsApp Business API real
- Claves reales de MercadoPago
