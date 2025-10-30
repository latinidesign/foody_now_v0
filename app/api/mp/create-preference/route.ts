import { NextResponse } from "next/server"

export const runtime = "nodejs"

type MercadoPagoPreference = {
	id?: string
	init_point?: string
	sandbox_init_point?: string
}

export async function GET(request: Request) {
	// Backend-only: the access token never leaves this scope or the response payload.
	const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

	if (!accessToken) {
		return NextResponse.json(
			{ error: "Missing Mercado Pago credentials", code: "missing_access_token" },
			{ status: 500 },
		)
	}

	const url = new URL(request.url)
	const commerceId = url.searchParams.get("commerce_id")

	if (!commerceId) {
		return NextResponse.json(
			{ error: "Missing commerce_id parameter", code: "missing_commerce_id" },
			{ status: 400 },
		)
	}

	const meResponse = await fetch("https://api.mercadopago.com/users/me", {
		method: "GET",
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	})

	if (meResponse.ok) {
		const mePayload = (await meResponse.json()) as { id?: number; nickname?: string; site_id?: string }
		console.log(
			"[mp:create-preference] Credencial detectada",
			JSON.stringify(
				{
					id: mePayload.id,
					nickname: mePayload.nickname,
					site_id: mePayload.site_id,
				},
				null,
				2,
			),
		)
	} else {
		console.warn(
			"[mp:create-preference] No se pudo validar la credencial",
			JSON.stringify({ status: meResponse.status, statusText: meResponse.statusText }),
		)
	}

	const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify({
			items: [
				{
					title: "Pedido FoodyNow",
					quantity: 1,
					unit_price: 1000,
					currency_id: "ARS",
				},
			],
			external_reference: commerceId,
			payment_methods: {
				excluded_payment_types: [
					{
						id: "account_money",
					},
				],
			},
			metadata: {
				environment: process.env.NODE_ENV === "production" ? "production" : "sandbox", // Sandbox indicator for visibility.
			},
		}),
	})

	if (!preferenceResponse.ok) {
		const errorPayload = await preferenceResponse.text()
		console.error("[mp:create-preference] Fallo la creacion de la preferencia", {
			status: preferenceResponse.status,
			error: errorPayload,
		})
		return NextResponse.json(
			{
				error: "Mercado Pago preference creation failed",
				code: "preference_creation_failed",
				cid: commerceId,
			},
			{ status: preferenceResponse.status },
		)
	}

	const preferencePayload = (await preferenceResponse.json()) as MercadoPagoPreference
	const checkoutUrl = preferencePayload.sandbox_init_point ?? preferencePayload.init_point ?? null

	if (!checkoutUrl) {
		console.error("[mp:create-preference] La respuesta no incluye URLs utilizables", preferencePayload)
		return NextResponse.json(
			{
				error: "Mercado Pago preference response missing init point",
				code: "missing_checkout_url",
				cid: commerceId,
			},
			{ status: 502 },
		)
	}

	// Sandbox info: si ves sandbox_init_point, estas en modo test; init_point suele ser productivo.
	if (!preferencePayload.sandbox_init_point && preferencePayload.init_point) {
		console.warn(
			"[mp:create-preference] Advertencia: la API entrego init_point (posible enlace de produccion)",
		)
	}

	return NextResponse.json({
		checkoutUrl,
		reference: preferencePayload.id ?? null,
		environment: preferencePayload.sandbox_init_point ? "sandbox" : "production-ready", // Como migrar: reemplaza el token por el productivo y verifica la advertencia anterior.
	})
}
