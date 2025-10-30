#!/bin/bash

# Script para simular webhook de MercadoPago y probar notificaciones completas
# Uso: ./test-webhook.sh [store-slug] [order-id]

STORE_SLUG=${1:-"pizzeria-don-mario"}
ORDER_ID=${2:-"test-order-$(date +%s)"}
BASE_URL="https://foodynow.com.ar"

echo "🚀 Simulando webhook de MercadoPago..."
echo "📍 Store: $STORE_SLUG"
echo "📦 Order ID: $ORDER_ID"
echo ""

# Payload simulado de MercadoPago
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

echo "📡 Enviando webhook a: $BASE_URL/api/webhook/mercadopago/$STORE_SLUG"
echo "📋 Payload:"
echo "$WEBHOOK_PAYLOAD" | jq '.'
echo ""

# Enviar webhook
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-signature: test-signature" \
  -d "$WEBHOOK_PAYLOAD" \
  "$BASE_URL/api/webhook/mercadopago/$STORE_SLUG")

# Separar respuesta y código HTTP
HTTP_BODY=$(echo "$RESPONSE" | sed '$d')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1 | sed 's/.*://')

echo "📊 Respuesta del webhook:"
echo "Status: $HTTP_STATUS"
echo "Body: $HTTP_BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Webhook procesado exitosamente"
  echo ""
  echo "🔔 Deberías recibir:"
  echo "   • Notificación push en el admin"
  echo "   • Mensaje de WhatsApp (si está configurado)"
  echo ""
  echo "📱 Verifica los logs en:"
  echo "   • https://foodynow.com.ar/admin/notifications"
  echo "   • Cola de WhatsApp en el panel de admin"
else
  echo "❌ Error en webhook: $HTTP_STATUS"
  echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
fi
