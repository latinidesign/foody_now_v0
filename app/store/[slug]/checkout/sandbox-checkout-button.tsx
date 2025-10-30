"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

type SandboxCheckoutButtonProps = {
	commerceId: string
}

export function SandboxCheckoutButton({ commerceId }: SandboxCheckoutButtonProps) {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleClick = async () => {
		setLoading(true)
		setError(null)

		try {
			// Sandbox-only: this hits the protected backend route to generate a preference using test credentials.
			const response = await fetch(`/api/mp/create-preference?commerce_id=${encodeURIComponent(commerceId)}`)

			if (!response.ok) {
				throw new Error("Failed to create Mercado Pago preference")
			}

			const payload = (await response.json()) as { checkoutUrl?: string | null }

			if (!payload.checkoutUrl) {
				throw new Error("Missing checkout URL in response")
			}

			// Frontend-only: redirect the shopper to the URL returned by the backend.
			window.location.href = payload.checkoutUrl
		} catch (checkoutError) {
			setError(checkoutError instanceof Error ? checkoutError.message : "Unknown error")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="space-y-4">
			<Button onClick={handleClick} disabled={loading}>
				{loading ? "Creando preferencia..." : "Probar Checkout Pro (Sandbox)"}
			</Button>

			{error ? (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}
		</div>
	)
}

