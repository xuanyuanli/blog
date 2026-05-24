#!/usr/bin/env python3
"""Blog 仓库 DOCX 工具：读文本、解包/打包（调用 Claude docx skill 脚本）。"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REQUIREMENTS = SCRIPT_DIR / "requirements.txt"

DEFAULT_SKILL_OFFICE = Path.home() / ".claude" / "skills" / "docx" / "scripts" / "office"


def skill_office_dir() -> Path:
    env = os.environ.get("DOCX_SKILL_OFFICE")
    if env:
        return Path(env).expanduser().resolve()
    return DEFAULT_SKILL_OFFICE


def find_pandoc() -> str | None:
    return shutil.which("pandoc")


def cmd_setup(_: argparse.Namespace) -> int:
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "-r", str(REQUIREMENTS)]
    )
    office = skill_office_dir()
    skill_req = office.parent.parent / "requirements.txt"
    if skill_req.is_file():
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-r", str(skill_req)]
        )
    print("Python 依赖已安装。")
    if find_pandoc():
        print(f"pandoc: {find_pandoc()}")
    else:
        print("pandoc 未在 PATH 中，请安装: winget install JohnMacFarlane.Pandoc")
    if office.is_dir():
        print(f"skill office: {office}")
    else:
        print(f"警告: 未找到 skill 目录 {office}")
    return 0


def cmd_read(args: argparse.Namespace) -> int:
    src = Path(args.input).resolve()
    if not src.is_file():
        print(f"文件不存在: {src}", file=sys.stderr)
        return 1

    out = Path(args.output).resolve() if args.output else src.with_suffix(".md")

    pandoc = find_pandoc()
    if pandoc:
        media_dir = out.parent / "media"
        media_dir.mkdir(parents=True, exist_ok=True)
        subprocess.check_call(
            [
                pandoc,
                "--track-changes=all",
                f"--extract-media={media_dir}",
                str(src),
                "-o",
                str(out),
            ]
        )
        print(f"已导出: {out}")
        if any(media_dir.glob("*")):
            print(f"图片目录: {media_dir}")
        return 0

    try:
        from docx import Document
    except ImportError:
        print("请运行: python scripts/docx/docx.py setup", file=sys.stderr)
        return 1

    doc = Document(str(src))
    lines = [p.text for p in doc.paragraphs if p.text.strip()]
    out.write_text("\n\n".join(lines), encoding="utf-8")
    print(f"已导出（python-docx，无 pandoc）: {out}")
    return 0


def _run_office_script(script: str, script_args: list[str]) -> int:
    office = skill_office_dir()
    script_path = office / script
    if not script_path.is_file():
        print(
            f"未找到 {script_path}\n"
            "请设置环境变量 DOCX_SKILL_OFFICE 指向 skill 的 scripts/office 目录。",
            file=sys.stderr,
        )
        return 1
    try:
        import defusedxml  # noqa: F401
    except ImportError:
        print("请运行: python scripts/docx/docx.py setup", file=sys.stderr)
        return 1

    subprocess.check_call(
        [sys.executable, str(script_path), *script_args],
        cwd=str(office),
    )
    return 0


def cmd_unpack(args: argparse.Namespace) -> int:
    src = Path(args.input).resolve()
    out = Path(args.output).resolve()
    return _run_office_script("unpack.py", [str(src), str(out)])


def cmd_pack(args: argparse.Namespace) -> int:
    src = Path(args.input).resolve()
    out = Path(args.output).resolve()
    pack_args = [str(src), str(out)]
    if args.original:
        pack_args.extend(["--original", str(Path(args.original).resolve())])
    return _run_office_script("pack.py", pack_args)


def main() -> int:
    parser = argparse.ArgumentParser(description="DOCX 读写与解包工具")
    sub = parser.add_subparsers(dest="command", required=True)

    p_setup = sub.add_parser("setup", help="安装 Python 依赖并检查环境")
    p_setup.set_defaults(func=cmd_setup)

    p_read = sub.add_parser("read", help="导出为 Markdown（优先 pandoc）")
    p_read.add_argument("input", help=".docx 文件路径")
    p_read.add_argument("-o", "--output", help="输出 .md 路径")
    p_read.set_defaults(func=cmd_read)

    p_unpack = sub.add_parser("unpack", help="解包为 XML 目录（编辑用）")
    p_unpack.add_argument("input", help=".docx 文件路径")
    p_unpack.add_argument("output", help="输出目录")
    p_unpack.set_defaults(func=cmd_unpack)

    p_pack = sub.add_parser("pack", help="从解包目录重新打包")
    p_pack.add_argument("input", help="解包目录")
    p_pack.add_argument("output", help="输出 .docx 路径")
    p_pack.add_argument("--original", help="原始 docx（用于校验）")
    p_pack.set_defaults(func=cmd_pack)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
