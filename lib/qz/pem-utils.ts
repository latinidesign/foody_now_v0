export function normalizePem(pem: string): string {
  if (pem.includes("\n")) return pem

  const headerMatch = pem.match(/^(-----BEGIN [A-Z ]+-----)/)
  const footerMatch = pem.match(/(-----END [A-Z ]+-----)$/)
  if (!headerMatch || !footerMatch) return pem

  const header = headerMatch[1]
  const footer = footerMatch[1]
  const body = pem.slice(header.length, pem.length - footer.length).replace(/\s/g, "")

  const lines: string[] = [header]
  for (let i = 0; i < body.length; i += 64) {
    lines.push(body.slice(i, i + 64))
  }
  lines.push(footer)
  lines.push("")

  return lines.join("\n")
}
