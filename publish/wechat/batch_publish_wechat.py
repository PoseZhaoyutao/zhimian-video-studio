#!/usr/bin/env python3
"""批量发布视频到微信公众号草稿箱

用法:
  python batch_publish_wechat.py --start 2026-07-01 --end 2026-07-07
  python batch_publish_wechat.py --start 2026-07-01 --end 2026-07-07 --publish
  python batch_publish_wechat.py --start 2026-07-01 --end 2026-07-31 --dry-run
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "publish_wechat.py"
PYTHON = sys.executable


def daterange(start: str, end: str) -> list[str]:
    d1 = datetime.strptime(start, "%Y-%m-%d")
    d2 = datetime.strptime(end, "%Y-%m-%d")
    dates = []
    cur = d1
    while cur <= d2:
        dates.append(cur.strftime("%Y-%m-%d"))
        cur += timedelta(days=1)
    return dates


def main() -> None:
    parser = argparse.ArgumentParser(description="批量发布视频到微信公众号草稿箱")
    parser.add_argument("--start", required=True, help="开始日期，如 2026-07-01")
    parser.add_argument("--end", required=True, help="结束日期，如 2026-07-07")
    parser.add_argument("--dry-run", action="store_true", help="只模拟流程")
    parser.add_argument("--publish", action="store_true", help="创建草稿后立即发布（注意群发次数限制）")
    args = parser.parse_args()

    dates = daterange(args.start, args.end)
    print(f"=== 批量发布到微信公众号 ===")
    print(f"日期范围: {args.start} ~ {args.end} ({len(dates)}期)")
    print(f"模式: {'模拟' if args.dry_run else '实际'}")
    print(f"自动发布: {'是' if args.publish else '否（仅创建草稿）'}")
    print()

    if args.publish and not args.dry_run:
        print("[WARN] 批量自动发布会受群发次数限制（订阅号每天1次，服务号每月4次）")
        print("[WARN] 建议先创建草稿，再在后台手动定时群发")
        confirm = input("确定要批量自动发布吗？(y/N): ")
        if confirm.lower() != "y":
            print("已取消。")
            return

    results = []
    for i, date in enumerate(dates, 1):
        print(f"\n--- [{i}/{len(dates)}] {date} ---")
        cmd = [PYTHON, str(SCRIPT), "--date", date]
        if args.dry_run:
            cmd.append("--dry-run")
        if args.publish:
            cmd.append("--publish")
        result = subprocess.run(cmd)
        ok = result.returncode == 0
        results.append((date, ok))
        if not ok:
            print(f"[WARN] {date} 发布失败，继续下一期")

    print(f"\n=== 批量发布完成 ===")
    ok_count = sum(1 for _, ok in results if ok)
    fail_count = len(results) - ok_count
    print(f"成功: {ok_count}  失败: {fail_count}")
    if fail_count > 0:
        print(f"失败日期:")
        for date, ok in results:
            if not ok:
                print(f"  {date}")


if __name__ == "__main__":
    main()
