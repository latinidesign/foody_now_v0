// SDK de Mercado Pago
import { MercadoPagoConfig } from 'mercadopago';
// Agrega credenciales de autenticación (disponibles en el .env) y exporta el cliente configurado
export const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
