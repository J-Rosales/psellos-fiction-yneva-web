#!/usr/bin/env python3
from __future__ import annotations
import argparse
from pathlib import Path


def pascal(name: str) -> str:
    return "".join(part.capitalize() for part in name.replace("_", "-").split("-") if part)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--name", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--template", default="skills/mui-view-scaffold-factory/assets/view.template.tsx")
    args = p.parse_args()

    name = args.name.strip()
    view_pascal = pascal(name)
    title = " ".join(part.capitalize() for part in name.replace("_", "-").split("-") if part)

    template = Path(args.template).read_text(encoding="utf-8")
    text = template.replace("{{VIEW_NAME_PASCAL}}", view_pascal).replace("{{VIEW_NAME_TITLE}}", title)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{name}.tsx"
    out_file.write_text(text, encoding="utf-8")
    print(out_file)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())