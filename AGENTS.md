# Notas para agentes — SO Interactivo (UTN FRBA)

Astro (SSG) + Tailwind v4 + TypeScript en **JS plano, sin React**. Sin backend: todo se genera en build.
Arquitectura derivada de [alg0.dev](https://github.com/midudev/alg0.dev) (steps + playback + visualizadores DOM).

**Antes de tocar código, leé el brain:** `docs/brain/Home.md` → MOC del área → 1–3 notas.
Comentarios en el código: 1–2 renglones. El porqué largo va al brain.
Skill del repo: `.claude/skills/project-brain/` (cómo leer/mantener el brain). Antes de commitear:
`python .claude/skills/project-brain/scripts/check_comentarios.py --staged`.

## Comandos

| Comando       | Qué hace                      |
| ------------- | ----------------------------- |
| `pnpm dev`    | servidor de desarrollo        |
| `pnpm build`  | build estático a `dist/`      |
| `pnpm test`   | tests de simuladores (vitest) |
| `pnpm check`  | chequeo de tipos de Astro     |
| `pnpm format` | prettier                      |

## Reglas

- DOM: usar `$` / `$$` de `@lib/dom`, no `querySelector` crudo.
- Colores: **solo tokens** (`bg-surface`, `text-fg`, `border-line`, `var(--p1)`…) definidos en
  `src/styles/global.css`. Nunca hex fijo en componentes: rompe el modo claro/oscuro.
- Contenido (teoría y enunciados) en markdown bajo `src/content/`; el schema está en `src/content.config.ts`.
- Simuladores = funciones puras en `src/lib/simuladores/<tipo>/` con tests. Nada de DOM ahí.
- Visuales del sitio = SVG propio (bloques `grafo` y `diagrama` en markdown). **Mermaid solo en `docs/brain/`.**
- Nunca commitear PDFs de la cátedra ni libros (`*.pdf` está en `.gitignore`).
- Idioma de UI, contenido y código de dominio: español.
