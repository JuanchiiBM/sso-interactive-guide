"""Marca los bloques de comentario de 3+ renglones que AGREGA un diff.

La regla del brain es una o dos líneas; el tercer renglón significa que eso es una nota.
Escrito para correrse antes de commitear, cuando todavía es barato mover el texto.

    python check_comentarios.py                 # working tree + archivos nuevos, contra HEAD
    python check_comentarios.py --staged        # lo que está por commitear
    python check_comentarios.py --contra main   # toda la rama
    python check_comentarios.py --repo ../otro  # otro repo

Sale con código 1 si encontró algo, así se puede encadenar.
"""

import argparse
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Un comentario abierto en casi cualquier lenguaje de llaves, más Python, SQL y markup.
INICIO = re.compile(r"^\s*(//|/\*|\*|#(?!!)|--\s|<!--)")
# Los delimitadores no son contenido: un JSDoc de dos frases no puede contar tres renglones, o el
# chequeo marca código que cumple y se lo empieza a ignorar.
ENVOLTORIO = re.compile(r"^\s*(/\*\*?|\*/|<!--|-->|///\s*</?(summary|remarks)>)\s*$")

LIMITE = 3


def bloques_agregados(diff: str):
    """(archivo, línea, renglones) por cada bloque de comentario agregado."""
    archivo = ""
    linea = 0
    corriendo: list[str] = []
    arranque = 0

    for raw in diff.split("\n"):
        if raw.startswith("+++ b/"):
            archivo = raw[6:]
            continue

        if raw.startswith("@@"):
            m = re.search(r"\+(\d+)", raw)
            linea = int(m.group(1)) if m else 0
            if len(corriendo) >= LIMITE:
                yield archivo, arranque, corriendo
            corriendo = []
            continue

        if not raw.startswith("+") or raw.startswith("+++"):
            if len(corriendo) >= LIMITE:
                yield archivo, arranque, corriendo
            corriendo = []
            # Las líneas de contexto también avanzan el contador del lado nuevo.
            if not raw.startswith("-"):
                linea += 1
            continue

        texto = raw[1:]
        if INICIO.match(texto):
            if not ENVOLTORIO.match(texto):
                if not corriendo:
                    arranque = linea
                corriendo.append(texto.rstrip())
        else:
            if len(corriendo) >= LIMITE:
                yield archivo, arranque, corriendo
            corriendo = []
        linea += 1

    if len(corriendo) >= LIMITE:
        yield archivo, arranque, corriendo


def git(cmd: list[str], ok: tuple[int, ...] = (0,)) -> str:
    """⚠️ utf-8 explícito: en Windows el default es cp1252 y un acento rompe el diff entero."""
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode not in ok:
        raise subprocess.CalledProcessError(r.returncode, cmd, r.stdout, r.stderr)
    return r.stdout


def untracked(repo: str) -> str:
    """El diff de los archivos nuevos, como si cada uno naciera de la nada."""
    salida = ""
    listado = git(["git", "-C", repo, "ls-files", "--others", "--exclude-standard"])
    for archivo in listado.splitlines():
        if not archivo.strip():
            continue
        # --no-index devuelve 1 cuando hay diferencias, que es siempre acá.
        salida += git(
            ["git", "-C", repo, "diff", "--no-index", "-U0", "--", "/dev/null", archivo],
            ok=(0, 1),
        )
    return salida


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--repo", default=".", help="raíz del repo (default: el actual)")
    ap.add_argument("--staged", action="store_true", help="solo lo que está en el index")
    ap.add_argument("--contra", metavar="REF", help="diff contra esta ref, p. ej. main")
    args = ap.parse_args()

    cmd = ["git", "-C", args.repo, "diff", "-U0"]
    if args.staged:
        cmd.append("--cached")
    if args.contra:
        cmd.append(f"{args.contra}...HEAD")

    try:
        diff = git(cmd)
        # ⚠️ Sin esto el chequeo pasa en verde justo cuando el commit estrena archivos, que es
        # cuando más comentario se escribe: `git diff` no muestra los untracked.
        if not args.staged and not args.contra:
            diff += untracked(args.repo)
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"no se pudo leer el diff: {e}", file=sys.stderr)
        return 2

    encontrados = list(bloques_agregados(diff))

    if not encontrados:
        print("Sin bloques de comentario de 3+ renglones. 👌")
        return 0

    total = sum(len(b) for _, _, b in encontrados)
    print(f"{len(encontrados)} bloque(s) de 3+ renglones, {total} renglones en total.\n")
    for archivo, linea, bloque in encontrados:
        print(f"  {archivo}:{linea}  ({len(bloque)} renglones)")
        for l in bloque[:2]:
            print(f"      {l.strip()[:96]}")
        if len(bloque) > 2:
            print(f"      … {len(bloque) - 2} renglón/es más")
        print()

    print("Cada uno es una nota del brain, no un comentario. Movelo y dejá un puntero.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
