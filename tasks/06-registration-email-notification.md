# tasks/06-registration-email-notification.md

## Objetivo

Cuando un usuario complete el formulario de registro en `/auth/sign-up`, enviar una notificacion por email a los administradores de FoodyNow con los datos del nuevo registro (nombre, email, fecha/hora, y UTM params de la campana publicitaria), para que sepan que alguien se registro mediante los links de publicidad. El envio del email no debe bloquear ni ralentizar la experiencia del usuario al registrarse.

## Scope estricto

### Incluye

- Nueva dependencia: `resend` (npm oficial, ~50KB). Requiere cuenta gratuita en resend.com.
- Verificar dominio `foodynow.com.ar` en Resend (agregar registros DKIM + SPF en el DNS).
- Nueva variable de entorno `RESEND_API_KEY` (API key de Resend).
- Nueva variable de entorno `NOTIFY_REGISTRATION_TO` (emails de los administradores, separados por coma).
- Nuevo endpoint `POST /api/admin/notify-registration` que recibe los datos del registro y envia el email via Resend.
- Validacion de autenticacion en el endpoint via `Authorization: Bearer <supabase_access_token>` del usuario recien creado.
- Captura de UTM params (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) desde `window.location.search` en la pagina de registro.
- Persistencia de los UTMs en `auth.users.raw_user_meta_data` dentro del `signUp()`.
- Llamada al endpoint de notificacion despues de `signUp()` exitoso, con manejo de error no-bloqueante (fire-and-forget).
- Escape de HTML en el template del email para prevenir XSS via UTMs maliciosos.
- Las variables de entorno se documentan en `.env.local` para desarrollo local y en Vercel para produccion.

### No incluye

- Soporte multi-destinatario configurable desde una UI de admin (solo env vars).
- Panel de historial de notificaciones enviadas.
- Tracking de apertura de emails (open rates).
- Cola de reintentos si Resend falla (fire-and-forget simple).
- Soporte para otros proveedores de email (solo Resend).
- Cambios en el flujo de confirmacion de email de Supabase (sigue funcionando igual).
- Notificaciones para registros fallidos (solo signUp exitoso).

### Depende de

- Ninguna dependencia de codigo previa. Requiere:
  - Crear cuenta en [resend.com](https://resend.com) (plan gratuito: 3.000 emails/mes, 100/dia).
  - Verificar dominio `foodynow.com.ar` en Resend (wizard en dashboard, registros DNS).
  - Agregar `RESEND_API_KEY` y `NOTIFY_REGISTRATION_TO` en Vercel Environment Variables.

## Logica de negocio

### Flujo completo

```
Usuario completa form en /auth/sign-up?utm_source=instagram&utm_campaign=julio2026
  ↓
supabase.auth.signUp({ email, password, options: { data: { ..., utm_source, utm_medium, ... } } })
  ↓
signUp() exitoso → toast.success("Cuenta creada!")
  ↓
fetch(POST /api/admin/notify-registration) con AccessToken del usuario nuevo
  ↓ (fire-and-forget, no bloquea la UI)
Endpoint valida Bearer token contra supabase.auth.getUser()
  ↓
Si token valido → Resend.emails.send({ from, to, subject, html })
  ↓
Si falla el envio → console.error() (no rompe nada)
  ↓
Usuario avanza a pantalla "Revisa tu email" como siempre
```

### Captura de UTMs

```typescript
// En app/auth/sign-up/page.tsx, al montar el componente (useState lazy init):
const [utm] = useState(() => {
  if (typeof window === "undefined") return {}
  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_content: params.get("utm_content") || undefined,
    utm_term: params.get("utm_term") || undefined,
  }
})
```

### Persistencia en Supabase metadata

```typescript
// Dentro de signUp() options.data:
data: {
  first_name: firstName,
  last_name: lastName,
  full_name: `${firstName} ${lastName}`.trim(),
  ...utm,  // se esparcen solo si tienen valor
}
```

### Validacion del endpoint

```typescript
// POST /api/admin/notify-registration
const authHeader = req.headers.get("authorization")
if (!authHeader?.startsWith("Bearer ")) {
  return Response.json({ error: "Missing authorization" }, { status: 401 })
}

const token = authHeader.slice(7)
const adminClient = createAdminClient()
const { data: { user }, error } = await adminClient.auth.getUser(token)

if (error || !user) {
  return Response.json({ error: "Invalid token" }, { status: 401 })
}
```

### Envio del email (fire-and-forget)

```typescript
try {
  await resend.emails.send({
    from: "FoodyNow <noreply@foodynow.com.ar>",
    to: NOTIFY_REGISTRATION_TO.split(",").map(e => e.trim()),
    subject: `Nuevo registro: ${firstName} ${lastName}`,
    html: registrationTemplate({ firstName, lastName, email, utm }),
  })
} catch (err) {
  console.error("[notify-registration] Failed to send email:", err)
}
```

### Template del email

```typescript
function registrationTemplate({ firstName, lastName, email, utm }: {
  firstName: string
  lastName: string
  email: string
  utm: Record<string, string | undefined>
}): string {
  const h = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

  const rows = [
    ["Nombre", `${h(firstName)} ${h(lastName)}`],
    ["Email", h(email)],
    ["Fecha", new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })],
    ["Campaign", utm.utm_campaign || "N/D"],
    ["Source", utm.utm_source || "N/D"],
    ["Medium", utm.utm_medium || "N/D"],
    ["Content", utm.utm_content || "N/D"],
    ["Term", utm.utm_term || "N/D"],
  ]

  return `
    <h2>Nuevo registro en FoodyNow</h2>
    <table>
      ${rows.map(([label, value]) =>
        `<tr><td><strong>${h(label)}</strong></td><td>${value}</td></tr>`
      ).join("")}
    </table>
  `.trim()
}
```

## Archivos a crear o modificar

### Nuevos

- `app/api/admin/notify-registration/route.ts` — endpoint POST, valida token, envia email via Resend.
- `lib/email/registration-template.ts` — funcion que genera el HTML del email con escape XSS.

### Modificar

- `app/auth/sign-up/page.tsx` — agregar captura de UTMs (useState lazy init), pasar UTMs a `options.data` del signUp(), agregar fetch a notify-registration post-signUp con manejo de error silencioso.

### Variables de entorno (.env.local + Vercel)

- `RESEND_API_KEY` — API key del dashboard de Resend.
- `NOTIFY_REGISTRATION_TO` — emails separados por coma (ej: `tucorreo@gmail.com,compañero@correo.com`).

### No tocar

- `proxy.ts` — ya excluye `/api` del manejo de subdominios.
- `lib/supabase/admin.ts` — ya existe y funciona.
- `lib/supabase/client.ts` — no requiere cambios.
- `ARCHITECTURE.md` — no requiere actualizacion (no cambia el modelo de datos ni la arquitectura general).

## Criterio de done

### Quality gate

- [x] `pnpm build` sin errores
- [x] `pnpm lint` sin errores
- [x] Sin errores en consola del browser al completar registro
- [x] Sin errores en logs de Vercel al ejecutar el endpoint

### Smoke tests (manual, en local con pnpm dev)

- [x] **Happy path**: abrir `http://localhost:3000/auth/sign-up?utm_source=instagram&utm_campaign=julio2026&utm_medium=cpc`, completar registro con un email real.
- [x] El toast "Cuenta creada!" aparece normalmente.
- [x] Ambos destinatarios en `NOTIFY_REGISTRATION_TO` reciben el email.
- [x] El email contiene: nombre completo, email, fecha/hora en AR, y los 3 UTMs (source=instagram, medium=cpc, campaign=julio2026).
- [x] El usuario recibe el email de confirmacion de Supabase normalmente y puede confirmar.
- [x] Despues de confirmar, el usuario puede loguearse y completar onboarding.
- [x] **Anti-abuso**: `curl -X POST http://localhost:3000/api/admin/notify-registration` sin header → 401.
- [x] `curl -X POST -H "Authorization: Bearer invalid" http://localhost:3000/api/admin/notify-registration` → 401.
- [x] **Sin UTMs**: registro sin query params, el email muestra "N/D" en todos los campos UTM.
- [x] **XSS prevention**: registrar con `?utm_source=<script>alert(1)</script>`, verificar que el email muestra el texto escapado (`&lt;script&gt;...`), no ejecuta nada.
- [x] **Fallo de Resend no rompe sign-up**: si `RESEND_API_KEY` es invalida, el registro del usuario se completa igual y no ve ningun error.

## Notas para el agente

**Accion manual prerequisito — debe hacerse antes de escribir codigo:**
1. Crear cuenta en [resend.com](https://resend.com) con el email del admin.
2. En Resend dashboard → Add domain → `foodynow.com.ar` → seguir wizard para agregar registros DNS (DKIM + SPF). Esperar propagacion (~10 min).
3. Obtener `RESEND_API_KEY` del dashboard de Resend.
4. Agregar `RESEND_API_KEY` y `NOTIFY_REGISTRATION_TO` en Vercel → Project Settings → Environment Variables (y en `.env.local` para desarrollo).

**Fire-and-forget**: el fetch al endpoint despues del signUp() se hace con await pero dentro del try/catch del signUp(). Si el fetch falla (timeout, network error), el catch captura el error y el usuario no se entera. El signUp() ya fue exitoso.

**Seguridad del endpoint**: el AccessToken del usuario recien creado es valido por corto tiempo (depende de config de Supabase). Un atacante externo sin acceso a la sesion del usuario no tiene el token, por lo que no puede disparar emails falsos. Es una proteccion razonable para empezar.

**Resend free tier**: 3.000 emails/mes, 100/dia. Aun con 50 registros/dia (muy optimista para el inicio de campana publicitaria), estamos al 50% del limite diario.

**Dominio de prueba**: hasta que los registros DNS propaguen, Resend permite enviar desde `noreply@onresend.com` como testing. El agente debe configurar primero con el dominio de prueba para validar el flujo, y luego cambiar a `noreply@foodynow.com.ar` una vez que los DNS esten verificados.

**Diferencia con Supabase Auth email**: el email de confirmacion que recibe el usuario lo envia Supabase (no Resend). Nosotros solo enviamos el email de notificacion interna. Ambos son independientes.

## Al terminar

- Verificar el criterio de done completo.
- No hacer commit ni push (el usuario planea otra unidad antes de implementar esta).
