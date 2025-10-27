# FoodyNow - Ecommerce PWA Multi-Tienda

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/thefoody/v0-ecommerce-pwa)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/1UpW0ffhz3f)

## Overview

FoodyNow es una plataforma PWA multi-tienda que permite a cada comercio tener su propio subdominio personalizado. El sistema utiliza Next.js 15 con App Router y Supabase como base de datos.

## 🏗️ Arquitectura de Subdominios

### Funcionamiento

El sistema mapea automáticamente subdominios a tiendas específicas:

- `pizzeria-don-mario.foodynow.com.ar` → `/store/pizzeria-don-mario`
- `panaderia-central.foodynow.com.ar` → `/store/panaderia-central`
- `localhost:3000/store/mi-tienda` → Desarrollo local

### Componentes Clave

1. **Middleware (`middleware.ts`)**
   - Detecta subdominios automáticamente
   - Reescribe URLs a `/store/[slug]`
   - Maneja autenticación con Supabase
   - Excluye assets estáticos

2. **Página Dinámica (`app/store/[slug]/page.tsx`)**
   - Configurada con `dynamic = 'force-dynamic'`
   - Cache inteligente: 0s en desarrollo, 60s en producción
   - Fallback graceful cuando no encuentra tienda

3. **API de Revalidación (`app/api/revalidate/route.ts`)**
   - Limpia cache por tags o paths específicos
   - Protegida con secret opcional

## 🚀 Configuración de Producción

### DNS en Vercel

1. **Dominio Principal**
   \`\`\`
   A record: foodynow.com.ar → 76.76.21.21
   \`\`\`

2. **Wildcard para Subdominios**
   \`\`\`
   CNAME: *.foodynow.com.ar → cname.vercel-dns.com
   \`\`\`

### Variables de Entorno Requeridas

\`\`\`env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Opcional para revalidación
REVALIDATE_SECRET=your-secret-key

# WhatsApp Cloud API (Global - usando nombres existentes en Vercel)
WHATSAPP_BUSINESS_PHONE_NUMBER_ID=836468659544565
WHATSAPP_BUSINESS_ACCESS_TOKEN=EAAT...
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345  # opcional
WHATSAPP_API_VERSION=v20.0

# WhatsApp Webhook (solo para verificación)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=FoodyNow.2025.ButinofLatini
WHATSAPP_APP_SECRET=143daf0a6e2123f35bc54656df2ed74d
\`\`\`

- `SUPABASE_SERVICE_ROLE_KEY` debe copiarse desde **Supabase → Project Settings → API → service_role**.
- Define esta variable únicamente en el entorno del servidor (`.env.local`, variables privadas de Vercel/Render, etc.). No la expongas como variable pública ni la utilices en componentes del navegador.
- Asegúrate de que `NEXT_PUBLIC_SUPABASE_URL` continúe apuntando al proyecto correcto de Supabase.
- **WhatsApp Cloud API**: Ya están configuradas las credenciales globales en Vercel:
  - `WHATSAPP_BUSINESS_PHONE_NUMBER_ID`: ID del número de teléfono de WhatsApp Business ✅
  - `WHATSAPP_BUSINESS_ACCESS_TOKEN`: Token de acceso ✅
  - `WHATSAPP_BUSINESS_ACCOUNT_ID`: ID de la cuenta de negocio (opcional)
  - `WHATSAPP_API_VERSION`: Versión de la API ✅
- Para la verificación del webhook de WhatsApp ya están configurados `WHATSAPP_WEBHOOK_VERIFY_TOKEN` ✅ y `WHATSAPP_APP_SECRET` ✅.

#### Cómo validar que las variables estén activas en producción

1. Despliega la app y visita `/api/health/env` en el entorno correspondiente.
2. El JSON resultante debe mostrar `service_role`, `whatsapp_webhook_verify_token` y `whatsapp_app_secret` en `true`.
3. Si alguno aparece en `false`, revisa la configuración de variables en Vercel (`Project Settings → Environment Variables`) y en tu `.env.local`.
## 🛠️ Desarrollo Local

### Instalación

\`\`\`bash
npm install
npm run dev
\`\`\`

### Probar Subdominios Localmente

\`\`\`bash
# Opción 1: Usar rutas directas
http://localhost:3000/store/pizzeria-don-mario

# Opción 2: Configurar hosts (opcional)
# Agregar a /etc/hosts:
# 127.0.0.1 pizzeria-don-mario.localhost
\`\`\`

### Scripts de Diagnóstico

\`\`\`bash
# Ejecutar diagnóstico completo
npm run diagnose

# Verificar configuración de subdominios
npm run diagnose:subdomain
\`\`\`

## 🔧 Herramientas de Debugging

### Health Check de Subdominios

\`\`\`bash
# Verificar subdominio específico
curl https://pizzeria-don-mario.foodynow.com.ar/api/health/subdomain

# Verificar con slug manual
curl https://foodynow.com.ar/api/health/subdomain?slug=pizzeria-don-mario
\`\`\`

### Revalidación de Cache

\`\`\`bash
# Limpiar cache por tag
curl -X POST https://foodynow.com.ar/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"tag": "store-data"}'

# Limpiar cache por path específico
curl -X POST https://foodynow.com.ar/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"path": "/store/pizzeria-don-mario"}'
\`\`\`

## 🐛 Solución de Problemas

### 404 en Subdominios

1. **Verificar DNS**: Confirmar que el wildcard CNAME está configurado
2. **Cache de Vercel**: Si ves `x-vercel-cache: HIT` en 404s, redeploy con "Skip build cache"
3. **Datos de Tienda**: Verificar que la tienda existe y está activa en Supabase

\`\`\`bash
# Diagnóstico rápido
npm run diagnose
\`\`\`

### Cache Problemático

\`\`\`bash
# Limpiar cache específico
curl -X POST https://tu-dominio.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"path": "/store/tu-tienda"}'
\`\`\`

### Logs de Middleware

En desarrollo, el middleware muestra logs detallados. En producción, los logs están deshabilitados para performance.

## 📊 Monitoreo

### Endpoints de Salud

- `/api/health` - Health check general
- `/api/health/subdomain` - Verificación específica de subdominios
- `/api/health/env` - Verificación de variables de entorno

### Métricas Importantes

- **Response Time**: Subdominios deben responder < 500ms
- **Cache Hit Rate**: Objetivo > 80% en producción
- **Error Rate**: < 1% de 404s en subdominios válidos

## 🔄 Flujo de Deployment

1. **Desarrollo**: Usar `/store/[slug]` localmente
2. **Testing**: Verificar con `npm run diagnose`
3. **Deploy**: Push a main branch
4. **Verificación**: Probar subdominios en producción
5. **Cache**: Limpiar cache si es necesario

## 📚 Estructura del Proyecto

\`\`\`
├── app/
│   ├── store/[slug]/          # Páginas dinámicas de tiendas
│   ├── api/
│   │   ├── revalidate/        # Endpoint de revalidación
│   │   └── health/            # Health checks
│   └── admin/                 # Panel administrativo
├── middleware.ts              # Lógica de subdominios
├── scripts/
│   └── diagnose.js           # Script de diagnóstico
└── components/
    └── store/                # Componentes específicos de tienda
\`\`\`

## 🤝 Contribución

1. Fork el repositorio
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/1UpW0ffhz3f](https://v0.app/chat/projects/1UpW0ffhz3f)**
