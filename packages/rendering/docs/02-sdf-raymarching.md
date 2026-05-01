# 18-SDF光线前进渲染

## 实现状态

**阶段**：阶段2 - SDF光线前进渲染
**状态**：⬜ 未开始
**相关代码**：`src/sdf/`
**依赖阶段**：[阶段1 - 全GPU渲染核心](./01-gpu-rendering-core.md)
**进度跟踪**：[PROGRESS.md](../PROGRESS.md#阶段2sdf光线前进渲染-⬜-未开始)

---

## 概述

SDF（Signed Distance Field，有向距离场）光线前进是一种通过数学函数定义场景形状，并通过光线步进渲染的技术。与光栅化渲染不同，SDF渲染不需要顶点数据，所有几何体都是程序化生成的。

### 什么是SDF

SDF是一个函数，对于空间中的任意点，返回该点到最近表面的距离：
- **正值**：点在物体外部，距离为到表面的距离
- **负值**：点在物体内部，距离为到表面的距离
- **零**：点正好在表面上

### 设计目标

- **程序化几何**：通过数学函数定义形状，无需模型文件
- **无限精度**：理论上无限细节，无多边形边缘
- **易于组合**：布尔运算（并、交、差）简单高效
- **混合渲染**：与光栅化无缝集成，作为背景/特效层

---

## 渲染原理

### 光线前进算法

```
┌─────────────────────────────────────────────────────────────┐
│              SDF 光线前进渲染流程                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 发射光线                                                  │
│     从相机穿过像素，向场景发射光线                             │
│                                                              │
│  2. 光线前进（Ray Marching）                                  │
│     ┌─────────────────────────────────────────────────────┐  │
│     │  当前位置评估SDF → 沿光线前进SDF距离 → 重复...       │  │
│     │                                                     │  │
│     │  相机 ──────→ ●────────→ ●───────→ ●────→ 表面      │  │
│     │            步进1    步进2      击中                 │  │
│     └─────────────────────────────────────────────────────┘  │
│                                                              │
│  3. 击中检测                                                  │
│     当SDF值小于阈值时，认为击中表面                           │
│                                                              │
│  4. 法线计算                                                  │
│     通过SDF梯度计算表面法线                                   │
│                                                              │
│  5. 着色                                                      │
│     计算光照、阴影、反射等                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### SDF函数示例

```
基本形状的SDF函数：

球体：sdSphere(p) = length(p) - radius
立方体：sdBox(p) = length(max(abs(p) - halfSize, 0))
圆柱：sdCylinder(p) = max(length(p.xy) - radius, abs(p.z) - height)
```

---

## SDF形状库

### 基本形状

| 形状 | SDF函数 | 复杂度 |
|------|---------|--------|
| **球体** | `length(p) - r` | 极低 |
| **立方体** | `length(max(abs(p)-s,0))` | 极低 |
| **圆柱** | `max(length(p.xy)-r, \\\|p.z\\\|-h)` | 低 |
| **圆锥** | 圆锥体SDF | 低 |
| **圆环** | `length(length(p.xy)-r) - thickness` | 低 |
| **胶囊** | `length(p-线段) - r` | 中 |

### 组合运算

```
布尔运算（CSG）：

并集：opUnion(d1, d2) = min(d1, d2)
交集：opIntersection(d1, d2) = max(d1, d2)
差集：opSubtraction(d1, d2) = max(d1, -d2)

平滑布尔运算：
平滑并集：smin(d1, d2, k)  // k控制平滑度
平滑交集：-smin(-d1, -d2, k)
```

### 变换

```
空间变换：

平移：sdTranslate(p, offset) = sdShape(p - offset)
旋转：sdRotate(p, angle) = 旋转后的坐标
缩放：sdScale(p, s) = sdShape(p/s) * s
重复：opRepetition(p, spacing) = 重复SDF
```

---

## 高级技术

### 软阴影

```
SDF软阴影算法：

float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    for(float t=mint; t<maxt;) {
        float h = map(ro + rd*t);
        if(h < 0.001) return 0.0;
        res = min(res, k*h/t);
        t += h;
    }
    return res;
}

优势：自动产生软阴影，性能开销小
```

### 环境光遮蔽（AO）

```
SDF AO算法：

float calcAO(vec3 pos, vec3 nor) {
    float occ = 0.0;
    float sca = 1.0;
    for(int i=0; i<5; i++) {
        float h = 0.01 + 0.12*float(i)/4.0;
        float d = mapSDF(pos + h*nor);
        occ += (h-d)*sca;
        sca *= 0.95;
    }
    return clamp(1.0 - 3.0*occ, 0.0, 1.0);
}
```

### 法线计算

```
通过有限差分计算法线：

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        mapSDF(p + e.xyy) - mapSDF(p - e.xyy),
        mapSDF(p + e.yxy) - mapSDF(p - e.yxy),
        mapSDF(p + e.yyx) - mapSDF(p - e.yyx)
    ));
}
```

---

## 与光栅化混合渲染

### 渲染顺序

```
混合渲染流程：

1. Shadow Depth Pass      （光栅化）
2. Z-PrePass              （光栅化）
3. 延迟光照/前向渲染       （光栅化）
4. SDF背景渲染            （本阶段）
   ├─ 读取深度缓冲
   ├─ 仅对未击中像素执行
   └─ 输出背景颜色
5. 透明渲染               （光栅化）
6. 后处理
```

### 深度协调

```
深度缓冲用途：

• Z-PrePass写入深度 → SDF读取
• 未击中像素（深度=1.0）→ 执行SDF渲染
• 击中像素（深度<1.0）→ 跳过SDF或作为背景
• SDF不写入深度（避免影响光栅化）
```

### 光照协调

```
共享光照数据：

SDF可以采样：
• Shadow Maps（用于软阴影对比）
• 光照缓冲（与光栅化一致的光照）
• 环境贴图（天空盒反射）

或者：
• SDF独立计算光照（程序化光源）
• 最终混合到光照缓冲
```

---

## 优化策略

### 早期退出

```
当光线明显不会击中场景时提前终止：

• 累积距离超过最大值
• 光线方向远离场景
• 距离增长过快（发散）
```

### 自适应步数

```
根据距离动态调整：

近距离 → 小步长，高精度
远距离 → 大步长，低性能

可以用指数步长：
t += max(0.01, t * 0.1)
```

### 分层渲染

```
分层质量策略：

背景层（远景）    → 低采样，快速
中景层          → 中等采样
近景层（击中）  → 高采样，精确
```

### 时域复用

```
利用历史帧结果：

• 复用上一帧击中位置
• 运动向量重投影
• 渐进式提高质量
```

---

## 应用场景

### 适用场景

| 场景 | 说明 |
|------|------|
| **程序化背景** | 无限远景、抽象背景 |
| **UI/特效** | 几何图形、过渡效果 |
| **原型开发** | 快速场景原型 |
| **艺术效果** | 抽象、超现实风格 |
| **体积效果** | 云、雾、流体 |

### 不适用场景

| 场景 | 原因 |
|------|------|
| 复杂模型 | SDF函数复杂，性能差 |
| 大型开放世界 | 光线步进开销大 |
| 精确碰撞 | SDF是近似值 |
| 动画角色 | 骨骼动画支持复杂 |

---

## 数据结构

### SDF场景定义

```typescript
// SDF场景配置
interface SDFScene {
  shapes: SDFShape[];
  materials: SDFMaterial[];
  lights: SDFLight[];
}

interface SDFShape {
  type: 'sphere' | 'box' | 'cylinder' | 'union' | 'intersect' | 'subtract';
  transform: mat4;
  params: number[];  // 形状参数
  children?: SDFShape[];  // 用于组合运算
}
```

### 渲染参数

```typescript
interface SDFRenderParams {
  maxSteps: number;        // 最大步数
  maxDist: number;         // 最大距离
  hitThreshold: number;    // 击中阈值
  normalEpsilon: number;   // 法线计算精度
  softShadowK: number;     // 软阴影系数
  aoSamples: number;       // AO采样数
}
```

---

## 着色器代码组织

```
src/sdf/shaders/
├── SDFPrimitives.wgsl     // 基本形状SDF
├── SDFOps.wgsl            // 组合运算
├── SDFTransforms.wgsl     // 变换函数
├── Raymarching.wgsl       // 光线前进主循环
├── SDFShading.wgsl        // 着色、阴影、AO
└── SDFScene.wgsl          // 场景SDF定义
```

---

## 性能参考

```
假设场景：1080p，中等复杂度SDF

• 最大步数：64-128
• 每像素平均评估：~30次SDF
• GPU时间：~2-5ms（现代GPU）
• 质量：程序化，无多边形锯齿

优化后：
• 分层渲染：~1-2ms
• 时域复用：~0.5-1ms
```

---

## 限制与注意事项

### 技术限制

- **性能**：复杂场景开销大
- **精度**：浮点精度限制细节
- **动画**：变形动画需要重新计算SDF
- **纹理**：纹理映射不直观

### 设计建议

- 简单SDF组合优于复杂单SDF
- 合理使用分层渲染
- 背景层使用SDF，前景使用光栅化
- 利用程序化特性，而非对抗

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [00-架构概览](./00-architecture.md) | 混合渲染架构 |
| [00-架构概览](./00-architecture.md) | 多渲染路径 |
| [17-高级渲染](./14-advanced-rendering.md) | 体素渲染相关 |
| [01-全GPU渲染核心](./01-gpu-rendering-core.md) | 核心渲染管线 |

---

## 外部参考

- **Shadertoy**：https://www.shadertoy.com/ - SDF渲染作品集
- **Inigo Quilez**：SDF技术先驱，大量教程和示例
- **The Art of Code**：YouTube SDF教程频道

---

> 最后更新：2026-04-21
