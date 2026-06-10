import { NextRequest, NextResponse } from "next/server"
import * as crypto from "crypto"
import { normalizePem } from "@/lib/qz/pem-utils"

const LOG = "[QZ sign]"

export async function POST(request: NextRequest) {
  // ── 1. Leer y validar QZ_PRIVATE_KEY ──
  const rawKey = process.env.QZ_PRIVATE_KEY

  if (!rawKey) {
    console.error(`${LOG} QZ_PRIVATE_KEY no está configurada`)
    return NextResponse.json(
      { error: "QZ_PRIVATE_KEY no está configurada" },
      { status: 500 },
    )
  }

  console.log(`${LOG} rawKey length: ${rawKey.length}, empieza con: ${rawKey.slice(0, 40)}`)

  const privateKeyPem = normalizePem(rawKey, "PRIVATE KEY")
  console.log(`${LOG} privateKeyPem length: ${privateKeyPem.length}`)
  console.log(`${LOG} privateKeyPem header: ${privateKeyPem.slice(0, 50)}`)

  // ── 2. Validar que sea una clave privada válida ──
  let keyObj: crypto.KeyObject
  try {
    keyObj = crypto.createPrivateKey(privateKeyPem)
    console.log(`${LOG} createPrivateKey OK, type: ${keyObj.type}, asymmetricKeyType: ${keyObj.asymmetricKeyType}`)
  } catch (parseErr) {
    const parseMsg = parseErr instanceof Error ? parseErr.message : String(parseErr)
    console.error(`${LOG} createPrivateKey falló:`, parseMsg)
    return NextResponse.json(
      { error: `Clave privada inválida: ${parseMsg}` },
      { status: 500 },
    )
  }

  // ── 3. Parsear QZ_CERTIFICATE como referencia ──
  const rawCert = process.env.QZ_CERTIFICATE
  let certPem: string | null = null
  let x509: crypto.X509Certificate | null = null
  let certParseError: string | null = null

  if (!rawCert) {
    certParseError = "QZ_CERTIFICATE no está configurada"
    console.error(`${LOG} ${certParseError}`)
  } else {
    console.log(`${LOG} rawCert length: ${rawCert.length}`)
    certPem = normalizePem(rawCert, "CERTIFICATE")
    console.log(`${LOG} certPem length: ${certPem.length}`)
    console.log(`${LOG} certPem header: ${certPem.slice(0, 50)}`)

    try {
      x509 = new crypto.X509Certificate(certPem)
      console.log(`${LOG} X509Certificate OK`)
      console.log(`${LOG}   subject: ${x509.subject}`)
      console.log(`${LOG}   issuer: ${x509.issuer}`)
      console.log(`${LOG}   validFrom: ${x509.validFrom}`)
      console.log(`${LOG}   validTo: ${x509.validTo}`)
      console.log(`${LOG}   fingerprint: ${x509.fingerprint}`)
      console.log(`${LOG}   is CA: ${x509.ca}`)
      console.log(`${LOG}   subject matches issuer (self-signed): ${x509.subject === x509.issuer}`)

      // Extraer la clave pública del certificado
      const certPubKey = x509.publicKey
      console.log(`${LOG}   cert pub key type: ${certPubKey.type}, asymmetricKeyType: ${certPubKey.asymmetricKeyType}`)

      // Comparar fingerprints de las claves pública y privada
      const privPubKey = crypto.createPublicKey(keyObj)
      const privPubKeyDer = privPubKey.export({ type: "spki", format: "der" })
      const certPubKeyDer = certPubKey.export({ type: "spki", format: "der" })
      const keysMatch = privPubKeyDer.equals(certPubKeyDer)
      console.log(`${LOG}   private+public → cert public key DER match: ${keysMatch}`)
    } catch (certErr) {
      certParseError = certErr instanceof Error ? certErr.message : String(certErr)
      console.error(`${LOG} Error parseando QZ_CERTIFICATE:`, certParseError)
    }
  }

  // ── 4. Parsear body ──
  let body: { toSign?: string }
  try {
    body = await request.json()
    console.log(`${LOG} Body recibido, toSign length: ${body.toSign?.length ?? 0}`)
  } catch {
    console.error(`${LOG} Body inválido (no es JSON)`)
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  if (!body.toSign) {
    console.error(`${LOG} Falta el campo toSign en el body`)
    return NextResponse.json({ error: "Falta el campo toSign" }, { status: 400 })
  }

  // ── 5. Firmar ──
  try {
    console.log(`${LOG} Firmando toSign (length=${body.toSign.length}) con SHA512...`)
    const sign = crypto.createSign("SHA512")
    sign.update(body.toSign)
    const signature = sign.sign(privateKeyPem, "base64")
    console.log(`${LOG} Firma exitosa, signature length: ${signature.length}`)

    // ── 6. Auto-verificar la firma con el certificado (si disponible) ──
    let verifyResult: boolean | null = null
    if (x509) {
      try {
        const verifier = crypto.createVerify("SHA512")
        verifier.update(body.toSign)
        verifyResult = verifier.verify(x509.publicKey, signature, "base64")
        console.log(`${LOG} Auto-verificación con certificado: ${verifyResult ? "OK" : "FALLÓ"}`)
      } catch (verifyErr) {
        const verifyMsg = verifyErr instanceof Error ? verifyErr.message : String(verifyErr)
        console.error(`${LOG} Error en auto-verificación:`, verifyMsg)
      }
    }

    return NextResponse.json({
      signature,
      _debug: {
        keyType: keyObj.asymmetricKeyType,
        cert: x509
          ? {
              subject: x509.subject,
              issuer: x509.issuer,
              validFrom: x509.validFrom,
              validTo: x509.validTo,
              fingerprint: x509.fingerprint,
              isCA: x509.ca,
              isSelfSigned: x509.subject === x509.issuer,
            }
          : { error: certParseError || "no disponible" },
        verifyPassed: verifyResult,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`${LOG} Error al firmar:`, msg)
    return NextResponse.json(
      { error: `Error al firmar: ${msg}` },
      { status: 500 },
    )
  }
}
