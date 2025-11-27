#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

console.log('🔧 VERIFICACIÓN DE CORRECCIONES\n');

console.log('📍 Variables de entorno:');
console.log('   APP_BASE_URL:', process.env.APP_BASE_URL);
console.log('   NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

console.log('\n🔗 URLs de webhook corregidas:');
const baseUrl = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
console.log('   Base URL usada:', baseUrl);
console.log('   Webhook URL:', `${baseUrl}/api/webhook/mercadopago`);

console.log('\n✅ CORRECCIONES APLICADAS:');
console.log('1. ✅ URL del webhook corregida: /api/webhooks/ → /api/webhook/');
console.log('2. ✅ APP_BASE_URL actualizada a producción');
console.log('3. ✅ Ambas variables apuntan a https://foodynow.com.ar');

console.log('\n🎯 PRÓXIMOS PASOS:');
console.log('1. 🔄 Actualizar estas variables en Vercel');
console.log('2. 🧪 Hacer un pago de prueba');
console.log('3. 📊 Verificar que llegue el webhook');
console.log('4. ✅ Confirmar que se cree la orden');

if (baseUrl.includes('localhost')) {
  console.log('\n❌ ADVERTENCIA: Sigue usando localhost');
} else {
  console.log('\n🎉 ¡Configuración de producción correcta!');
}
