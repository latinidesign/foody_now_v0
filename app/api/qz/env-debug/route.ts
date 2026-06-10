import { NextResponse } from "next/server"

export async function GET() {
  const privateKey = process.env.QZ_PRIVATE_KEY
  const certificate = process.env.QZ_CERTIFICATE

  return NextResponse.json({
    QZ_PRIVATE_KEY: {
      exists: !!privateKey,
      length: privateKey?.length ?? 0,
    },
    QZ_CERTIFICATE: {
      exists: !!certificate,
      length: certificate?.length ?? 0,
    },
  })
}
