import { NextRequest, NextResponse } from "next/server"
import * as crypto from "crypto"
import { normalizePem } from "@/lib/qz/pem-utils"

export async function POST(request: NextRequest) {
  const rawKey = process.env.QZ_PRIVATE_KEY

  if (!rawKey) {
    return NextResponse.json(
      { error: "QZ_PRIVATE_KEY no está configurada" },
      { status: 500 },
    )
  }

  const privateKeyPem = normalizePem(rawKey)

  let body: { toSign?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  if (!body.toSign) {
    return NextResponse.json({ error: "Falta el campo toSign" }, { status: 400 })
  }

  try {
    const sign = crypto.createSign("SHA512")
    sign.update(body.toSign)
    const signature = sign.sign(privateKeyPem, "base64")

    return NextResponse.json({ signature })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Error al firmar request QZ Tray:", msg)
    return NextResponse.json(
      { error: `Error al firmar: ${msg}` },
      { status: 500 },
    )
  }
}
