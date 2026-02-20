import { createClient } from "@/lib/supabase/server"

type StoreMPAccount = {
  store_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
}

async function getStoreFromDB(storeId: string): Promise<StoreMPAccount> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("mp_accounts")
    .select("store_id, access_token, refresh_token, token_expires_at")
    .eq("store_id", storeId)
    .single()

  if (error || !data) {
    throw new Error(`No se encontró cuenta MercadoPago para store ${storeId}`)
  }

  return data
}


async function updateStoreTokens(
  storeId: string,
  tokens: {
    access_token: string
    refresh_token: string
    expires_at: Date
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("mp_accounts")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokens.expires_at.toISOString()
    })
    .eq("store_id", storeId)

  if (error) {
    throw new Error("Error actualizando tokens MercadoPago: " + error.message)
  }
}


export async function getValidAccessToken(storeId: string) {
  const store = await getStoreFromDB(storeId)

  const now = Date.now()
  const expiresAt = new Date(store.token_expires_at).getTime()

  if (now < expiresAt - 60000) {
    // todavía es válido (1 min margen)
    return store.access_token
  }

  if (!store.refresh_token) {
    throw new Error("La cuenta no tiene refresh_token guardado")
  }


  // Token expirado → refrescar
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: process.env.MP_CLIENT_ID,
      client_secret: process.env.MP_CLIENT_SECRET,
      refresh_token: store.refresh_token
    })
  })

  const data = await response.json()

  // guardar nuevos tokens
  await updateStoreTokens(storeId, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000)
  })

  return data.access_token
}

interface OrderData {
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryType: "pickup" | "delivery"
  deliveryAddress: string
  deliveryNotes: string
}

export async function createPaymentPreference(
  storeId: string,
  items: any[],
  orderData: OrderData,
  subtotal: number,
  deliveryFee: number,
  total: number
): Promise<{ init_point: string; preference_id: string }> {
  const accessToken = await getValidAccessToken(storeId)

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL

  const response = await fetch(
    "https://api.mercadopago.com/checkout/preferences",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items,
        back_urls: {
          success: `${BASE_URL}/checkout/success`,
          failure: `${BASE_URL}/checkout/failure`,
          pending: `${BASE_URL}/checkout/pending`
        },
        auto_return: "approved",
        notification_url: `${BASE_URL}/api/webhooks/mercadopago`,
        metadata: {
          store_id: storeId
        }
      })
    }
  )

  //  Manejo de error HTTP
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Error creando preferencia MP (${response.status}): ${errorText}`
    )
  }

  const data = await response.json()

  //  Validación mínima de seguridad
  if (!data.init_point || !data.id) {
    throw new Error("MercadoPago no devolvió init_point válido")
  }

  return {
    init_point: data.init_point,
    preference_id: data.id
  }
}


