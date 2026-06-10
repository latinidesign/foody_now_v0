import { NextResponse } from "next/server"
import * as crypto from "crypto"
import { normalizePem } from "@/lib/qz/pem-utils"

const LOG = "[QZ certificate]"

export async function GET() {
  const rawCert = process.env.QZ_CERTIFICATE

  if (!rawCert) {
    console.error(`${LOG} QZ_CERTIFICATE no está configurada`)
    return new NextResponse("QZ_CERTIFICATE no está configurada", { status: 500 })
  }

  console.log(`${LOG} rawCert length: ${rawCert.length}`)

  const cert = normalizePem(rawCert, "CERTIFICATE")
  console.log(`${LOG} certPem length: ${cert.length}`)
  console.log(`${LOG} certPem header: ${cert.slice(0, 50)}`)

  try {
    const x509 = new crypto.X509Certificate(cert)
    console.log(`${LOG} Sirviendo certificado:`)
    console.log(`${LOG}   subject: ${x509.subject}`)
    console.log(`${LOG}   issuer: ${x509.issuer}`)
    console.log(`${LOG}   fingerprint: ${x509.fingerprint}`)
    console.log(`${LOG}   validFrom: ${x509.validFrom}`)
    console.log(`${LOG}   validTo: ${x509.validTo}`)
    console.log(`${LOG}   is CA: ${x509.ca}`)
    console.log(`${LOG}   isSelfSigned: ${x509.subject === x509.issuer}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`${LOG} Error parseando certificado antes de servir:`, msg)
  }

  return new NextResponse(cert, {
    headers: { "Content-Type": "text/plain" },
  })
}
