#!/usr/bin/env python3
"""Encuentra los brains de un workspace, decide cual es el indicado y matchea keywords.

Uso:
    python brain_find.py [--root DIR] [--for PATH] [kw1 kw2 ...]

    --root  raiz donde buscar brains (default: cwd)
    --for   archivo o carpeta que vas a tocar; rutea al brain mas cercano
    kw*     palabras clave a matchear contra titulo, aliases, tags y H1 de cada nota

Solo stdlib. Si algo falla, el fallback es Glob + Grep nativos (ver SKILL.md).
"""
import argparse
import os
import re
import sys
import unicodedata

BRAIN_DIR_NAMES = {"brain", ".brain", "vault", "cerebro"}
# Prefijos: cubre los vaults con sufijo de alcance (brain-proteus, brain-pupo-ajolote).
BRAIN_DIR_PREFIXES = ("brain-", "brain_", ".brain-", "vault-", "cerebro-")


def is_brain_dir(name):
    n = norm(name)
    return n in BRAIN_DIR_NAMES or n.startswith(BRAIN_DIR_PREFIXES)
SKIP_DIRS = {
    ".git", "node_modules", "dist", "build", "out", "coverage", "vendor",
    ".venv", "venv", "__pycache__", "target", ".next", ".nuxt", ".angular",
    "bin", "obj", ".idea", ".gradle",
}
MAX_DEPTH = 6


def norm(s):
    """minusculas sin acentos, para que 'notificacion' matchee 'notificación'."""
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower()


def find_brains(root):
    brains = []
    root = os.path.abspath(root)
    for dirpath, dirnames, filenames in os.walk(root):
        depth = dirpath[len(root):].count(os.sep)
        if depth >= MAX_DEPTH:
            dirnames[:] = []
            continue
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        if is_brain_dir(os.path.basename(dirpath)):
            notes = []
            for sub, subdirs, subfiles in os.walk(dirpath):
                subdirs[:] = [d for d in subdirs if d not in SKIP_DIRS]
                notes += [os.path.join(sub, f) for f in subfiles if f.lower().endswith(".md")]
            if notes:
                brains.append({"root": dirpath, "notes": notes})
                dirnames[:] = []  # no anidar brains
    return brains


def read_frontmatter(path):
    """Devuelve (dict de campos crudos, primer H1). Parser de una pasada, sin yaml."""
    fields, h1, in_fm = {}, "", False
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            for i, line in enumerate(fh):
                if i > 60:
                    break
                stripped = line.strip()
                if i == 0 and stripped == "---":
                    in_fm = True
                    continue
                if in_fm:
                    if stripped == "---":
                        in_fm = False
                        continue
                    m = re.match(r"^([a-zA-Z_]+)\s*:\s*(.*)$", stripped)
                    if m:
                        fields[m.group(1).lower()] = m.group(2).strip()
                elif stripped.startswith("# ") and not h1:
                    h1 = stripped[2:].strip()
    except OSError:
        pass
    return fields, h1


def listify(raw):
    return [p.strip() for p in (raw or "").strip("[]").split(",") if p.strip()]


def container_of(brain_root):
    """El repo/carpeta que 'dueña' al brain: sube por docs/ hasta el contenedor real."""
    container = os.path.dirname(brain_root)
    while os.path.basename(container).lower() in ("docs", "doc") and os.path.dirname(container) != container:
        container = os.path.dirname(container)
    return container


def as_path(s):
    return norm(s).replace("\\", "/").rstrip("/")


def pick_indicado(brains, target):
    """El brain indicado: alcance declarado, si no proximidad (ancestro mas cercano)."""
    if not target:
        return None
    ntarget = as_path(os.path.abspath(target))

    scoped = []
    for b in brains:
        # `alcance` puede declarar VARIOS globs ("a/** + b/**", "a/*, b/*"): se evalua cada uno.
        for piece in re.split(r"[+,]", (b.get("alcance") or "").strip('"\'')):
            stem = as_path(piece.replace("**", "").replace("*", "").strip()).strip("/ ")
            if stem and stem in ntarget:
                scoped.append((len(stem), b))
    if scoped:
        return max(scoped, key=lambda t: t[0])[1]

    # proximidad: el contenedor del brain (repo) que sea ancestro mas profundo del target
    best, best_len = None, -1
    for b in brains:
        container = as_path(b["container"])
        if ntarget.startswith(container) and len(container) > best_len:
            best, best_len = b, len(container)
    return best


def scope_de_busqueda(brains, indicado):
    """El indicado + los brains que lo contienen (workspace compartido): contexto que suma.

    Un brain de nivel superior cubre varios repos, asi que sus notas son contexto valido para
    cualquier tarea de abajo. Los brains hermanos (otro repo) quedan afuera a proposito.
    """
    if not indicado:
        return brains
    ind = as_path(indicado["container"])
    return [b for b in brains
            if b is indicado or ind.startswith(as_path(b["container"]))]


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("keywords", nargs="*")
    ap.add_argument("--root", default=os.getcwd())
    ap.add_argument("--for", dest="target", default=None)
    ap.add_argument("--top", type=int, default=8)
    args = ap.parse_args()

    brains = find_brains(args.root)
    if not brains:
        print("BRAINS: 0")
        print("No hay brain en %s." % os.path.abspath(args.root))
        print("NEXT: resolve la tarea normalmente. Menciona una vez que no hay brain y ofrece crearlo")
        print("      (references/crear-brain.md). No lo crees sin luz verde.")
        return 0

    for b in brains:
        fm, _ = read_frontmatter(os.path.join(b["root"], "Home.md"))
        b["alcance"] = fm.get("alcance", "")
        b["has_home"] = os.path.isfile(os.path.join(b["root"], "Home.md"))
        b["container"] = container_of(b["root"])
        b["label"] = os.path.basename(b["container"]) or b["root"]

    root = os.path.abspath(args.root)

    def rel(p):
        try:
            return os.path.relpath(p, root)
        except ValueError:
            return p

    print("ROOT: %s" % root)
    print("BRAINS: %d" % len(brains))
    for i, b in enumerate(brains, 1):
        print("  [%d] %s  (notas: %d%s%s)" % (
            i, rel(b["root"]), len(b["notes"]),
            ", alcance: " + b["alcance"] if b["alcance"] else "",
            "" if b["has_home"] else ", SIN Home.md",
        ))

    indicado = pick_indicado(brains, args.target)
    if args.target:
        if indicado:
            print("\nINDICADO para %s:  %s" % (rel(os.path.abspath(args.target)), rel(indicado["root"])))
        else:
            print("\nINDICADO para %s: ambiguo." % rel(os.path.abspath(args.target)))
            print("  Para leer, mira los dos (es barato). Para escribir, pregunta cual.")
    elif len(brains) > 1:
        print("\nINDICADO: pasa --for <archivo-que-vas-a-tocar> para rutear.")

    if not args.keywords:
        print("\nNEXT: paso keywords para matchear notas, o lee Home.md para orientarte.")
        return 0

    kws = [norm(k) for k in args.keywords]
    hits = []
    search = scope_de_busqueda(brains, indicado)
    if indicado and len(search) > 1:
        print("  (+ contexto compartido de: %s)" % ", ".join(
            b["label"] for b in search if b is not indicado))
    for b in search:
        for path in b["notes"]:
            fm, h1 = read_frontmatter(path)
            name = os.path.basename(path)[:-3]
            aliases = listify(fm.get("aliases"))
            tags = listify(fm.get("tags"))
            haystacks = [
                (norm(name), 3),
                (norm(" ".join(aliases)), 3),
                (norm(h1), 2),
                (norm(" ".join(tags)), 1),
            ]
            score = sum(w for kw in kws for hay, w in haystacks if kw in hay)
            if score:
                hits.append((score, name, path, aliases, b))

    if not hits:
        print("\nMATCHES (%s): 0" % ", ".join(args.keywords))
        print("NEXT: lee Home.md del brain indicado; si tampoco, cae al codigo.")
        print("      Si la tarea deja algo reutilizable, esa nota falta: escribila al terminar.")
        return 0

    hits.sort(key=lambda t: (-t[0], t[1]))
    multi = len({id(h[4]) for h in hits}) > 1
    print("\nMATCHES (%s): %d" % (", ".join(args.keywords), len(hits)))
    for score, name, path, aliases, b in hits[:args.top]:
        rel = os.path.relpath(path, b["root"])
        if multi:
            rel = "%s :: %s" % (b["label"], rel)
        extra = "  aliases: " + ", ".join(aliases[:6]) if aliases else ""
        print("  [%d] %s  ->  %s%s" % (score, name, rel, extra))
    if len(hits) > args.top:
        print("  ... y %d mas" % (len(hits) - args.top))
    print("\nNEXT: abri SOLO las 1-3 de arriba y segui sus [[wikilinks]]. No leas el vault entero.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
