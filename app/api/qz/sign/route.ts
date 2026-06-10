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
  const pemHeader = privateKeyPem.slice(0, 60)
  const pemType = pemHeader.match(/-----BEGIN (.+)-----/)?.[1] || "desconocido"

  console.log("[QZ sign] Header del PEM normalizado:", pemHeader)

  try {
    crypto.createPrivateKey(privateKeyPem)
    console.log("[QZ sign] createPrivateKey OK")
  } catch (parseErr) {
    const parseMsg = parseErr instanceof Error ? parseErr.message : String(parseErr)
    console.error("[QZ sign] createPrivateKey falló:", parseMsg)
    return NextResponse.json(
      {
        error: `Clave privada inválida: ${parseMsg}`,
        debug: {
          pemType,
          pemLength: privateKeyPem.length,
        },
      },
      { status: 500 },
    )
  }

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
