// SDK de Mercado Pago
import { MercadoPagoConfig, Preference } from 'mercadopago';
// Agrega credenciales de autenticación (disponibles en el .env) y exporta el cliente configurado
export const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
console.log(`${process.env.APP_URL}/foodynow_logo-wt.svg`)