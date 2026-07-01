# tasks/07-eslint-debt-cleanup.md

## Objetivo

Cerrar la deuda de lint que quedó al descubierto al migrar `pnpm lint` a ESLint flat config (commit `af83443`). La deuda se resuelve en **3 commits `chore:` separados y pusheados uno por uno**.

## Estado de partida (verificado)

`pnpm lint` reporta **211 errores / 152 warnings** (363 problemas). Solo **4 errores** son auto-corregibles con `--fix` (todos `prefer-const`).

| Categoría | Count | Estrategia |
|---|---|---|
| `@typescript-eslint/no-explicit-any` (error) | 174 | Commit 2: **deshabilitar regla** |
| `@typescript-eslint/no-unused-vars` (warning) | 118 | Commit 3: **limpiar manualmente** |
| `react/no-unescaped-entities` (error) | 28 | Commit 3: **escapar con `&quot;`** |
| `@next/next/no-img-element` (warning) | 26 | Commit 2: **deshabilitar regla** |
| `react-hooks/exhaustive-deps` (warning) | 7 | **No tocar en este batch** (suelen ser bugs reales que requieren refactor) |
| `@typescript-eslint/no-require-imports` (error) | 5 | Commit 3: **renombrar `.js` → `.cjs`** + override en config |
| `prefer-const` (error) | 4 | Commit 1: **auto-fix de `pnpm exec eslint . --fix`** (ya en working tree) |
| `import/no-anonymous-default-export` (warning) | 1 | Commit 3: **asignar a const** en `eslint.config.mjs` (es el propio flat config) |

## Scope estricto

**Incluye (3 commits):**
1. `chore: apply eslint --fix for prefer-const` — output de la herramienta, sin juicio humano
2. `chore: disable no-explicit-any and no-img-element rules` — cambio de config, silencia 200 issues
3. `chore: clean up remaining lint debt` — refactor manual del resto

**No incluye:**
- Tipar los 174 `any` (decisión: deshabilitar la regla por la desprolijidad acumulada)
- Migrar `<img>` a `next/image` (decisión: deshabilitar por el riesgo de romper layouts)
- Resolver los 7 `exhaustive-deps` (queda como tech debt para un task futuro; son dependencias intencionalmente omitidas en su mayoría)
- Agregar dependencias nuevas
- Cambiar la configuración de Prettier, TS, o cualquier otro tool

## Plan de commits

### Commit 1 — `chore: apply eslint --fix for prefer-const`

Output de la herramienta, sin cambios manuales. Ya está aplicado en el working tree:

```
app/api/webhooks/mercadopago/route.ts (líneas 83, 121): let days → const days
lib/supabase/client.ts (línea 3):                     let client → const client
scripts/generate-qz-certs.ts (línea 23):              let v → const v
```

**Push:** commit + push directo.

### Commit 2 — `chore: disable no-explicit-any and no-img-element rules`

Modificar `eslint.config.mjs` para agregar la sección `rules`:

```js
export default [
  {
    ignores: [".next/**", "node_modules/**", "public/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-img-element": "off",
    },
  },
]
```

Resultado esperado: pasan de 207 errores / 152 warnings a 33 errores / 126 warnings (silencia 174 + 26 = 200 issues).

**Push:** commit + push directo.

### Commit 3 — `chore: clean up remaining lint debt`

Trabajo manual en 4 frentes:

**3a) 28 `no-unescaped-entities` en JSX (errors):** Reemplazar `"` literal en texto JSX por `&quot;`. Hotspot: `app/admin/help/page.tsx` (12), `components/admin/orders-table.tsx`, otros.

**3b) 5 `no-require-imports` en scripts legacy (errors):**
- `scripts/diagnose.js` → renombrar a `scripts/diagnose.cjs` (referenciado en `package.json:8,9`, actualizar ambos scripts)
- `scripts/get-payment-ids.js` → renombrar a `scripts/get-payment-ids.cjs` (no hay referencias)
- `show-mp-config.js` → renombrar a `show-mp-config.cjs` (referenciado solo en docs, no requiere cambio)
- Agregar override en `eslint.config.mjs` para permitir `require()` en archivos `.cjs`:
  ```js
  {
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  }
  ```

**3c) 118 `no-unused-vars` (warnings):** Eliminar imports muertos y variables/funciones nunca usadas. Muchos son imports de iconos de `lucide-react` (`Clock`, `AlertCircle`, etc.) o de componentes shadcn (`Card`, `CardHeader`, etc.) que quedaron en el código cuando se refactorizó la UI. Hotspots: `app/admin/profile/page.tsx` (7), `app/api/mp/callback/route.ts` (7), `app/admin/subscription/page.tsx` (7).

**3d) 1 `no-anonymous-default-export` (warning) en `eslint.config.mjs:7`:** Falso positivo de la regla sobre el propio flat config. Fix: asignar el array a una const y exportarla.

```js
const config = [
  {
    ignores: [".next/**", "node_modules/**", "public/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-img-element": "off",
    },
  },
]

export default config
```

**Resultado esperado post-Commit 3:** ~0 errores / ~7 warnings (los 7 `exhaustive-deps` que quedan como tech debt).

**Push:** commit + push directo.

## Verificación entre commits

Después de cada commit, ejecutar `pnpm lint` para confirmar que el contador baja en la cantidad esperada:

| Commit | Errores | Warnings | Delta |
|---|---|---|---|
| Inicio | 211 | 152 | — |
| 1 (auto-fix) | 207 | 152 | -4 (prefer-const) |
| 2 (disable rules) | 33 | 126 | -200 (174 any + 26 img) |
| 3 (manual cleanup) | 0 | 7 | -152 (28 entities + 118 unused + 5 require + 1 anon) |

## Restricciones específicas

- **No refactorizar código adyacente.** Solo eliminar lo que el lint marca como muerto. Si una variable parece usarse en otro archivo, dejar y consultar.
- **No agregar dependencias nuevas.** La regla `no-require-imports` se resuelve renombrando a `.cjs`, no agregando `esm-loader` ni nada similar.
- **Cero `npm install`.** Todo es solo modificación de archivos.
- **No cambiar `package.json` salvo lo necesario** (líneas 8-9 para `diagnose`/`diagnose:subdomain` si se renombra `scripts/diagnose.js` → `scripts/diagnose.cjs`).
- **El working tree debe estar limpio** al terminar el Commit 3 (excepto los 7 `exhaustive-deps` que quedan documentados como tech debt).

## Criterio de done

### Por commit
- [x] Commit 1: `git log --oneline -1` muestra el mensaje esperado; `pnpm lint` corre sin los 4 `prefer-const`
- [x] Commit 2: `pnpm lint` corre con las dos reglas deshabilitadas; counter baja ~200
- [x] Commit 3: `pnpm lint` muestra solo los 7 `exhaustive-deps` restantes; `pnpm build` no se rompe; los scripts `pnpm diagnose` y `pnpm diagnose:subdomain` siguen funcionando (renombrados a `.cjs`)

### Quality gate final
- [x] `pnpm build` sin errores
- [x] `pnpm lint` queda en ~0/7 (7 warnings de `exhaustive-deps` documentados como deuda)
- [x] Los 3 commits están en `origin/main`

## Notas para el agente

- **Por qué deshabilitar y no tipar los 174 `any`:** la memoria del proyecto indica que el codebase fue vibecodeado y tiene acoplamiento oculto. Tipar `any` adivinando los tipos reales tiene riesgo alto de romper comportamiento. El proyecto no usa `noImplicitAny` en `tsconfig.json`, así que TypeScript sigue siendo estricto con lo que está tipado.
- **Por qué deshabilitar `no-img-element`:** los `<img>` que están en el código se usan en dos contextos legítimos: (a) previsualización de imágenes subidas por el owner antes de obtener la URL final, (b) SVGs inline o data URIs donde `next/image` no aplica. Migrar a `next/image` requiere setear `width`/`height` explícitos y eso puede romper layouts responsivos si se hace mecánicamente.
- **Por qué no tocar los 7 `exhaustive-deps`:** suelen ser dependencias intencionalmente omitidas (router de Next, supabase client, etc. que son estables) o genuinos bugs que requieren refactor del useEffect. Resolverlos bien necesita leer el contexto de cada uno, no es trabajo mecánico.
- **Orden de los commits:** 1 → 2 → 3. El Commit 3 se beneficia del Commit 2 ya mergeado porque las reglas que silencia no tapan los warnings que sí corregimos (unused-vars sigue activo).

## Al terminar

- Verificar contador final con `pnpm lint`
- Documentar los 7 `exhaustive-deps` restantes en el task como "Deuda Técnica" para una iteración futura
- Sesión cerrada con `mem_session_summary` referenciando este task
