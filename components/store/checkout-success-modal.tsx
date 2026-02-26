"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function CheckoutSuccessModal() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sessionId) return

    const checkStatus = async () => {
      setLoading(true)

      const res = await fetch(`/api/checkout/session-status?session_id=${sessionId}`)
      const data = await res.json()

      if (data?.payment_status === "completed") {
        setOpen(true)
      }

      setLoading(false)
    }

    checkStatus()
  }, [sessionId])

  const handleClose = () => {
    setOpen(false)

    // limpiar query param para que no reaparezca
    router.replace(window.location.pathname)
  }

  if (!sessionId || loading) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>✅ Pedido recibido</DialogTitle>
          <DialogDescription>
            Tu pedido fue recibido correctamente y ya estamos preparándolo. La comunicación continuará por WhatsApp.
          </DialogDescription>
        </DialogHeader>

          <Button onClick={handleClose} className="w-full">
            Entendido
          </Button>
      </DialogContent>
    </Dialog>
  )
}