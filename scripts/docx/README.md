# DOCX 工具

本目录封装 [Claude docx skill](https://github.com/anthropics/skills) 在本机的调用方式，避免路径与依赖问题。

## 一次性环境准备

```powershell
# 1. Python 依赖（unpack/pack/read 备用）
python scripts/docx/docx.py setup

# 2. pandoc（推荐，导出 Markdown 质量更好）
winget install --id JohnMacFarlane.Pandoc -e
# 安装后需新开终端，或刷新 PATH
```

## 常用命令

```powershell
# 读出为 Markdown（优先 pandoc）
python scripts/docx/docx.py read tmp\后台出价操作手册.docx

# 解包 → 编辑 XML → 打包
python scripts/docx/docx.py unpack tmp\后台出价操作手册.docx tmp\docx-unpacked
python scripts/docx/docx.py pack tmp\docx-unpacked tmp\后台出价操作手册-改.docx --original tmp\后台出价操作手册.docx
```

若 skill 不在默认路径，设置：

```powershell
$env:DOCX_SKILL_OFFICE = "C:\Users\li150\.claude\skills\docx\scripts\office"
```

## 故障排查

| 现象 | 处理 |
|------|------|
| `pandoc` 找不到 | `winget install JohnMacFarlane.Pandoc`，重启终端 |
| `No module named 'defusedxml'` | `python scripts/docx/docx.py setup` |
| `unpack.py` 找不到 | 检查 `DOCX_SKILL_OFFICE` 或安装 docx skill |
| 中文路径乱码 | 用变量传路径，或 `cd` 到 `tmp` 后用相对路径 |
