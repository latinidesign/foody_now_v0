export function normalizePem(pem: string, expectedType?: string): string {
  const trimmed = pem.trim()

  if (trimmed.startsWith("-----BEGIN")) {
    if (trimmed.includes("\n")) return trimmed

    const headerMatch = trimmed.match(/^(-----BEGIN [A-Z ]+-----)/)
    const footerMatch = trimmed.match(/(-----END [A-Z ]+-----)$/)
    if (!headerMatch || !footerMatch) return trimmed

    const header = headerMatch[1]
    const footer = footerMatch[1]
    const body = trimmed.slice(header.length, trimmed.length - footer.length).replace(/\s/g, "")

    const lines: string[] = [header]
    for (let i = 0; i < body.length; i += 64) {
      lines.push(body.slice(i, i + 64))
    }
    lines.push(footer)
    lines.push("")

    return lines.join("\n")
  }

  if (expectedType) {
    const b64 = trimmed.replace(/\s/g, "")
    const lines: string[] = [`-----BEGIN ${expectedType}-----`]
    for (let i = 0; i < b64.length; i += 64) {
      lines.push(b64.slice(i, i + 64))
    }
    lines.push(`-----END ${expectedType}-----`)
    lines.push("")
    return lines.join("\n")
  }

  return trimmed
}
