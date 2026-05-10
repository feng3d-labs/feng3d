# API 参考

## 核心 API

### buildShader

构建着色器的核心函数。

```typescript
import { buildShader } from '@feng3d/tsl';

buildShader(
    { language: 'wgsl', stage: 'vertex', version: 2 },
    () => { /* 着色器代码 */ }
);
```

## 类型 API

### 标量类型

| API | 说明 |
|-----|------|
| `float(value?)` | 32位浮点数 |
| `int(value?)` | 32位整数 |
| `uint(value?)` | 32位无符号整数 |
| `bool(value?)` | 布尔值 |

```typescript
import { float, int, uint, bool } from '@feng3d/tsl';

const x = float(1.5);
const y = int(42);
const z = uint(10);
const b = bool(true);
```

### 向量类型

| API | 说明 |
|-----|------|
| `vec2(x?, y?)` | 2分量向量 |
| `vec3(x?, y?, z?)` | 3分量向量 |
| `vec4(x?, y?, z?, w?)` | 4分量向量 |
| `ivec2/3/4` | 整数向量 |
| `uvec2/3/4` | 无符号整数向量 |

```typescript
import { vec2, vec3, vec4 } from '@feng3d/tsl';

const v2 = vec2(1, 2);
const v3 = vec3(1, 2, 3);
const v4 = vec4(1, 2, 3, 4);
```

### 矩阵类型

| API | 说明 |
|-----|------|
| `mat2()` | 2x2 矩阵 |
| `mat4()` | 4x4 矩阵 |
| `mat4x3()` | 4x3 矩阵 |

## 变量 API

### attribute

声明顶点属性变量。

```typescript
const position = attribute('position', vec3());
const normal = attribute('normal', vec3());
const uv = attribute('uv', vec2());
```

### uniform

声明全局变量（从 CPU 传递到 GPU）。

```typescript
const mvp = uniform('modelViewProjection', mat4());
const time = uniform('time', float());
const color = uniform('color', vec3());
```

### varying

声明顶点到片段的插值变量。

```typescript
const vPosition = varying('vPosition', vec3());
const vUV = varying('vUV', vec2());
```

### let_ / var_

声明局部/全局变量。

```typescript
let_('temp', float(0.0));
var_('globalCounter', int(0));
```

### struct

声明结构体。

```typescript
const Material = struct('Material', {
    albedo: vec3(1, 1, 1),
    metallic: float(0.5),
    roughness: float(0.5),
});
```

### array

声明数组。

```typescript
const lights = array(struct('Light', { position: vec3(), color: vec3() }), 8);
```

## 着色器入口 API

### vertex

创建顶点着色器。

```typescript
export const vertexShader = vertex('main', () => {
    return mvp * vec4(position, 1.0);
});
```

### fragment

创建片段着色器。

```typescript
export const fragmentShader = fragment('main', () => {
    precision('mediump', 'float');
    return_(color);
});
```

### func

创建可重用函数。

```typescript
const calculateLighting = func('calculateLighting',
    { normal: vec3(), lightDir: vec3() },
    vec3(),
    ({ normal, lightDir }) => {
        return max(0, dot(normal, lightDir));
    }
);
```

## 控制流 API

### if_

条件语句。

```typescript
import { if_ } from '@feng3d/tsl';

if_(condition,
    () => { /* then */ },
    () => { /* else */ }  // 可选
);
```

### select

三元条件选择（WGSL）。

```typescript
import { select } from '@feng3d/tsl';

const result = select(condition, valueIfTrue, valueIfFalse);
```

### return_

返回语句。

```typescript
import { return_ } from '@feng3d/tsl';

return_(vec4(1, 0, 0, 1));
```

## 数学函数 API

### 三角函数

| API | 说明 |
|-----|------|
| `sin(x)` | 正弦 |
| `cos(x)` | 余弦 |
| `tan(x)` | 正切 |
| `asin(x)` | 反正弦 |
| `acos(x)` | 反余弦 |
| `atan(x)` | 反正切 |
| `atan2(y, x)` | atan2 |

### 指数对数

| API | 说明 |
|-----|------|
| `exp(x)` | e^x |
| `log2(x)` | log2(x) |
| `pow(x, y)` | x^y |
| `sqrt(x)` | 平方根 |

### 通用函数

| API | 说明 |
|-----|------|
| `abs(x)` | 绝对值 |
| `min(x, y)` | 最小值 |
| `max(x, y)` | 最大值 |
| `clamp(x, min, max)` | 钳位 |
| `mix(x, y, a)` | 线性插值 |
| `step(edge, x)` | 阶梯函数 |
| `smoothstep(edge0, edge1, x)` | 平滑阶梯 |
| `fract(x)` | 小数部分 |

## 向量运算 API

| API | 说明 |
|-----|------|
| `dot(a, b)` | 点积 |
| `cross(a, b)` | 叉积 (3D) |
| `normalize(v)` | 归一化 |
| `reflect(I, N)` | 反射向量 |
| `lessThan(a, b)` | 小于比较 |

## 纹理 API

### 采样器类型

| API | 说明 |
|-----|------|
| `sampler2D()` | 2D 纹理采样器 |
| `sampler3D()` | 3D 纹理采样器 |
| `sampler2DArray()` | 2D 纹理数组采样器 |
| `usampler2D()` | 无符号整数 2D 采样器 |
| `depthSampler()` | 深度采样器 |

### 纹理函数

| API | 说明 |
|-----|------|
| `texture(sampler, uv)` | 纹理采样 |
| `texture2D(sampler, uv)` | 2D 纹理采样 |
| `textureLod(sampler, uv, lod)` | LOD 采样 |
| `textureGrad(sampler, uv, ddx, ddy)` | 梯度采样 |
| `texelFetch(sampler, uv, lod)` | 纹素获取 |
| `textureSize(sampler, lod)` | 纹理尺寸 |

## GLSL 专有 API

### 内置变量

```typescript
import {
    gl_Position, gl_FragColor, gl_VertexID,
    gl_FragCoord, gl_InstanceID, gl_FrontFacing, gl_PointSize
} from '@feng3d/tsl';
```

### 精度控制

```typescript
import { precision } from '@feng3d/tsl';

precision('mediump', 'float');  // highp, mediump, lowp
```

### 导数函数

```typescript
import { dFdx, dFdy } from '@feng3d/tsl';

const ddx = dFdx(value);
const ddy = dFdy(value);
```

---

*最后更新: 2026-02-26*
