# Guía para Configurar Planes Reales de MercadoPago

## 🎯 Pasos para Configuración en Producción

### 1. **Acceder al Panel de MercadoPago**
1. Ve a: https://www.mercadopago.com.ar/developers/panel
2. Inicia sesión con tu cuenta de MercadoPago
3. Selecciona tu aplicación o crea una nueva

### 2. **Crear Planes de Suscripción**
1. Ve a "Suscripciones" → "Planes de Suscripción"
2. Haz clic en "Crear Plan"
3. Configura cada plan con estos datos:

#### **Plan 1: Básico Mensual**
- **Nombre**: `foody_basic_monthly`
- **Descripción**: "Plan Básico FoodyNow - Mensual"
- **Precio**: $36,000 ARS (o el precio que decidas)
- **Frecuencia**: Mensual
- **Trial**: 15 días gratis
- **Métodos de pago**: Tarjeta de crédito/débito

#### **Plan 2: Anual con Descuento**
- **Nombre**: `foody_yearly_discount`
- **Descripción**: "Plan Anual FoodyNow - 20% descuento"
- **Precio**: $345,600 ARS (20% menos que 12 mensualidades)
- **Frecuencia**: Anual
- **Trial**: 15 días gratis

#### **Plan 3: Trial Extendido**
- **Nombre**: `foody_trial_extended`
- **Descripción**: "Plan Trial FoodyNow - 30 días"
- **Precio**: $0 ARS
- **Frecuencia**: Una sola vez
- **Duración**: 30 días

### 3. **Obtener los IDs de los Planes**
Después de crear cada plan, MercadoPago te dará un ID único como:
- `2c938084726fca480172750000000001`
- `2c938084726fca480172750000000002` 
- `2c938084726fca480172750000000003`

### 4. **Configurar en la Base de Datos**
Ejecuta el script de actualización con los IDs reales.

---

## 🛠️ Scripts de Configuración Automática

### Script 1: Actualizar con IDs Reales
```bash
node update-production-plans.js
```

### Script 2: Validar Configuración
```bash
node validate-plans.js
```

---

## 🔧 Variables de Entorno para Producción

Asegúrate de tener configurado:

```env
# MercadoPago Producción
MERCADOPAGO_ACCESS_TOKEN=APP_USR_xxxxxxxxxxxxxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR_xxxxxxxxxxxxxxxxxxxxxxxx
MERCADOPAGO_CLIENT_ID=your_client_id
MERCADOPAGO_CLIENT_SECRET=your_client_secret

# URLs de Producción
NEXT_PUBLIC_APP_URL=https://foodynow.com.ar
MERCADOPAGO_WEBHOOK_URL=https://foodynow.com.ar/api/subscription/webhook-new

# Base de datos de producción
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_key
```

---

## ⚠️ Checklist Pre-Producción

- [ ] Planes creados en MercadoPago
- [ ] IDs de planes actualizados en DB
- [ ] Variables de entorno de producción configuradas
- [ ] Webhooks configurados en MercadoPago
- [ ] SSL certificado configurado
- [ ] Pruebas de pago realizadas
- [ ] Logs y monitoreo activados

---

## 🧪 Pruebas Recomendadas

1. **Crear suscripción de prueba**
2. **Probar webhooks**
3. **Validar cobros automáticos**
4. **Probar cancelación/pausa**
5. **Verificar estados de suscripción**
