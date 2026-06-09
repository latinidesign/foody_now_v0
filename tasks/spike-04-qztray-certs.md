# tasks/spike-04-qztray-certs.md

## Objetivo

Generar certificados criptográficos propios (Root CA + signing) con Node.js crypto nativo y un endpoint server-side para firma de requests de QZ Tray. Esto elimina la dependencia del modelo de pago de QZ Industries mediante el mecanismo `override.crt`. Después de este spike, la impresión automática funciona en producción sin certificados de desarrollo.

## Contexto para el agente

Este spike existe sobre los siguientes ya completos:

- `02-auto-print-orders.md` — implementó el hook `useQzTray` con firma client-side hardcodeada (`DEV_CERT` + `DEV_KEY`) y la lógica de auto-impresión en `orders-table.tsx`.
- `03-qztray-onboarding.md` — implementó el componente `QzTrayInstructions` con pasos de instalación para el owner.

El hook `useQzTray` en `hooks/use-qz-tray.ts` actualmente usa:
- `setCertificatePromise` con `DEV_CERT` hardcodeado
- `setSignaturePromise` con `DEV_KEY` hardcodeada, firma via `crypto.subtle` en el browser

Estos certificados de desarrollo solo funcionan en la máquina donde se generaron. En producción, cada owner necesita que QZ Tray confíe en nuestro certificado, lo cual se logra con el mecanismo `override.crt` documentado por QZ Tray.

## Prerequisito

- `02-auto-print-orders.md` completo (el hook `useQzTray` existe y está en uso)
- `03-qztray-onboarding.md` completo (el componente `QzTrayInstructions` existe)

## Scope estricto

**Incluye:**
- Script `scripts/generate-qz-certs.ts` que genera Root CA autofirmada + signing certificate usando `crypto` de Node.js (RSA 2048-bit, SHA-512, PKCS#8 para clave privada, x509 para certificados)
- Endpoint `POST /api/qz/sign` que recibe `toSign`, firma con la clave privada del servidor, devuelve firma base64
- Endpoint `GET /api/qz/certificate` que sirve el certificado público para `setCertificatePromise`
- Modificación de `hooks/use-qz-tray.ts` para usar server-side signing en producción (los endpoints arriba) manteniendo la firma client-side hardcodeada (`DEV_CERT`/`DEV_KEY`) solo para desarrollo (`process.env.NODE_ENV === 'development'`)
- Archivo `override.crt` generado por el script, referenciado en las instrucciones de instalación
- Actualización de `QzTrayInstructions` con paso adicional sobre colocar `override.crt` en el directorio de QZ Tray
- Variables de entorno: `QZ_PRIVATE_KEY` y `QZ_CERTIFICATE`

**No incluye:**
- Compilación de QZ Tray desde source (se prueba el binario oficial primero; si tiene restricciones, se aborda en otro spike)
- Certificados por tienda (un solo par global para toda la plataforma)
- Rate limiting en el endpoint de firma
- Rotación automática ni expiración de certificados
- Testing formal contra el binario oficial de QZ Tray con su restricción de pago
- Cambios en la lógica de impresión ni en `orders-table.tsx`

## Estructura de archivos

```
scripts/generate-qz-certs.ts               # Script de generación (uso único, no parte del runtime)
app/api/qz/sign/route.ts                   # POST: recibe { toSign }, devuelve { signature }
app/api/qz/certificate/route.ts            # GET: devuelve el certificado público en texto plano
hooks/use-qz-tray.ts                       # MODIFICAR: server-side signing en prod, client-side solo en dev
components/admin/qztray-instructions.tsx   # MODIFICAR: agregar paso de override.crt
```

Sin nuevas dependencias de npm. `crypto` es nativo de Node.js. `tsx` ya está disponible para ejecutar el script.

## Script de generación de certificados

```typescript
// scripts/generate-qz-certs.ts
// Se ejecuta UNA SOLA VEZ manualmente: npx tsx scripts/generate-qz-certs.ts
// Genera tres archivos en el directorio raíz (agregar a .gitignore):
//   override.crt        — Root CA pública (el owner la coloca en C:\Program Files\QZ Tray\)
//   private-key.pem     — Clave privada de firma (cargar como QZ_PRIVATE_KEY en env vars)
//   signing-cert.pem    — Certificado público de firma (cargar como QZ_CERTIFICATE en env vars)

// Usa crypto nativo de Node.js:
// - crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }) para el par de firma
// - crypto.createSign('SHA512') / crypto.createVerify('SHA512') para auto-firmar la Root CA
// - Formato de salida: PEM (PKCS#8 para clave privada, x509 para certificados)
// - La Root CA se auto-firma; el signing cert se firma con la Root CA

// Estructura del certificado x509:
// - Subject/Issuer de Root CA: CN=FoodyNow Root CA, O=FoodyNow, C=AR
// - Subject del signing cert: CN=FoodyNow Printing, O=FoodyNow, C=AR
// - Validez: 10 años desde la fecha de generación
// - Key Usage: digitalSignature para el signing cert
```

## Endpoint POST /api/qz/sign

```typescript
// app/api/qz/sign/route.ts
// Recibe JSON: { toSign: string }
// Firma usando crypto.createSign('SHA512') con QZ_PRIVATE_KEY del entorno
// Devuelve JSON: { signature: string }  // base64
// Si falta QZ_PRIVATE_KEY → 500 con mensaje descriptivo
// Si falta toSign en el body → 400
```

## Endpoint GET /api/qz/certificate

```typescript
// app/api/qz/certificate/route.ts
// Devuelve el certificado público en texto plano (Content-Type: text/plain)
// Lee de la variable de entorno QZ_CERTIFICATE
// Sin autenticación: QZ Tray lo necesita para validar la conexión
```

## Modificación de use-qz-tray.ts

El hook debe bifurcar su comportamiento según el entorno:

```typescript
// En DEVELOPMENT (process.env.NODE_ENV === 'development'):
//   - Mantener DEV_CERT y DEV_KEY hardcodeados
//   - Mantener setCertificatePromise y setSignaturePromise actuales
//   - Comportamiento idéntico al actual

// En PRODUCTION:
//   - Eliminar DEV_CERT y DEV_KEY del bundle (usar tree-shaking con condición)
//   - setCertificatePromise: hacer fetch('GET /api/qz/certificate')
//   - setSignaturePromise: hacer fetch('POST /api/qz/sign', { body: JSON.stringify({ toSign }) })
//   - El resto del hook (connectOnce, print, retry) no cambia
```

La detección de entorno debe hacerse de forma que webpack/Next.js pueda tree-shakear las constantes de desarrollo:

```typescript
const isDev = process.env.NODE_ENV === 'development'

// Las constantes DEV_CERT y DEV_KEY solo se definen si isDev
// En producción, setupSigning usa fetch en lugar de crypto.subtle
```

## Modificación de QzTrayInstructions

Agregar un paso adicional después del paso 4 existente:

```
Paso 4.5 (nuevo): Descargá el archivo override.crt desde [URL] y copialo a
C:\Program Files\QZ Tray\override.crt. Esto permite que QZ Tray confíe en
nuestra aplicación para imprimir sin diálogos de confirmación.
```

El archivo `override.crt` debe servirse como un asset estático accesible públicamente. Opciones:
- Colocarlo en `public/override.crt` (servido automáticamente por Next.js en la raíz)
- O link directo a un endpoint que lo sirva

La más simple es `public/override.crt` — se accede como `https://foodynow.com.ar/override.crt`.

## Restricciones específicas de esta unidad

- `crypto` de Node.js es nativo, no requiere dependencias.
- La clave privada NUNCA debe aparecer en el bundle del cliente en producción. Verificar con `pnpm build` que `DEV_KEY` no está en los chunks.
- El endpoint `/api/qz/sign` no tiene rate limiting (decisión consciente: la firma solo es útil con QZ Tray corriendo localmente).
- Los archivos generados por el script (`override.crt`, `private-key.pem`, `signing-cert.pem`) deben agregarse a `.gitignore`.
- No modificar `orders-table.tsx` ni la lógica de impresión.
- No crear un componente `QzTrayInstructions` nuevo — solo modificar el existente agregando un paso.

## Tests

No hay tests unitarios automatizados en este spike. La firma criptográfica es un passthrough a `crypto.createSign` de Node.js, cuyo comportamiento está testeado por el runtime.

Criterios procedimentales que reemplazan los tests:

1. **Script de generación**: ejecutar `npx tsx scripts/generate-qz-certs.ts` → produce tres archivos no vacíos (`override.crt`, `private-key.pem`, `signing-cert.pem`).
2. **Firma y verificación**: firmar un string con `crypto.createSign` usando `private-key.pem` y verificar con `crypto.createVerify` usando `signing-cert.pem` → la verificación debe dar `true`.
3. **Certificado es x509 válido**: `crypto.X509Certificate` puede parsear el output sin errores.
4. **Root CA es autofirmada**: verificar que el subject y el issuer de la Root CA son idénticos.

## Criterio de done

### Quality gate
- [ ] `pnpm build` sin errores
- [ ] `tsc --noEmit` sin nuevos errores de tipos
- [ ] El script `generate-qz-certs.ts` se ejecuta con `npx tsx` y produce los 3 archivos
- [ ] `POST /api/qz/sign` con `{ "toSign": "test" }` devuelve 200 con una signature base64 no vacía
- [ ] `GET /api/qz/certificate` devuelve 200 con el certificado en texto plano
- [ ] En el bundle de producción, `DEV_KEY` no aparece (verificar con grep en `.next/static/chunks/`)
- [ ] `override.crt` se sirve como asset estático desde `public/`

### Smoke test
- [ ] Ejecutar `npx tsx scripts/generate-qz-certs.ts` → produce los 3 archivos
- [ ] Copiar el contenido de `private-key.pem` a env var `QZ_PRIVATE_KEY`
- [ ] Copiar el contenido de `signing-cert.pem` a env var `QZ_CERTIFICATE`
- [ ] Copiar `override.crt` a `public/override.crt`
- [ ] Iniciar el servidor dev: `pnpm dev`
- [ ] `curl -X POST localhost:3000/api/qz/sign -H "Content-Type: application/json" -d '{"toSign":"hello"}'` → `{ "signature": "<base64>" }`
- [ ] `curl localhost:3000/api/qz/certificate` → contenido del certificado
- [ ] `curl localhost:3000/override.crt` → archivo descargable (Root CA pública)
- [ ] En `/admin/orders`, abrir consola del browser → no hay errores de firma al conectar con QZ Tray
- [ ] `QzTrayInstructions` muestra el nuevo paso de `override.crt`

## Notas para el agente

**Sobre el formato x509 con crypto nativo**: Node.js `crypto` no tiene una API directa para crear certificados x509. La forma de generar certificados x509 con crypto nativo es usar `crypto.X509Certificate` solo para parseo, no para creación. Para crear un certificado x509 desde cero se necesita:

1. Generar el par de claves con `crypto.generateKeyPairSync('rsa', ...)`
2. Construir el certificado x509 manualmente usando la API de bajo nivel o usar el enfoque de "self-signed certificate via `crypto.createSign` + ASN.1 manual"

Alternativa reconocida: usar el helper `createSelfSignedCertificate` que no existe nativamente. Enfoque pragmático:

- Usar `crypto.generateKeyPairSync` para generar el par RSA
- Construir la estructura ASN.1 del certificado x509 manualmente (es un formato binario estándar)
- Firmarlo con `crypto.createSign('SHA512')`

O, más simple aún: **generar los certificados con `openssl` mediante `child_process.execSync`** si `openssl` está disponible, con fallback a un mensaje que indique instalarlo. Pero esto contradice la decisión de usar solo Node.js crypto.

**Enfoque final decidido**: Usar `crypto.generateKeyPairSync` para el par de claves, y construir el certificado x509 usando el helper `pem` de bajo nivel. Si esto resulta demasiado complejo con crypto nativo, el script puede usar `child_process.execSync('openssl ...')` con detección previa de disponibilidad y mensaje claro si no está instalado.

**Sobre el tree-shaking de DEV_CERT/DEV_KEY**: Usar `if (process.env.NODE_ENV === 'development')` no es suficiente para tree-shaking en todos los bundlers. La forma segura es usar una variable de entorno next.js con prefijo `NEXT_PUBLIC_` o usar `typeof window !== 'undefined'` con una condición que webpack pueda evaluar en build time. Alternativa: mantener las constantes pero marcarlas con comentarios de que son solo para desarrollo y que en producción el endpoint del servidor las reemplaza. La verificación final es `grep -r "PRIVATE KEY" .next/static/chunks/` que no debe encontrar resultados.

## Al terminar
- Verificar el criterio de done completo
- Commit en rama `feature/qztray-certs` con mensaje `spike-04: certificados propios y server-side signing para QZ Tray`
- Actualizar CONTEXT.md: qué se hizo, decisiones tomadas durante implementación, próxima tarea
