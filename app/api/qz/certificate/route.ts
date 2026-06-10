import { NextResponse } from "next/server"
import { normalizePem } from "@/lib/qz/pem-utils"

export async function GET() {
  const rawCert = process.env.QZ_CERTIFICATE

  if (!rawCert) {
    return new NextResponse("QZ_CERTIFICATE no está configurada", { status: 500 })
  }

  const cert = normalizePem(rawCert)

  return new NextResponse(cert, {
    headers: { "Content-Type": "text/plain" },
  })
}
