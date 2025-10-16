import { randomUUID } from "crypto"

import { createAdminClient } from "@/lib/supabase/admin"
import { getTenantSlugFromHost } from "@/lib/tenant"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

interface IncomingOrderItem {
  id?: string
  productId?: string
  quantity?: number
  price?: number
  unitPrice?: number
  selectedOptions?: Record<string, unknown> | null
}

interface IncomingOrderPayload {
  storeId?: string
  items?: IncomingOrderItem[]
  orderData?: {
    customerName?: string
    customerPhone?: string
    customerEmail?: string
    deliveryType?: "pickup" | "delivery"
    deliveryAddress?: string | null
    deliveryNotes?: string | null
  }
  subtotal?: number
  deliveryFee?: number
  total?: number
}

export async function POST(request: Request) {
  const cid = randomUUID()

  const fail = (status: number, message: string, context?: unknown) => {
    console.error(`[orders:create][cid:${cid}] ${message}`, context)
    return NextResponse.json({ error: message, cid }, { status })
  }

  let payload: IncomingOrderPayload

  try {
    payload = (await request.json()) as IncomingOrderPayload
  } catch (error) {
    return fail(400, "Invalid JSON payload", error)
  }

  const { storeId, items, orderData, subtotal, deliveryFee, total } = payload ?? {}

  if (!orderData?.customerName || !orderData?.customerPhone || !orderData?.customerEmail) {
    return fail(400, "Customer information is incomplete")
  }

  if (!Array.isArray(items) || items.length === 0) {
    return fail(400, "At least one item is required")
  }

  const supabase = createAdminClient()

  const host = request.headers.get("host")
  const subdomain = getTenantSlugFromHost(host)

  let resolvedStoreId: string | null = storeId ?? null

  if (subdomain) {
    const { data: storeByDomain, error: storeByDomainError } = await supabase
      .from("stores")
      .select("id, slug, is_active")
      .eq("slug", subdomain)
      .single()

    if (storeByDomainError || !storeByDomain) {
      return fail(404, "Store not found for domain", storeByDomainError)
    }

    if (!storeByDomain.is_active) {
      return fail(403, "Store is not active")
    }

    resolvedStoreId = storeByDomain.id

    if (storeId && storeId !== storeByDomain.id) {
      return fail(400, "Store identifier does not match the current domain")
    }
  } else if (!resolvedStoreId) {
    return fail(400, "Missing store identifier")
  }

  const { data: storeRecord, error: storeError } = await supabase
    .from("stores")
    .select("id, is_active")
    .eq("id", resolvedStoreId)
    .single()

  if (storeError || !storeRecord) {
    return fail(404, "Store not found", storeError)
  }

  if (!storeRecord.is_active) {
    return fail(403, "Store is not active")
  }

  const ensureNumber = (value: number | string | undefined): number => {
    const parsed = Number(value ?? 0)
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid numeric value: ${value}`)
    }
    return parsed
  }

  let computedSubtotal: number
  let computedDeliveryFee: number
  let computedTotal: number

  try {
    computedSubtotal = ensureNumber(subtotal)
    computedDeliveryFee = ensureNumber(deliveryFee)
    computedTotal = ensureNumber(total)
  } catch (numberError) {
    return fail(400, "Invalid monetary amounts", numberError)
  }

  const orderItemsPayload: {
    product_id: string
    quantity: number
    unit_price: number
    total_price: number
    selected_options: Record<string, unknown> | null
  }[] = []

  for (const item of items) {
    const productId = item.productId ?? item.id
    const quantity = Number(item.quantity ?? 0)
    const unitPrice = Number(item.unitPrice ?? item.price ?? 0)

    if (!productId) {
      return fail(400, "Each item must include a product identifier")
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return fail(400, "Each item must include a valid quantity")
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return fail(400, "Each item must include a valid unit price")
    }

    orderItemsPayload.push({
      product_id: productId,
      quantity,
      unit_price: unitPrice,
      total_price: unitPrice * quantity,
      selected_options: item.selectedOptions ?? null,
    })
  }

  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: storeRecord.id,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_email: orderData.customerEmail ?? null,
        delivery_type: orderData.deliveryType ?? "pickup",
        delivery_address: orderData.deliveryAddress ?? null,
        delivery_notes: orderData.deliveryNotes ?? null,
        subtotal: computedSubtotal,
        delivery_fee: computedDeliveryFee,
        total: computedTotal,
        status: "pending",
        payment_status: "pending",
      })
      .select("id")
      .single()

    if (orderError || !order) {
      console.error(`[orders:create][cid:${cid}] Failed creating order`, orderError)
      // Log more details if available
      if (orderError && orderError.details) {
        console.error(`[orders:create][cid:${cid}] Supabase error details:`, orderError.details)
      }

      return fail(500, "Unable to create order", orderError)
    }

    const itemsWithOrder = orderItemsPayload.map((item) => ({
      ...item,
      order_id: order.id,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(itemsWithOrder)

    if (itemsError) {
      console.error(`[orders:create][cid:${cid}] Failed to persist order items`, itemsError)
      return fail(500, "Unable to persist order items", itemsError)
    }

    return NextResponse.json({ order_id: order.id, cid }, { status: 201 })
  } catch (error) {
    return fail(500, "Unexpected server error", error)
  }
}
