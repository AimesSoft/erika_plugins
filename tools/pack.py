#!/usr/bin/env python3
"""把插件文件夹打成 Erika 插件包（.epk），用来在本地分发。

    python3 tools/pack.py                         # plugins.json 列出的每个插件
    python3 tools/pack.py plugins/erika.speed_range   # 只打这几个文件夹

包写到 dist/<id>.epk。插件包是 zip：插件文件夹里的文件放在包的根上（pack.json、
脚本、图标和别的文件），以点开头的文件不打进去。Erika「导入文件」时把它解压回
数据目录的 plugins/<id>/。仓库和市场里的插件仍是文件夹。
"""
import json
import os
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def pack(folder):
    with open(os.path.join(folder, "pack.json"), encoding="utf-8") as file:
        plugin_id = json.load(file)["id"]
    target = os.path.join(ROOT, "dist", f"{plugin_id}.epk")
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as package:
        for base, dirs, files in os.walk(folder):
            dirs[:] = sorted(d for d in dirs if not d.startswith("."))
            for name in sorted(files):
                if name.startswith("."):
                    continue
                path = os.path.join(base, name)
                package.write(path, os.path.relpath(path, folder).replace(os.sep, "/"))
    return os.path.relpath(target, ROOT)


def main():
    folders = sys.argv[1:]
    if not folders:
        with open(os.path.join(ROOT, "plugins.json"), encoding="utf-8") as file:
            folders = [os.path.join(ROOT, entry["path"]) for entry in json.load(file)["plugins"] if "path" in entry]
    for folder in folders:
        print(pack(os.path.abspath(folder)))


if __name__ == "__main__":
    main()
