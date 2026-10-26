"""スプレッドシート「問題」→ questions/1.json〜5.json を作る。

使い方：
  GitHub Actions：環境変数 GAS_EXPORT_URL と EXPORT_TOKEN を設定して  py scripts/build_questions.py
  手元で試す   ：py scripts/build_questions.py --tsv ファイル1.tsv [ファイル2.tsv ...] [--dev]

ルール（設計書 第3章）：
  - status = approved だけを出す
  - source_url が空なら出さない（警告）
  - 正解はそのまま書かず、軽く符号化する（サイト assets/app.js の answerOf と対）
"""
import argparse
import csv
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "questions"
NG = ["トリビア", "選挙", "投票", "政党"]
COLS = ["id", "level", "genre", "question", "choice1", "choice2", "choice3", "answer",
        "explanation", "source_url", "source_note", "verified_on", "freshness", "status", "memo"]


def warn(msg):
    print(f"[けいこく] {msg}", file=sys.stderr)


def salt(qid):
    return sum(ord(c) for c in str(qid)) % 3


def from_tsv(paths):
    rows = []
    for p in paths:
        with open(p, encoding="utf-8-sig", newline="") as f:
            rows += list(csv.DictReader(f, delimiter="\t"))
    return rows


def from_gas():
    url = os.environ.get("GAS_EXPORT_URL", "").strip()
    token = os.environ.get("EXPORT_TOKEN", "").strip()
    if not url or not token:
        sys.exit("GAS_EXPORT_URL と EXPORT_TOKEN が必要です")
    q = urllib.parse.urlencode({"export": "1", "token": token})
    with urllib.request.urlopen(f"{url}?{q}", timeout=60) as r:
        data = json.load(r)
    if not data.get("ok"):
        sys.exit("GAS から問題を受け取れませんでした（合言葉を確認）")
    return data.get("questions", [])


def clean(v):
    return str(v if v is not None else "").strip()


def build(rows, dev=False):
    levels = {n: [] for n in range(1, 6)}
    seen = set()
    for r in rows:
        r = {k: clean(r.get(k)) for k in COLS}
        if r["status"] != "approved":
            continue
        qid = r["id"]
        if not qid or qid in seen:
            warn(f"id が空か重複：{qid!r}")
            continue
        if not r["source_url"].startswith("https://") and not r["source_url"].startswith("http://"):
            warn(f"{qid}：source_url がないので出しません")
            continue
        try:
            lv = int(float(r["level"]))
            ans = int(float(r["answer"]))
        except ValueError:
            warn(f"{qid}：level か answer が数字ではありません")
            continue
        if lv not in levels or ans not in (1, 2, 3):
            warn(f"{qid}：level か answer の値が範囲外です")
            continue
        choices = [r["choice1"], r["choice2"], r["choice3"]]
        if not r["question"] or not all(choices):
            warn(f"{qid}：問題文か選択肢が空です")
            continue
        text = r["question"] + "".join(choices) + r["explanation"]
        bad = [w for w in NG if w in text]
        if bad:
            warn(f"{qid}：使わない語（{'・'.join(bad)}）が入っているので出しません")
            continue
        seen.add(qid)
        levels[lv].append({
            "id": qid,
            "q": r["question"],
            "c": choices,
            "k": (ans - 1 + salt(qid)) % 3,
            "e": r["explanation"],
            "src": r["source_url"],
            "note": r["source_note"],
        })
    OUT.mkdir(exist_ok=True)
    for lv, items in levels.items():
        items.sort(key=lambda x: x["id"])
        body = {"level": lv, "count": len(items), "items": items}
        if dev:
            body["dev"] = True
        (OUT / f"{lv}.json").write_text(json.dumps(body, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        mark = "" if len(items) >= 10 else "（10問に足りないので、この級は受けられません）"
        print(f"{lv}級：{len(items)}問{mark}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tsv", nargs="*")
    ap.add_argument("--dev", action="store_true", help="試作版の印を付ける（サイトに「しさくばん」と出る）")
    a = ap.parse_args()
    rows = from_tsv(a.tsv) if a.tsv else from_gas()
    build(rows, dev=a.dev)


if __name__ == "__main__":
    main()
