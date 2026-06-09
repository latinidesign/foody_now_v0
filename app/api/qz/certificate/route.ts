import { NextResponse } from "next/server"

export async function GET() {
  const cert = process.env.QZ_CERTIFICATE

  if (!cert) {
    return new NextResponse("QZ_CERTIFICATE no está configurada", { status: 500 })
  }

  return new NextResponse(cert, {
    headers: { "Content-Type": "text/plain" },
  })
}
