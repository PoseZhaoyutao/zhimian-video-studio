#!/usr/bin/env python3
"""微信公众号视频发布工具

流程: 获取access_token -> 上传封面图 -> 上传视频素材 -> 创建草稿 -> 发布/定时群发

使用前:
1. 复制 config.example.json 为 config.json，填入 AppID 和 AppSecret
2. 在公众号后台 -> 开发 -> 基本配置 -> IP白名单 添加你的公网IP
3. 确保 python requests 库已安装: pip install requests

用法:
  python publish_wechat.py --date 2026-07-01
  python publish_wechat.py --date 2026-07-01 --dry-run
  python publish_wechat.py --date 2026-07-01 --publish
  python publish_wechat.py --date 2026-07-01 --schedule "2026-07-01 18:00"
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    print("[ERROR] 需要安装 requests: pip install requests")
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_ROOT = REPO_ROOT / "outputs"
CONFIG_PATH = Path(__file__).resolve().parent / "config.json"
WECHAT_API = "https://api.weixin.qq.com/cgi-bin"


def load_config() -> dict[str, str]:
    if not CONFIG_PATH.exists():
        print(f"[ERROR] 配置文件不存在: {CONFIG_PATH}")
        print(f"        请复制 config.example.json 为 config.json 并填入 AppID 和 AppSecret")
        sys.exit(1)
    cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    if not cfg.get("appid") or not cfg.get("secret"):
        print("[ERROR] config.json 中 appid 和 secret 不能为空")
        sys.exit(1)
    return cfg


def get_access_token(appid: str, secret: str) -> str:
    url = f"{WECHAT_API}/token"
    params = {
        "grant_type": "client_credential",
        "appid": appid,
        "secret": secret,
    }
    resp = requests.get(url, params=params, timeout=10)
    data = resp.json()
    if "access_token" not in data:
        errcode = data.get("errcode", "?")
        errmsg = data.get("errmsg", "unknown")
        print(f"[ERROR] 获取 access_token 失败: {errcode} {errmsg}")
        if errcode == 40164:
            print("        提示: IP不在白名单中，请在公众号后台添加你的公网IP")
        sys.exit(1)
    token = data["access_token"]
    print(f"[OK] 获取 access_token 成功 (有效期 {data.get('expires_in', 7200)}s)")
    return token


def upload_image(token: str, image_path: Path) -> str:
    """上传永久图片素材，返回 media_id"""
    url = f"{WECHAT_API}/material/add_material"
    params = {"access_token": token, "type": "image"}
    with open(image_path, "rb") as f:
        files = {"media": (image_path.name, f, "image/png")}
        resp = requests.post(url, params=params, files=files, timeout=60)
    data = resp.json()
    if "media_id" not in data:
        print(f"[ERROR] 上传图片失败: {data}")
        sys.exit(1)
    media_id = data["media_id"]
    print(f"[OK] 封面图片上传成功: {image_path.name} -> {media_id}")
    return media_id


def upload_video(token: str, video_path: Path, title: str, introduction: str) -> str:
    """上传永久视频素材，返回 media_id"""
    url = f"{WECHAT_API}/material/add_material"
    params = {"access_token": token, "type": "video"}
    description = json.dumps({"title": title[:32], "introduction": introduction[:120]}, ensure_ascii=False)
    with open(video_path, "rb") as f:
        files = {"media": (video_path.name, f, "video/mp4")}
        data = {"description": description}
        resp = requests.post(url, params=params, files=files, data=data, timeout=300)
    result = resp.json()
    if "media_id" not in result:
        print(f"[ERROR] 上传视频失败: {result}")
        sys.exit(1)
    media_id = result["media_id"]
    size_mb = video_path.stat().st_size / (1024 * 1024)
    print(f"[OK] 视频上传成功: {video_path.name} ({size_mb:.1f}MB) -> {media_id}")
    return media_id


def upload_content_image(token: str, image_path: Path) -> str:
    """上传图文消息内的图片，返回URL（不占用永久素材配额）"""
    url = f"{WECHAT_API}/media/uploadimg"
    params = {"access_token": token}
    with open(image_path, "rb") as f:
        files = {"media": (image_path.name, f, "image/png")}
        resp = requests.post(url, params=params, files=files, timeout=60)
    data = resp.json()
    if "url" not in data:
        print(f"[ERROR] 上传内容图片失败: {data}")
        return ""
    img_url = data["url"]
    print(f"[OK] 内容图片上传成功: {image_path.name} -> {img_url[:60]}...")
    return img_url


def add_draft(
    token: str,
    title: str,
    content_html: str,
    thumb_media_id: str,
    author: str = "智面引擎",
    digest: str = "",
) -> str:
    """创建草稿，返回草稿 media_id"""
    url = f"{WECHAT_API}/draft/add"
    params = {"access_token": token}
    payload = {
        "articles": [
            {
                "article_type": "news",
                "title": title[:32],
                "author": author[:16],
                "digest": digest[:120] if digest else "",
                "content": content_html,
                "thumb_media_id": thumb_media_id,
                "need_open_comment": 1,
                "only_fans_can_comment": 0,
            }
        ]
    }
    resp = requests.post(url, params=params, json=payload, timeout=30)
    data = resp.json()
    if "media_id" not in data:
        print(f"[ERROR] 创建草稿失败: {data}")
        sys.exit(1)
    draft_id = data["media_id"]
    print(f"[OK] 草稿创建成功: {draft_id}")
    return draft_id


def publish_draft(token: str, draft_media_id: str) -> str:
    """发布草稿（仅订阅号每天1次，服务号每月4次）"""
    url = f"{WECHAT_API}/freepublish/submit"
    params = {"access_token": token}
    payload = {"media_id": draft_media_id}
    resp = requests.post(url, params=params, json=payload, timeout=30)
    data = resp.json()
    if data.get("errcode", 0) != 0:
        print(f"[ERROR] 发布失败: {data}")
        if data.get("errcode") == 45009:
            print("        提示: 超过群发次数限制（订阅号每天1次，服务号每月4次）")
        return ""
    publish_id = data.get("publish_id", "")
    print(f"[OK] 发布成功: publish_id={publish_id}")
    return publish_id


def build_content_html(video_media_id: str, description: str, tags: list[str], cover_url: str = "") -> str:
    """构造图文消息HTML内容"""
    tag_str = " ".join(f"#{t}" for t in tags)
    html_parts = [
        f'<p>{description}</p>',
        f'<p><mpvideo src="{video_media_id}" alt="视频"></mpvideo></p>',
        f'<p>标签：{tag_str}</p>',
        '<p>— 智面引擎 | AI算法面试科普</p>',
    ]
    if cover_url:
        html_parts.insert(1, f'<p><img src="{cover_url}"></p>')
    return "\n".join(html_parts)


def load_episode_data(date: str) -> dict[str, Any]:
    """加载指定日期的视频交付数据"""
    out_dir = OUTPUT_ROOT / date
    if not out_dir.exists():
        print(f"[ERROR] 输出目录不存在: {out_dir}")
        sys.exit(1)

    video_path = out_dir / "video" / "final-9x16.mp4"
    cover_path = out_dir / "cover" / "cover-9x16.png"
    manifest_path = out_dir / "manifest.json"
    bilibili_copy = out_dir / "copy" / "bilibili.md"

    if not video_path.exists():
        print(f"[ERROR] 视频文件不存在: {video_path}")
        sys.exit(1)

    title = date
    benefit = ""
    if manifest_path.exists():
        m = json.loads(manifest_path.read_text(encoding="utf-8"))
        topic = m.get("topic", {})
        title = topic.get("title", date)
        benefit = topic.get("benefit", "")

    description = f"{title}"
    if benefit:
        description = f"{title} — {benefit}"

    tags = ["面试", "AI算法", "大模型", "智面引擎"]

    if bilibili_copy.exists():
        copy_text = bilibili_copy.read_text(encoding="utf-8")
        for line in copy_text.split("\n"):
            if line.strip().startswith("标签："):
                raw_tags = line.replace("标签：", "").strip()
                tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
                break

    return {
        "date": date,
        "title": title,
        "description": description,
        "tags": tags,
        "video_path": video_path,
        "cover_path": cover_path,
        "out_dir": out_dir,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="微信公众号视频发布工具")
    parser.add_argument("--date", required=True, help="视频日期，如 2026-07-01")
    parser.add_argument("--dry-run", action="store_true", help="只模拟流程，不实际调用API")
    parser.add_argument("--publish", action="store_true", help="创建草稿后立即发布")
    parser.add_argument("--schedule", type=str, default="", help="定时发布时间，格式: '2026-07-01 18:00'（仅提示，微信定时群发需在后台操作）")
    args = parser.parse_args()

    print(f"=== 微信公众号发布工具 ===")
    print(f"日期: {args.date}")
    print(f"模式: {'模拟' if args.dry_run else '实际'}")
    print()

    ep = load_episode_data(args.date)
    print(f"标题: {ep['title']}")
    print(f"描述: {ep['description']}")
    print(f"标签: {' '.join('#' + t for t in ep['tags'])}")
    print(f"视频: {ep['video_path']} ({ep['video_path'].stat().st_size / 1024 / 1024:.1f}MB)")
    print(f"封面: {ep['cover_path']}")
    print()

    if args.dry_run:
        print("[DRY-RUN] 模拟流程:")
        print(f"  1. 获取 access_token (需要 config.json)")
        print(f"  2. 上传封面图片: {ep['cover_path'].name}")
        print(f"  3. 上传视频素材: {ep['video_path'].name}")
        print(f"  4. 创建草稿: 标题='{ep['title'][:32]}'")
        if args.publish:
            print(f"  5. 发布草稿")
        if args.schedule:
            print(f"  6. 定时发布提示: {args.schedule}")
        print()
        print("[DRY-RUN] 未实际调用API。去掉 --dry-run 执行真实发布。")
        return

    cfg = load_config()
    token = get_access_token(cfg["appid"], cfg["secret"])

    cover_media_id = upload_image(token, ep["cover_path"])
    video_media_id = upload_video(token, ep["video_path"], ep["title"], ep["description"])

    content_html = build_content_html(video_media_id, ep["description"], ep["tags"])
    author = cfg.get("default_author", "智面引擎")
    draft_id = add_draft(token, ep["title"], content_html, cover_media_id, author, ep["description"])

    if args.publish:
        publish_draft(token, draft_id)

    if args.schedule:
        print(f"\n[提示] 微信公众号定时群发需在公众号后台手动操作:")
        print(f"  1. 进入公众号后台 -> 草稿箱")
        print(f"  2. 找到草稿: {ep['title']}")
        print(f"  3. 点击 '保存并群发' -> 选择 '定时群发'")
        print(f"  4. 设置发布时间: {args.schedule}")

    result = {
        "date": args.date,
        "title": ep["title"],
        "draft_media_id": draft_id,
        "video_media_id": video_media_id,
        "cover_media_id": cover_media_id,
        "published": args.publish,
        "schedule_hint": args.schedule or None,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    log_path = ep["out_dir"] / "publish" / "wechat_publish.json"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[OK] 发布记录已保存: {log_path}")


if __name__ == "__main__":
    main()
