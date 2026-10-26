"""freeze.json の停止期間中なら終了コード 1 を返す（自動ビルドを止めるため）。"""
import datetime
import json
import sys
from pathlib import Path

today = (datetime.datetime.utcnow() + datetime.timedelta(hours=9)).date().isoformat()
data = json.loads((Path(__file__).resolve().parent.parent / "freeze.json").read_text(encoding="utf-8"))
for p in data.get("periods", []):
    if p["from"] <= today <= p["to"]:
        print(f"{today} は停止期間（{p['from']}〜{p['to']}）なので更新しません")
        sys.exit(1)
print(f"{today} は停止期間ではありません")
