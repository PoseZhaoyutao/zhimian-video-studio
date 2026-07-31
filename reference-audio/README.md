# 参考音轨 - 标准男性解说主播声线

**创建日期**: 2026-07-20
**来源视频**: Agent制作中的DAG工具编排
**来源日期**: 2026-07-20

---

## VoxCPM2 提示词

```
温文尔雅的男性解说主播，声音温暖醇厚，语速适中从容不迫，吐字清晰自然，带有学者气质，娓娓道来而不急不躁，适合深度科普与知识分享
```

---

## 模型参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 模型来源 | `openbmb/VoxCPM2` | 默认模型 |
| cfg_value | 2.0 | 控制生成多样性 |
| inference_timesteps | 10 | 推理步数 |
| 降噪器 | 已启用 | 内置降噪模型 |

---

## 后处理参数 (ffmpeg)

```bash
ffmpeg -i input.wav -af \
  "highpass=f=100,\
   lowpass=f=7500,\
   afftdn=nr=8:nf=-25,\
   deesser=i=0.4,\
   dynaudnorm=p=0.85:g=101:f=250,\
   equalizer=f=3000:width_type=h:width=1200:g=2,\
   equalizer=f=200:width_type=h:width=150:g=-2,\
   equalizer=f=6000:width_type=h:width=2000:g=-2,\
   volume=1.2dB" \
  output.wav
```

**后处理说明**:
- `highpass=f=100`: 切除低频隆隆声
- `lowpass=f=7500`: 切除TTS高频伪影
- `afftdn=nr=8`: 温和FFT降噪
- `deesser=i=0.4`: 驯服齿音，温暖音色
- `dynaudnorm`: 自然响度平衡（替代硬压缩器）
- `equalizer`: 温暖存在感提升、减少浑浊、滚降低粗糙感
- `volume=1.2dB`: 轻微增益

---

## 参考音频文件

| 文件 | 场景 | 内容 |
|------|------|------|
| `01.wav` | S1 | Agent为什么需要DAG编排 |
| `02.wav` | S2 | 什么是DAG |
| `03.wav` | S3 | 主流DAG工具对比 |
| `04.wav` | S4 | DAG设计模式 |
| `05.wav` | S5 | 多Agent协作示例 |
| `06.wav` | S6 | 关键考量与总结 |

---

## 音频规格

- 采样率: 24000 Hz (VoxCPM2默认)
- 声道: 单声道
- 格式: WAV (PCM 16-bit)
- 总时长: ~120秒

---

## 使用建议

1. **新视频制作**: 直接使用此提示词作为默认配置
2. **一致性保证**: 不要修改提示词，保持声线一致
3. **克隆限制**: 未经明确授权，不得克隆真人音色
4. **降噪处理**: 所有音频都应经过上述ffmpeg后处理

---

## 代码位置

- VoxCPM2适配器: `skills/zhimian-video-studio/scripts/zhimian/vox.py`
- 默认提示词: `vox.py` 第13-17行
- 后处理函数: `vox.py` `_ffmpeg_denoise()` 函数

---

## 注意事项

此声线为**智面引擎**所有后续视频的默认配音声线，除非用户在当次任务中明确指定其他声线，否则必须使用此配置。