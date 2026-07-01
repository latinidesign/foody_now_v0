import * as crypto from "crypto"
import * as fs from "fs"
import * as path from "path"

// ─── DER Encoding Primitives ───

function encodeLength(len: number): Buffer {
  if (len < 128) return Buffer.from([len])
  const bytes: number[] = []
  let remaining = len
  while (remaining > 0) {
    bytes.unshift(remaining & 0xff)
    remaining >>= 8
  }
  return Buffer.from([0x80 | bytes.length, ...bytes])
}

function encodeDER(tag: number, value: Buffer): Buffer {
  return Buffer.concat([Buffer.from([tag]), encodeLength(value.length), value])
}

function encodeInteger(value: bigint | number): Buffer {
  const v = typeof value === "number" ? BigInt(value) : value
  if (v < 0n) throw new Error("Negative integers not supported")
  let hex = v.toString(16)
  if (hex.length % 2 !== 0) hex = "0" + hex
  const bytes = Buffer.from(hex, "hex")
  if (bytes[0] & 0x80) {
    return encodeDER(0x02, Buffer.concat([Buffer.from([0x00]), bytes]))
  }
  return encodeDER(0x02, bytes)
}

function encodeIntegerFromBuffer(buf: Buffer): Buffer {
  // Remove leading zeros
  let start = 0
  while (start < buf.length - 1 && buf[start] === 0x00) start++
  let bytes = buf.subarray(start)
  if (bytes[0] & 0x80) {
    bytes = Buffer.concat([Buffer.from([0x00]), bytes])
  }
  return encodeDER(0x02, bytes)
}

function encodeOID(oid: string): Buffer {
  const parts = oid.split(".").map(Number)
  const result: number[] = [parts[0] * 40 + parts[1]]
  for (let i = 2; i < parts.length; i++) {
    let val = parts[i]
    if (val < 128) {
      result.push(val)
    } else {
      const bytes: number[] = []
      while (val > 0) {
        bytes.unshift(val & 0x7f)
        val >>= 7
      }
      for (let j = 0; j < bytes.length - 1; j++) {
        bytes[j] |= 0x80
      }
      result.push(...bytes)
    }
  }
  return encodeDER(0x06, Buffer.from(result))
}

function encodeBitString(data: Buffer, unusedBits = 0): Buffer {
  return encodeDER(0x03, Buffer.concat([Buffer.from([unusedBits]), data]))
}

function encodeOctetString(data: Buffer): Buffer {
  return encodeDER(0x04, data)
}

function encodeNull(): Buffer {
  return Buffer.from([0x05, 0x00])
}

function encodePrintableString(str: string): Buffer {
  return encodeDER(0x13, Buffer.from(str, "ascii"))
}

function encodeUTCTime(date: Date): Buffer {
  // YYMMDDHHMMSSZ
  const yy = date.getUTCFullYear().toString().slice(2)
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(date.getUTCDate()).padStart(2, "0")
  const hh = String(date.getUTCHours()).padStart(2, "0")
  const min = String(date.getUTCMinutes()).padStart(2, "0")
  const ss = String(date.getUTCSeconds()).padStart(2, "0")
  return encodeDER(0x17, Buffer.from(`${yy}${mm}${dd}${hh}${min}${ss}Z`, "ascii"))
}

function encodeSequence(items: Buffer[]): Buffer {
  return encodeDER(0x30, Buffer.concat(items))
}

function encodeSet(items: Buffer[]): Buffer {
  return encodeDER(0x31, Buffer.concat(items))
}

function encodeExplicit(tagNum: number, value: Buffer): Buffer {
  return encodeDER(0xa0 | tagNum, value)
}

// ─── OID Constants ───

const OID = {
  rsaEncryption: "1.2.840.113549.1.1.1",
  sha256WithRSA: "1.2.840.113549.1.1.11",
  sha512WithRSA: "1.2.840.113549.1.1.13",
  commonName: "2.5.4.3",
  countryName: "2.5.4.6",
  organizationName: "2.5.4.10",
  organizationalUnitName: "2.5.4.11",
  basicConstraints: "2.5.29.19",
  keyUsage: "2.5.29.15",
} as const

// ─── DN (Distinguished Name) ───

function encodeDN(attributes: { oid: string; value: string }[]): Buffer {
  const rdns = attributes.map((attr) =>
    encodeSet([
      encodeSequence([encodeOID(attr.oid), encodePrintableString(attr.value)]),
    ]),
  )
  return encodeSequence(rdns)
}

// ─── SubjectPublicKeyInfo ───

function encodeSPKI(publicKey: crypto.KeyObject): Buffer {
  const jwk = publicKey.export({ format: "jwk" }) as JsonWebKey & {
    n: string
    e: string
  }

  const modulus = Buffer.from(jwk.n, "base64url")
  const exponent = Buffer.from(jwk.e, "base64url")

  const rsaPubKey = encodeSequence([
    encodeIntegerFromBuffer(modulus),
    encodeIntegerFromBuffer(exponent),
  ])

  return encodeSequence([
    encodeSequence([encodeOID(OID.rsaEncryption), encodeNull()]),
    encodeBitString(rsaPubKey),
  ])
}

// ─── Extensions ───

function encodeBasicConstraints(ca: boolean, pathLen?: number): Buffer {
  const children: Buffer[] = []
  if (ca) {
    children.push(encodeDER(0x01, Buffer.from([0xff]))) // BOOLEAN TRUE
  }
  if (pathLen !== undefined) {
    children.push(encodeInteger(pathLen))
  }
  return encodeSequence(children)
}

function encodeKeyUsage(usages: number): Buffer {
  // Key usage is a BIT STRING in an OCTET STRING inside the extension value
  let bits = usages
  const bytes: number[] = []
  while (bits > 0 || bytes.length === 0) {
    bytes.unshift(bits & 0xff)
    bits >>= 8
  }
  // Count unused bits in the last byte
  let unusedBits = 0
  const lastByte = bytes[bytes.length - 1]
  for (let i = 0; i < 8; i++) {
    if (lastByte & (1 << i)) break
    unusedBits++
  }
  if (unusedBits === 8 && bytes.length === 1 && lastByte === 0) unusedBits = 0
  return encodeDER(0x03, Buffer.concat([Buffer.from([unusedBits]), Buffer.from(bytes)]))
}

function encodeExtension(oid: string, critical: boolean, value: Buffer): Buffer {
  const children: Buffer[] = [encodeOID(oid)]
  if (critical) {
    children.push(encodeDER(0x01, Buffer.from([0xff])))
  }
  children.push(encodeOctetString(value))
  return encodeSequence(children)
}

function encodeExtensions(extensions: Buffer[]): Buffer {
  return encodeExplicit(3, encodeSequence(extensions))
}

// ─── Signing ───

function signData(
  data: Buffer,
  privateKey: crypto.KeyObject,
  algorithm = "SHA512",
): Buffer {
  const sign = crypto.createSign(algorithm)
  sign.update(data)
  return sign.sign({
    key: privateKey,
    dsaEncoding: "der",
    padding: crypto.constants.RSA_PKCS1_PADDING,
  })
}

// ─── Build x509 Certificate ───

interface CertConfig {
  serialNumber: bigint
  issuer: { oid: string; value: string }[]
  subject: { oid: string; value: string }[]
  notBefore: Date
  notAfter: Date
  publicKey: crypto.KeyObject
  issuerPrivateKey: crypto.KeyObject
  extensions?: Buffer[]
  signAlgorithm?: string
  signOID?: string
}

function buildX509Cert(config: CertConfig): string {
  const signAlgorithm = config.signAlgorithm || "SHA512"
  const signOID = config.signOID || OID.sha512WithRSA

  const version = encodeExplicit(0, encodeInteger(2)) // v3 = 2

  const serial = encodeInteger(config.serialNumber)

  const sigAlg = encodeSequence([encodeOID(signOID), encodeNull()])

  const issuer = encodeDN(config.issuer)
  const subject = encodeDN(config.subject)

  const validity = encodeSequence([
    encodeUTCTime(config.notBefore),
    encodeUTCTime(config.notAfter),
  ])

  const spki = encodeSPKI(config.publicKey)

  const tbsChildren: Buffer[] = [version, serial, sigAlg, issuer, validity, subject, spki]
  if (config.extensions && config.extensions.length > 0) {
    tbsChildren.push(encodeExtensions(config.extensions))
  }
  const tbsCert = encodeSequence(tbsChildren)

  const signature = signData(tbsCert, config.issuerPrivateKey, signAlgorithm)

  const cert = encodeSequence([
    tbsCert,
    encodeSequence([encodeOID(signOID), encodeNull()]),
    encodeBitString(signature),
  ])

  // Convert to PEM
  const b64 = cert.toString("base64")
  const lines: string[] = []
  lines.push("-----BEGIN CERTIFICATE-----")
  for (let i = 0; i < b64.length; i += 64) {
    lines.push(b64.slice(i, i + 64))
  }
  lines.push("-----END CERTIFICATE-----")

  return lines.join("\n") + "\n"
}

// ─── Key Usage Constants ───

const KEY_USAGE = {
  digitalSignature: 1 << 0,
  nonRepudiation: 1 << 1,
  keyEncipherment: 1 << 2,
  dataEncipherment: 1 << 3,
  keyAgreement: 1 << 4,
  keyCertSign: 1 << 5,
  cRLSign: 1 << 6,
  encipherOnly: 1 << 7,
  decipherOnly: 1 << 8,
} as const

// ─── Main ───

function main() {
  console.log("Generando certificados para QZ Tray (FoodyNow)...\n")

  const now = new Date()
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 10)

  // ── 1. Root CA ──

  console.log("1/4 Generando par de claves de la Root CA (RSA 2048)...")
  const rootKeyPair = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  })

  console.log("2/4 Creando certificado autofirmado de la Root CA...")
  const rootExtensions = [
    encodeExtension(
      OID.basicConstraints,
      true,
      encodeBasicConstraints(true),
    ),
    encodeExtension(
      OID.keyUsage,
      true,
      encodeKeyUsage(KEY_USAGE.keyCertSign | KEY_USAGE.cRLSign),
    ),
  ]

  const rootCert = buildX509Cert({
    serialNumber: 1n,
    issuer: [
      { oid: OID.commonName, value: "FoodyNow Root CA" },
      { oid: OID.organizationName, value: "FoodyNow" },
      { oid: OID.countryName, value: "AR" },
    ],
    subject: [
      { oid: OID.commonName, value: "FoodyNow Root CA" },
      { oid: OID.organizationName, value: "FoodyNow" },
      { oid: OID.countryName, value: "AR" },
    ],
    notBefore: now,
    notAfter: expiresAt,
    publicKey: crypto.createPublicKey(rootKeyPair.publicKey),
    issuerPrivateKey: crypto.createPrivateKey(rootKeyPair.privateKey),
    extensions: rootExtensions,
  })

  // ── 2. Signing Certificate ──

  console.log("3/4 Generando par de claves del certificado de firma (RSA 2048)...")
  const signKeyPair = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  })

  console.log("4/4 Creando certificado de firma firmado por la Root CA...")
  const signExtensions = [
    encodeExtension(
      OID.basicConstraints,
      true,
      encodeBasicConstraints(false),
    ),
    encodeExtension(
      OID.keyUsage,
      true,
      encodeKeyUsage(KEY_USAGE.digitalSignature),
    ),
  ]

  const signCert = buildX509Cert({
    serialNumber: 2n,
    issuer: [
      { oid: OID.commonName, value: "FoodyNow Root CA" },
      { oid: OID.organizationName, value: "FoodyNow" },
      { oid: OID.countryName, value: "AR" },
    ],
    subject: [
      { oid: OID.commonName, value: "FoodyNow Printing" },
      { oid: OID.organizationName, value: "FoodyNow" },
      { oid: OID.countryName, value: "AR" },
    ],
    notBefore: now,
    notAfter: expiresAt,
    publicKey: crypto.createPublicKey(signKeyPair.publicKey),
    issuerPrivateKey: crypto.createPrivateKey(rootKeyPair.privateKey),
    extensions: signExtensions,
  })

  // ── Write files ──

  const rootDir = path.resolve(__dirname, "..")
  const files = {
    "override.crt": rootCert,
    "private-key.pem": signKeyPair.privateKey,
    "signing-cert.pem": signCert,
  }

  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(rootDir, filename)
    fs.writeFileSync(filePath, content)
    console.log(`  ✓ ${filename}`)
  }

  console.log("\n── Certificados generados correctamente ──")
  console.log("")
  console.log("Próximos pasos:")
  console.log("  1. Agregá el contenido de private-key.pem como variable de entorno QZ_PRIVATE_KEY")
  console.log("  2. Agregá el contenido de signing-cert.pem como variable de entorno QZ_CERTIFICATE")
  console.log("  3. Copiá override.crt a public/override.crt para servir como asset estático")
  console.log("  4. El archivo root-ca-private-key.pem NO se usa en runtime — guardalo offline por si necesitás regenerar")
  console.log("")
  console.log("Los owners deben copiar public/override.crt a C:\\Program Files\\QZ Tray\\override.crt")
}

main()
