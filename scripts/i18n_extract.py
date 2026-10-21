# -*- coding: utf-8 -*-
"""Extract Chinese UI strings from source files (excluding mock data) into scripts/i18n/strings.json."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CJK = re.compile(r"[\u4e00-\u9fff]")

MOCK_FILES = {
    "src/lib/videoStudioMocks.ts",
    "src/lib/workspaceMocks.ts",
    "src/lib/demoScenarioFlow.ts",
    "src/lib/demoScripts.ts",
    "src/lib/materialContent.ts",
    "src/lib/meetingMaterialsMocks.ts",
    "src/lib/literatureMocks.ts",
    "src/lib/imageMocks.ts",
    "src/lib/topicInsightMocks.ts",
    "src/lib/posterPlanBMocks.ts",
    "src/lib/imageStudioMocks.ts",
    "src/lib/outlineEditMock.ts",
    "src/lib/storylineMock.ts",
    "src/lib/topicInsightAgent.ts",
    "src/lib/terminologyStore.ts",
    "src/lib/terminologyCsv.ts",
    "src/lib/products.ts",
    "src/lib/brands.ts",
    "src/lib/figmaCapture.ts",
    "src/lib/editorPageAssets.ts",
    "src/app/components/pptTemplates.ts",
    "src/app/components/imageTemplates.ts",
    "src/lib/i18nDict.ts",
}


def norm_jsx(text: str) -> str:
    lines = [line.strip() for line in text.split("\n")]
    return " ".join(line for line in lines if line)


def extract(src: str):
    out = []
    i, n = 0, len(src)
    code_start = 0

    def flush_code(seg: str):
        # JSX text fragments: split by JSX delimiters
        for piece in re.split(r"[<>{}]", seg):
            if CJK.search(piece):
                t = norm_jsx(piece)
                if t:
                    out.append(("jsx", t))

    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ""
        if c == "/" and nxt == "/":
            flush_code(src[code_start:i])
            j = src.find("\n", i)
            i = n if j < 0 else j
            code_start = i
            continue
        if c == "/" and nxt == "*":
            flush_code(src[code_start:i])
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
            code_start = i
            continue
        if c in "'\"":
            # in JSX text an apostrophe may appear; treat quotes only when preceded by code-like context
            flush_code(src[code_start:i])
            q = c
            j = i + 1
            buf = []
            while j < n and src[j] != q and src[j] != "\n":
                if src[j] == "\\" and j + 1 < n:
                    buf.append(src[j : j + 2])
                    j += 2
                    continue
                buf.append(src[j])
                j += 1
            s = "".join(buf)
            if CJK.search(s):
                out.append(("str", s.replace("\\n", "\n").replace("\\'", "'").replace('\\"', '"')))
            i = j + 1
            code_start = i
            continue
        if c == "`":
            flush_code(src[code_start:i])
            j = i + 1
            parts = []
            cur = []
            idx = 0
            while j < n and src[j] != "`":
                if src[j] == "\\" and j + 1 < n:
                    esc = src[j + 1]
                    cur.append({"n": "\n", "t": " "}.get(esc, esc))
                    j += 2
                    continue
                if src[j] == "$" and j + 1 < n and src[j + 1] == "{":
                    depth = 1
                    k = j + 2
                    while k < n and depth:
                        if src[k] == "{":
                            depth += 1
                        elif src[k] == "}":
                            depth -= 1
                        elif src[k] == "`":
                            # nested template: skip to its end
                            m = src.find("`", k + 1)
                            k = m if m > 0 else k
                        k += 1
                    cur.append("{" + str(idx) + "}")
                    idx += 1
                    j = k
                    continue
                cur.append(src[j])
                j += 1
            s = "".join(cur)
            if CJK.search(s):
                out.append(("tpl" if idx else "str", s))
            i = j + 1
            code_start = i
            continue
        i += 1
    flush_code(src[code_start:n])
    return out


CODE_NOISE = re.compile(r"(\bif \(|\.test\(|\breturn\b|=>|data-edit-id|font-family|\bconst\b|\|\||&&|\bx=\"|/i\b)")
TAG = re.compile(r"<[^>]+>")


def expand(s: str):
    if TAG.search(s):
        for piece in TAG.split(s):
            piece = piece.strip()
            if CJK.search(piece):
                yield piece
        return
    yield s


def main():
    strings = {}
    for p in sorted((ROOT / "src").rglob("*")):
        if p.suffix not in (".ts", ".tsx"):
            continue
        rel = p.relative_to(ROOT).as_posix()
        if rel in MOCK_FILES:
            continue
        for kind, raw in extract(p.read_text(encoding="utf-8")):
            if CODE_NOISE.search(raw):
                continue
            for s in expand(raw):
                s = s.strip()
                if not s or len(s) > 400 or not CJK.search(s):
                    continue
                strings.setdefault(s, rel)
    target = ROOT / "scripts" / "i18n"
    target.mkdir(exist_ok=True)
    keys = sorted(strings)
    (target / "strings.json").write_text(json.dumps(keys, ensure_ascii=False, indent=0), encoding="utf-8")
    print("unique", len(keys), "templates", sum(1 for k in keys if re.search(r"\{\d+\}", k)))
    print("chars", sum(len(k) for k in keys))


if __name__ == "__main__":
    main()
