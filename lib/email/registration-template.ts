type RegistrationUtm = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

type RegistrationTemplateInput = {
  firstName: string
  lastName: string
  email: string
  utm: RegistrationUtm
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatDateAr(): string {
  return new Date().toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  })
}

export function registrationTemplate({
  firstName,
  lastName,
  email,
  utm,
}: RegistrationTemplateInput): string {
  const rows: Array<[string, string]> = [
    ["Nombre", `${escapeHtml(firstName)} ${escapeHtml(lastName)}`],
    ["Email", escapeHtml(email)],
    ["Fecha", escapeHtml(formatDateAr())],
    ["Campaign", escapeHtml(utm.utm_campaign ?? "N/D")],
    ["Source", escapeHtml(utm.utm_source ?? "N/D")],
    ["Medium", escapeHtml(utm.utm_medium ?? "N/D")],
    ["Content", escapeHtml(utm.utm_content ?? "N/D")],
    ["Term", escapeHtml(utm.utm_term ?? "N/D")],
  ]

  return `
    <h2>Nuevo registro en FoodyNow</h2>
    <table>
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${value}</td></tr>`
        )
        .join("")}
    </table>
  `.trim()
}
