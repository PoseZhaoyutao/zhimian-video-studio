# VoxCPM2 本地配音教程

智面引擎通过 `skills/zhimian-video-studio/scripts/zhimian/vox.py` 调用本地 VoxCPM2，为每个分镜生成独立 WAV，再合并为整条视频配音。

## 默认约定

| 配置 | 默认值 |
| --- | --- |
| VoxCPM2 工程路径 | `D:\Project\VoxCPM2\VoxCPM` |
| 模型源 | `openbmb/VoxCPM2` |
| 合成音色提示词 | `清晰、中性、轻快、技术讲解感，停顿自然` |
| 输出格式 | PCM16 单声道 WAV |
| 安全策略 | 默认合成音色；未授权不允许真人音色克隆 |

## 推荐环境变量

```powershell
$env:VOXCPM2_PROJECT = "D:\Project\VoxCPM2\VoxCPM"
$env:VOXCPM2_MODEL_SOURCE = "openbmb/VoxCPM2"
$env:VOXCPM2_VOICE_PROMPT = "清晰、中性、轻快、技术讲解感，停顿自然"
```

如果你把 VoxCPM2 放在其他位置，只改 `VOXCPM2_PROJECT` 即可。

## 安装 VoxCPM2

本机已验证的 VoxCPM2 工程位于 `D:\Project\VoxCPM2\VoxCPM`。该工程的 `pyproject.toml` 标注包名为 `voxcpm`，项目地址为 `https://github.com/OpenBMB/VoxCPM`，官方 README 标注环境要求为 Python ≥ 3.10 且 < 3.13、PyTorch ≥ 2.5.0、CUDA ≥ 12.0。

推荐用独立 conda 环境：

```powershell
conda create -n VoxCPM2 python=3.11 -y
conda activate VoxCPM2

pip install -U pip
pip install voxcpm
```

如果你要从本地源码安装：

```powershell
conda activate VoxCPM2
cd D:\Project\VoxCPM2\VoxCPM
pip install -e .
```

如果需要 GPU，请安装与你本机 CUDA 版本匹配的 PyTorch。CPU 也能跑，但速度会明显慢。

## 冒烟测试

在智面引擎仓库根目录执行。因为 Skill 目录名包含连字符，推荐直接把脚本目录加入 `PYTHONPATH`：

```powershell
conda activate VoxCPM2
$env:PYTHONPATH = "$PWD\skills\zhimian-video-studio\scripts"

python -c "from zhimian.vox import VoxAdapter; a=VoxAdapter(); print(a.model_source)"
```

生成一段测试音频：

```powershell
conda activate VoxCPM2
$env:PYTHONPATH = "$PWD\skills\zhimian-video-studio\scripts"

python -c "from pathlib import Path; from zhimian.vox import VoxAdapter; VoxAdapter().generate_segments(['这是一段智面引擎配音测试。'], Path('outputs/vox-smoke'))"
```

成功后会生成：

```text
outputs/vox-smoke/01.wav
```

## 与视频生产流水线的关系

真实生产命令：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-06-18 `
  --output-root outputs `
  --mode manual
```

执行时会：

1. 读取当天选题。
2. 写出分镜脚本。
3. 调用 VoxCPM2 生成 `audio/segments/01.wav`、`02.wav` 等分段配音。
4. 合并为 `audio/narration.wav`。
5. 根据真实音频时长重算 `timeline.json`。
6. 把分段音频交给 Remotion 合成视频。

## 真人音色克隆边界

适配器支持参考音频参数，但默认拒绝未授权克隆：

```python
VoxAdapter(reference_audio="person.wav", authorized_voice_clone=False)
```

会抛出：

```text
PermissionError: voice clone requires explicit authorization
```

只有当你确实拥有被克隆声音的明确授权时，才能将 `authorized_voice_clone=True`。智面引擎的默认账号生产策略不需要真人克隆，建议长期使用合成讲解音色。

## 性能建议

- 先用 `--dry-run --skip-audio --skip-render` 调脚本和目录结构。
- 确认脚本后再启用 VoxCPM2，减少重复生成。
- 如果 CPU 生成太慢，先生成更短的分镜文本，或迁移到 CUDA 环境。
- 生成失败时不要删除已有日期包；用 `--rebuild` 生成 `v2`，保留排错证据。
