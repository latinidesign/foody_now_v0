#!/usr/bin/env node

/**
 * Script para obtener Payment IDs desde Supabase
 * 
 * Uso:
 *   node get-payment-ids.js
 *   node get-payment-ids.js --order-id "ORDER_ID"
 *   node get-payment-ids.js --customer-email "email@example.com"
 *   node get-payment-ids.js --store-slug "my-store"
 *   node get-payment-ids.js --customer-name "Juan Pérez"
 *   node get-payment-ids.js --mp-payment-id "MP_ID"
 *   node get-payment-ids.js --status "approved"
 *   node get-payment-ids.js --days 7
 *   node get-payment-ids.js --amount 1500.00
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase - asegúrate de tener estas variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para formatear la salida
function formatPayment(payment) {
  return {
    payment_uuid: payment.id,
    provider_payment_id: payment.provider_payment_id,
    mp_payment_id: payment.mp_payment_id,
    preference_id: payment.preference_id,
    provider: payment.provider,
    status: payment.status,
    amount: payment.transaction_amount,
    currency: payment.currency,
    payer_email: payment.payer_email,
    customer_name: payment.orders?.customer_name,
    customer_phone: payment.orders?.customer_phone,
    store_name: payment.stores?.name,
    store_slug: payment.stores?.slug,
    created_at: payment.created_at
  };
}

// Función para obtener payment IDs con filtros
async function getPaymentIds(filters = {}) {
  try {
    let query = supabase
      .from('payments')
      .select(`
        *,
        orders (
          id,
          customer_name,
          customer_phone,
          customer_email,
          total,
          status,
          payment_status,
          delivery_type
        ),
        stores (
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.orderId) {
      query = query.eq('orders.id', filters.orderId);
    }
    
    if (filters.customerEmail) {
      query = query.or(`payer_email.eq.${filters.customerEmail},orders.customer_email.eq.${filters.customerEmail}`);
    }
    
    if (filters.storeSlug) {
      query = query.eq('stores.slug', filters.storeSlug);
    }
    
    if (filters.customerName) {
      query = query.ilike('orders.customer_name', `%${filters.customerName}%`);
    }
    
    if (filters.mpPaymentId) {
      query = query.or(`mp_payment_id.eq.${filters.mpPaymentId},provider_payment_id.eq.${filters.mpPaymentId}`);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.amount) {
      query = query.eq('transaction_amount', filters.amount);
    }
    
    if (filters.days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filters.days);
      query = query.gte('created_at', daysAgo.toISOString());
    }

    // Limitar resultados
    if (!filters.orderId && !filters.mpPaymentId && !filters.customerEmail) {
      query = query.limit(50);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error al obtener payment IDs:', error.message);
    throw error;
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const filters = {};

  // Parsear argumentos
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--order-id':
        filters.orderId = value;
        break;
      case '--customer-email':
        filters.customerEmail = value;
        break;
      case '--store-slug':
        filters.storeSlug = value;
        break;
      case '--customer-name':
        filters.customerName = value;
        break;
      case '--mp-payment-id':
        filters.mpPaymentId = value;
        break;
      case '--status':
        filters.status = value;
        break;
      case '--days':
        filters.days = parseInt(value);
        break;
      case '--amount':
        filters.amount = parseFloat(value);
        break;
      case '--help':
        console.log(`
Uso: node get-payment-ids.js [opciones]

Opciones:
  --order-id <ID>         Buscar por Order ID
  --customer-email <email> Buscar por email del cliente
  --store-slug <slug>     Buscar por slug de la tienda
  --customer-name <name>  Buscar por nombre del cliente
  --mp-payment-id <id>    Buscar por MercadoPago Payment ID
  --status <status>       Buscar por status del pago
  --days <number>         Buscar pagos de los últimos N días
  --amount <amount>       Buscar por monto específico
  --help                  Mostrar esta ayuda

Ejemplos:
  node get-payment-ids.js
  node get-payment-ids.js --days 7
  node get-payment-ids.js --status approved
  node get-payment-ids.js --customer-email juan@example.com
  node get-payment-ids.js --store-slug my-store
        `);
        return;
      default:
        if (flag.startsWith('--')) {
          console.error(`❌ Opción desconocida: ${flag}`);
          return;
        }
    }
  }

  try {
    console.log('🔍 Buscando payment IDs...');
    
    if (Object.keys(filters).length > 0) {
      console.log('📋 Filtros aplicados:', filters);
    } else {
      console.log('📋 Obteniendo los últimos 50 payment IDs...');
    }

    const payments = await getPaymentIds(filters);

    if (!payments || payments.length === 0) {
      console.log('❌ No se encontraron payment IDs con los criterios especificados');
      return;
    }

    console.log(`\n✅ Encontrados ${payments.length} payment ID(s):\n`);

    payments.forEach((payment, index) => {
      const formatted = formatPayment(payment);
      console.log(`${index + 1}. Payment ID: ${formatted.provider_payment_id || 'N/A'}`);
      console.log(`   UUID: ${formatted.payment_uuid}`);
      console.log(`   MP Payment ID: ${formatted.mp_payment_id || 'N/A'}`);
      console.log(`   Preference ID: ${formatted.preference_id || 'N/A'}`);
      console.log(`   Provider: ${formatted.provider}`);
      console.log(`   Status: ${formatted.status}`);
      console.log(`   Amount: ${formatted.amount} ${formatted.currency || 'ARS'}`);
      console.log(`   Customer: ${formatted.customer_name || 'N/A'}`);
      console.log(`   Phone: ${formatted.customer_phone || 'N/A'}`);
      console.log(`   Store: ${formatted.store_name || 'N/A'} (${formatted.store_slug || 'N/A'})`);
      console.log(`   Created: ${new Date(formatted.created_at).toLocaleString()}`);
      console.log('   ---');
    });

    // Si hay un solo resultado, mostrar información extra
    if (payments.length === 1) {
      const payment = payments[0];
      console.log('\n📋 Información adicional:');
      console.log(`   Order ID: ${payment.orders?.id || 'N/A'}`);
      console.log(`   Order Status: ${payment.orders?.status || 'N/A'}`);
      console.log(`   Payment Status: ${payment.orders?.payment_status || 'N/A'}`);
      console.log(`   Order Total: ${payment.orders?.total || 'N/A'}`);
      console.log(`   Delivery Type: ${payment.orders?.delivery_type || 'N/A'}`);
      
      if (payment.raw) {
        console.log('\n🔧 Raw Data (MercadoPago):');
        console.log(JSON.stringify(payment.raw, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { getPaymentIds, formatPayment };
