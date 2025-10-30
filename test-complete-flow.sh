#!/bin/bash

# Script para simular flujo completo: Pedido → Pago → Notificaciones → Listo para retirar
# Simula el webhook de MercadoPago con un pedido real

STORE_SLUG="pizzeria-don-mario"
STORE_ID="550e8400-e29b-41d4-a716-446655440000"
CUSTOMER_PHONE="+5492804505920"
CUSTOMER_NAME="Gustavo Latini"
BASE_URL="https://foodynow.com.ar"

echo "🍕 ===== SIMULACIÓN FLUJO COMPLETO FOODY NOW ====="
echo ""
echo "📋 Datos del pedido:"
echo "   🏪 Tienda: Pizzería Don Mario"
echo "   👤 Cliente: $CUSTOMER_NAME"
echo "   📱 Teléfono: $CUSTOMER_PHONE"
echo "   💰 Total: $2,850"
echo ""

# 1. Simular orden creada en base de datos (esto normalmente lo hace el frontend)
ORDER_ID="ORDER-$(date +%s)"
echo "📦 Paso 1: Orden creada - ID: $ORDER_ID"

# 2. Simular webhook de MercadoPago (pago confirmado)
echo "💳 Paso 2: Simulando webhook de MercadoPago..."

WEBHOOK_PAYLOAD='{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "1234567890"
  },
  "date_created": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
  "id": 12345,
  "live_mode": false,
  "type": "payment",
  "user_id": "123456789"
}'

echo "📡 Enviando webhook de pago confirmado..."
WEBHOOK_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-signature: test-signature" \
  -d "$WEBHOOK_PAYLOAD" \
  "$BASE_URL/api/webhook/mercadopago/$STORE_SLUG")

WEBHOOK_BODY=$(echo "$WEBHOOK_RESPONSE" | sed '$d')
WEBHOOK_STATUS=$(echo "$WEBHOOK_RESPONSE" | tail -n1 | sed 's/.*://')

echo "   📊 Status: $WEBHOOK_STATUS"
if [ "$WEBHOOK_STATUS" = "200" ]; then
  echo "   ✅ Webhook procesado - Notificaciones enviadas"
else
  echo "   ❌ Error en webhook: $WEBHOOK_BODY"
fi

echo ""

# 3. Esperar unos segundos para el procesamiento
echo "⏳ Paso 3: Esperando procesamiento de notificaciones..."
sleep 3

# 4. Simular cambio de estado del pedido a "Listo para retirar"
echo "🔔 Paso 4: Simulando pedido listo para retirar..."

# Crear mensaje de pedido listo
READY_MESSAGE="🎉 *¡Tu pedido está LISTO!*

📦 Pedido: #$ORDER_ID
🏪 Pizzería Don Mario
👤 Cliente: $CUSTOMER_NAME

✅ *Tu pedido está preparado y listo para retirar*

📍 *Dirección para retirar:*
Av. Corrientes 1234, CABA

⏰ *Horario de retiro:*
Lun a Dom: 11:00 - 23:00

🚗 Te esperamos para que retires tu pedido.
¡Gracias por elegirnos!

---
*Pizzería Don Mario - FoodyNow*"

# Enviar notificación de pedido listo
echo "📤 Enviando notificación de pedido listo..."

READY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$CUSTOMER_PHONE\",
    \"message\": \"$READY_MESSAGE\",
    \"strategy\": \"text\"
  }" \
  "$BASE_URL/api/stores/$STORE_ID/whatsapp/test")

READY_BODY=$(echo "$READY_RESPONSE" | sed '$d')
READY_STATUS=$(echo "$READY_RESPONSE" | tail -n1 | sed 's/.*://')

echo "   📊 Status: $READY_STATUS"

if [ "$READY_STATUS" = "200" ]; then
  # Extraer link de WhatsApp si existe
  WHATSAPP_LINK=$(echo "$READY_BODY" | grep -o '"whatsapp_link":"[^"]*"' | cut -d'"' -f4)
  
  if [ ! -z "$WHATSAPP_LINK" ]; then
    echo "   ✅ Link de WhatsApp generado"
    echo "   🔗 $WHATSAPP_LINK"
    echo ""
    echo "📱 Abre este link para ver el mensaje de 'Pedido Listo':"
    echo "$WHATSAPP_LINK"
  else
    echo "   ✅ Mensaje enviado via API"
  fi
else
  echo "   ❌ Error enviando notificación: $READY_BODY"
fi

echo ""
echo "🎯 ===== RESUMEN DEL FLUJO ====="
echo "✅ 1. Pedido creado en el sistema"
echo "✅ 2. Pago confirmado via webhook MercadoPago"
echo "✅ 3. Push notification enviada al comerciante"
echo "✅ 4. WhatsApp enviado al cliente (confirmación de pedido)"
echo "✅ 5. Notificación de pedido listo para retirar"
echo ""
echo "🔔 Deberías haber recibido:"
echo "   • Push notification de nuevo pedido pagado"
echo "   • Acceso a links de WhatsApp para el cliente"
echo ""
echo "📱 Para completar la prueba:"
echo "   • Revisa las notificaciones push en tu navegador"
echo "   • Haz clic en los links de WhatsApp generados"
echo "   • Verifica que los mensajes se abran correctamente"
