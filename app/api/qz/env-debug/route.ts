import { NextResponse } from "next/server"
import * as crypto from "crypto"
import { normalizePem } from "@/lib/qz/pem-utils"

export async function GET() {
  const rawKey = process.env.QZ_PRIVATE_KEY
  const rawCert = process.env.QZ_CERTIFICATE

  let keyDebug: Record<string, any> = {
    exists: !!rawKey,
    length: rawKey?.length ?? 0,
  }

  if (rawKey) {
    try {
      const pem = normalizePem(rawKey, "PRIVATE KEY")
      const keyObj = crypto.createPrivateKey(pem)
      keyDebug.asymmetricKeyType = keyObj.asymmetricKeyType
      keyDebug.normalizedLength = pem.length
    } catch (e) {
      keyDebug.parseError = e instanceof Error ? e.message : String(e)
    }
  }

  let certDebug: Record<string, any> = {
    exists: !!rawCert,
    length: rawCert?.length ?? 0,
  }

  if (rawCert) {
    try {
      const pem = normalizePem(rawCert, "CERTIFICATE")
      const x509 = new crypto.X509Certificate(pem)
      certDebug.normalizedLength = pem.length
      certDebug.subject = x509.subject
      certDebug.issuer = x509.issuer
      certDebug.fingerprint = x509.fingerprint
      certDebug.isSelfSigned = x509.subject === x509.issuer
    } catch (e) {
      certDebug.parseError = e instanceof Error ? e.message : String(e)
    }
  }

  return NextResponse.json({
    QZ_PRIVATE_KEY: keyDebug,
    QZ_CERTIFICATE: certDebug,
  })
}
