# -*- coding: utf-8 -*-
"""Merge scripts/i18n/en*.json (plus overrides.json) into src/lib/i18nDict.ts."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "scripts" / "i18n"
SLOT = re.compile(r"\{\d+\}")


def main():
    merged = {}
    for path in sorted(DIR.glob("en*.json")):
        merged.update(json.loads(path.read_text(encoding="utf-8")))
    overrides = DIR / "overrides.json"
    if overrides.exists():
        merged.update(json.loads(overrides.read_text(encoding="utf-8")))
    keys = json.loads((DIR / "strings.json").read_text(encoding="utf-8"))
    missing = [k for k in keys if k not in merged]
    bad = [k for k, v in merged.items() if sorted(SLOT.findall(k)) != sorted(SLOT.findall(v))]
    for k in bad:
        merged.pop(k)
    body = ",\n".join(f"  {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)}" for k, v in sorted(merged.items()))
    out = (
        "/** 由 scripts/i18n_build.py 生成：界面中文文案 → 英文 */\n"
        "export const EN_DICT: Record<string, string> = {\n" + body + ",\n};\n"
    )
    (ROOT / "src" / "lib" / "i18nDict.ts").write_text(out, encoding="utf-8")
    print("entries", len(merged), "missing", len(missing), "bad-slots", len(bad))
    for k in missing[:20]:
        print("  missing:", k)


if __name__ == "__main__":
    main()
