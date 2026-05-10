# TSL 示例实现标准指南

本文档定义了在 `packages/tsl/examples/src/WebGL2Samples/` 目录下创建新 TSL 示例的标准流程。

## 目录结构

```
packages/tsl/examples/src/WebGL2Samples/<示例名>/
├── index.html          # HTML 入口页面
├── index.ts            # TypeScript 主入口
├── images/             # 图片资源（如需要）
│   └── *.png
└── shaders/
    ├── shader.ts       # TSL 着色器代码（核心）
    ├── vertex.glsl     # GLSL 顶点着色器（调试用）
    ├── fragment.glsl   # GLSL 片段着色器（调试用）
    ├── vertex.wgsl     # WGSL 顶点着色器（调试用）
    └── fragment.wgsl   # WGSL 片段着色器（调试用）
```

**资源文件规则**：图片等资源文件必须复制到示例目录内（如 `images/`），使用相对路径引用（如 `./images/xxx.png`），不要引用外部路径。

## 实现步骤

### 步骤 1: 创建 `index.html`

从现有示例（如 `draw_primitive_restart/index.html`）复制模板，修改：
- `<title>` 和 `.title` 标题
- `.description` 描述
- `关于示例` 列表
- **必须包含两个画布**：`<canvas id="webgl">` 和 `<canvas id="webgpu">`

### 步骤 2: 创建着色器文件

1. **`shaders/shader.ts`** - TSL 着色器（核心），参考现有示例
2. **`shaders/vertex.glsl`** 和 **`shaders/fragment.glsl`** - GLSL 着色器（调试用）
3. **`shaders/vertex.wgsl`** 和 **`shaders/fragment.wgsl`** - WGSL 着色器（调试用）

#### WGSL 着色器编写规则（重要）

WGSL 着色器中的 uniform 变量**必须直接声明，不要使用 struct 包装**，以确保与 render-api 的绑定机制兼容：

```wgsl
// ✅ 正确：直接声明 uniform
@group(0) @binding(0) var<uniform> MVP: mat4x4<f32>;

// ❌ 错误：使用 struct 包装（与 render-api 不兼容）
struct Uniforms { MVP: mat4x4<f32> }
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
```

在着色器中直接使用变量名：
```wgsl
// ✅ 正确
output.position = MVP * vec4<f32>(input.position, 0.0, 1.0);

// ❌ 错误
output.position = uniforms.MVP * vec4<f32>(input.position, 0.0, 1.0);
```

**原因**：render-api 通过 `bindingResources` 中的 key（如 `MVP`）直接绑定 uniform，WGSL 中的变量名必须与之匹配。

#### Texture+Sampler 组合绑定规则

当 `bindingResources` 使用 texture+sampler 组合时（如 `diffuse: { texture, sampler }`），WGSL 中需要使用特定的命名：

```wgsl
// bindingResources: { diffuse: { texture, sampler }, MVP: { value: ... } }

// 顶点着色器
@group(0) @binding(0) var<uniform> MVP: mat4x4<f32>;

// 片段着色器（binding 索引必须与顶点着色器错开）
@group(0) @binding(1) var diffuse_texture: texture_2d<f32>;  // 纹理：原名 + "_texture"
@group(0) @binding(2) var diffuse: sampler;                   // 采样器：原名
```

**重要**：
- 纹理变量名 = `bindingResources` 中的 key + `_texture`（如 `diffuse_texture`）
- 采样器变量名 = `bindingResources` 中的 key（如 `diffuse`）
- 片段着色器的 `@binding` 索引必须与顶点着色器错开，避免冲突

#### 深度纹理处理规则（重要）

深度纹理在 WebGL 和 WebGPU 中的处理方式不同：

**TSL 着色器中使用 `depthSampler` 替代 `sampler`：**

```typescript
import { depthSampler, texture } from '@feng3d/tsl';

// 使用 depthSampler 声明深度纹理
const depthMap = depthSampler(uniform('depthMap'));

// 采样深度值（返回 f32，可直接使用或通过 .r 访问）
const depth = texture(depthMap, uv).r;
```

**WGSL 手动着色器中的处理：**

```wgsl
// ✅ 正确：使用 texture_depth_2d 类型
@group(0) @binding(0) var depthMap_texture: texture_depth_2d;
@group(0) @binding(1) var depthMap: sampler;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    // 使用 textureLoad 而不是 textureSample（深度纹理不支持过滤采样）
    let texSize = textureDimensions(depthMap_texture);
    let texCoord = vec2<i32>(input.v_st * vec2<f32>(texSize));
    let depth = textureLoad(depthMap_texture, texCoord, 0);
    return vec4<f32>(vec3<f32>(1.0 - depth), 1.0);
}
```

**关键区别：**

| 特性 | 普通纹理 | 深度纹理 |
|-----|---------|---------|
| TSL 声明 | `sampler2D(uniform('name'))` | `depthSampler(uniform('name'))` |
| WGSL 类型 | `texture_2d<f32>` | `texture_depth_2d` |
| WGSL 采样 | `textureSample(...)` | `textureLoad(...)` |
| 返回类型 | `vec4<f32>` | `f32` |

**空片段着色器（仅写深度）：**

```typescript
// TSL：不返回任何值即可
export const depthFragmentShader = fragment('main', () => {
    precision('highp', 'float');
    // 不调用 return_()，仅写入深度
});
```

```wgsl
// WGSL：函数不需要返回类型
@fragment
fn main() {
    // 空函数体，仅写入深度
}
```

### 步骤 3: 创建 `index.ts`

参考 `draw_primitive_restart/index.ts`，关键代码结构：

```typescript
// 导入原始着色器（调试用）
import fragmentGlsl from './shaders/fragment.glsl';
import fragmentWgsl from './shaders/fragment.wgsl';
import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';
// 导入 TSL 着色器
import { fragmentShader, vertexShader } from './shaders/shader';

// 生成着色器代码（变量名必须与导入的相同，便于调试切换）
const vertexGlsl = vertexShader.toGLSL(2);
const fragmentGlsl = fragmentShader.toGLSL(2);
const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });  // 必须启用深度转换
const fragmentWgsl = fragmentShader.toWGSL(vertexShader);
```

**深度转换说明**：生成 WGSL 顶点着色器时，**必须**使用 `{ convertDepth: true }` 选项：
- WebGL NDC 深度范围：`[-1, 1]`
- WebGPU NDC 深度范围：`[0, 1]`
- 启用此选项会自动将 `gl_Position.z` 从 `[-1, 1]` 转换到 `[0, 1]`，确保跨平台渲染结果一致

## WebGL 与 WebGPU 双渲染（重要）

**所有示例必须同时支持 WebGL 和 WebGPU 渲染，并自动对比结果**，除非该功能仅某一平台支持（如 `BlitFramebuffer` 仅 WebGL 支持）。

### 标准模板

```typescript
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

document.addEventListener('DOMContentLoaded', async () => {
    // 初始化 WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // ... 创建渲染资源 ...

    // 执行渲染
    webgl.submit(submit);
    webgpu.submit(submit);

    // 第一帧后进行比较
    autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
});
```

### 仅单平台支持的情况

如果功能仅某一平台支持，需要：
1. HTML 中只保留对应平台的画布
2. 在"关于示例"中说明平台限制
3. 代码中添加注释说明原因

示例（仅 WebGL）：
```typescript
// BlitFramebuffer 是 WebGL 特有功能，WebGPU 暂不支持
const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });
webgl.submit(submit);
```

### 步骤 4: 更新配置文件

在 `resources/files.json` 和 `public/files.json` 的 `WebGL2Samples` 数组中添加新示例路径。

### 步骤 5: 编译验证

完成所有文件创建后，必须在 `packages/tsl/examples` 目录下运行编译命令验证代码正确性：

```bash
cd packages/tsl/examples
npm run build
```

**注意**：必须在 `packages/tsl/examples` 目录下运行，该目录包含 TypeScript 配置和所有示例代码的类型检查。

如果有编译错误，需要修复后再次编译，直到编译通过。

## TSL 代码结构规范（重要）

**TSL 着色器代码必须保持与原始 GLSL 相同的结构**，确保生成的 GLSL 代码与原始代码一致。这是验证 TSL 正确性的重要标准。

### 使用 `let_` 创建局部变量（最重要）

**必须使用 `let_` 函数创建 GLSL 局部变量**，否则 TSL 会将表达式内联，导致生成代码与原始 GLSL 不一致：

```typescript
import { let_ } from '@feng3d/tsl';

// ✅ 正确：使用 let_ 创建局部变量
// 原始 GLSL: vec2 size = vec2(textureSize(diffuse, 0) - 1);
const size = let_('size', vec2(textureSize(diffuse, 0).subtract(1)));

// ✅ 正确：后续引用该变量
// 原始 GLSL: vec2 texcoord = v_st * size;
const texcoordF = let_('texcoord', v_st.multiply(size));

// ❌ 错误：不使用 let_，表达式会被内联
const size = vec2(textureSize(diffuse, 0).subtract(1));  // TypeScript 常量，不生成 GLSL 变量
const texcoordF = v_st.multiply(size);  // 生成 v_st * vec2(textureSize(diffuse, 0) - 1) 而非 v_st * size
```

**内联 vs 局部变量的区别：**

```glsl
// ❌ 不使用 let_ 生成的代码（内联，重复计算）:
color = mix(mix(texelFetch(diffuse, ivec2(v_st * vec2(textureSize(diffuse, 0) - 1)), 0), ...));

// ✅ 使用 let_ 生成的代码（与原始一致）:
vec2 size = vec2(textureSize(diffuse, 0) - 1);
vec2 texcoord = v_st * size;
ivec2 coord = ivec2(texcoord);
vec4 texel00 = texelFetch(diffuse, coord + ivec2(0, 0), 0);
...
color = mix(texel0, texel1, sampleCoord.x);
```

### 类型转换

TSL 支持向量类型之间的转换，必须使用与 GLSL 相同的结构：

```typescript
// ✅ 正确：与原始 GLSL 结构一致
// 原始 GLSL: vec2 size = vec2(textureSize(diffuse, 0) - 1);
const size = vec2(textureSize(diffuse, 0).subtract(1));

// ✅ 正确：ivec2 转 vec2
// 原始 GLSL: vec2 floatCoord = vec2(intCoord);
const floatCoord = vec2(intCoord);  // intCoord 是 IVec2 类型

// ✅ 正确：vec2 转 ivec2
// 原始 GLSL: ivec2 coord = ivec2(texcoord);
const coord = ivec2(texcoordF);  // texcoordF 是 Vec2 类型

// ❌ 错误：使用分量构造，生成代码不一致
const size = textureSize(diffuse, 0).subtract(ivec2(1, 1));
const texcoordF = v_st.multiply(vec2(size.x, size.y));  // 生成 vec2(size.x, size.y) 而非 vec2(size)
```

### 标量运算（广播）

整数向量支持与标量的运算，GLSL 会自动广播：

```typescript
// ✅ 正确：标量减法
// 原始 GLSL: ivec2 result = textureSize(diffuse, 0) - 1;
const result = textureSize(diffuse, 0).subtract(1);  // 生成 textureSize(diffuse, 0) - 1

// ❌ 错误：使用 ivec2 构造
const result = textureSize(diffuse, 0).subtract(ivec2(1, 1));  // 生成 textureSize(diffuse, 0) - ivec2(1, 1)
```

### 纹理相关函数

```typescript
import { texelFetch, textureSize, fract } from '@feng3d/tsl';

// textureSize - 获取纹理尺寸（返回 IVec2）
const texSize = textureSize(diffuse, 0);  // 第二个参数是 mip level

// texelFetch - 直接获取纹素（不过滤）
const texel = texelFetch(diffuse, coord, 0);  // coord 是 IVec2，第三个参数是 mip level

// fract - 取小数部分
const fractPart = fract(texcoordF);  // 支持 Float 和 Vec2
```

### 完整示例（手动双线性过滤）

```typescript
// 原始 GLSL:
// vec2 size = vec2(textureSize(diffuse, 0) - 1);
// vec2 texcoord = v_st * size;
// ivec2 coord = ivec2(texcoord);
// vec4 texel00 = texelFetch(diffuse, coord + ivec2(0, 0), 0);

// TSL 实现（保持结构一致）:
const size = vec2(textureSize(diffuse, 0).subtract(1));
const texcoordF = v_st.multiply(size);
const coord = ivec2(texcoordF);
const texel00 = texelFetch(diffuse, coord.add(ivec2(0, 0)), 0);
```

## TSL API 常用写法

### 基础类型和属性

```typescript
// 属性（attribute）
const position = attribute('position', vec2(), 0);  // location 0
const texcoord = attribute('texcoord', vec2(), 4);  // location 4

// Uniform
const MVP = mat4(uniform('MVP'));
const diffuse = sampler2D(uniform('diffuse'));       // 普通纹理：用 sampler2D
const depth = depthSampler(uniform('depthMap'));   // 深度纹理：用 depthSampler

// Varying（独立声明，WGSL 生成时自动创建 VertexOutput/FragmentInput）
const v_st = vec2(varying('v_st'));
```

### 运算操作

```typescript
// 矩阵乘法：用 .multiply()，不是 mul()
MVP.multiply(vec4(position, 0.0, 1.0))

// 链式调用
uProjectionMatrix.multiply(uModelViewMatrix).multiply(position)

// 普通纹理采样
texture(diffuse, v.v_st)

// 带 LOD bias 的纹理采样（用于控制 mipmap 级别偏移）
texture(diffuse, v.v_st, lodBias)  // lodBias 可以是 Float 或 number

// 深度纹理采样（返回 f32）
texture(depthMap, v.v_st).r
```

### 数学函数

```typescript
import { sqrt, pow, sin, cos, mix, clamp, step, smoothstep, normalize, dot, max, exp, reflect } from '@feng3d/tsl';

// 平方根
const len = sqrt(x);

// 幂运算
const squared = pow(x, 2.0);

// 线性插值
const color = mix(colorA, colorB, t);  // 注意：使用函数而非方法

// 钳制
const clamped = clamp(value, 0.0, 1.0);

// 阶跃
const s = step(edge, x);

// 平滑阶跃
const ss = smoothstep(0.0, 1.0, x);

// 反射向量（用于镜面反射光照计算）
// reflect(I, N) = I - 2.0 * dot(N, I) * N
const r = reflect(incident, normal);
```

### 向量取反操作

```typescript
// Vec3 取反：返回 -this
const negV = v.negate();  // 生成 -v

// 常用于光照计算中的反射向量取反
const r = reflect(l, n).negate();  // 生成 -reflect(l, n)

// 替代 float(-1.0).multiply(vec) 的写法
// ❌ 旧写法（需要类型转换）
const negView = float(-1.0).multiply(pEC.xyz);

// ✅ 新写法（更清晰）
const negView = pEC.xyz.negate();
```

### 三元条件选择（select）

**遇到 GLSL 中的 `cond ? a : b` 三元运算符，使用 `select` 函数**：

```typescript
import { select } from '@feng3d/tsl';

// 三元条件选择
// 生成 GLSL: (condition ? trueValue : falseValue)
// 生成 WGSL: select(falseValue, trueValue, condition)
// 注意：WGSL 不支持三元运算符 ? :
const result = select(condition, trueValue, falseValue);

// 示例：v_attr >= 0 时使用插值颜色，否则使用黄色
const blue = vec4(0.0, 0.0, 1.0, 1.0);
const yellow = vec4(1.0, 1.0, 0.0, 1.0);
color.assign(select(v_attr.greaterThanOrEqual(0.0), mix(blue, yellow, sqrt(v_attr)), yellow));
```

### 条件语句（if/else）

**遇到 GLSL 中的 `if (cond) { ... } else { ... }` 语句，使用 `if_`/`else` 结构**：

```typescript
import { if_ } from '@feng3d/tsl';

// if/else 条件判断
// 生成 GLSL: if (condition) { ... } else { ... }
// 生成 WGSL: if (condition) { ... } else { ... }
if_(condition, () => {
    // 条件满足时执行
    color.assign(trueValue);
}).else(() => {
    // 条件不满足时执行
    color.assign(falseValue);
});
```

**仅 if 分支（无 else）：**

```typescript
if_(condition, () => {
    // 仅在条件满足时执行
    color.assign(red);
});
```

### 比较运算

```typescript
// Float 类型的比较方法
const a = float(1.0);
const b = float(2.0);

a.lessThan(b)           // a < b
a.lessThanOrEqual(b)    // a <= b
a.greaterThan(b)        // a > b
a.greaterThanOrEqual(b) // a >= b
a.equals(b)             // a == b

// 与数字比较
a.greaterThanOrEqual(0.0)  // a >= 0.0
```

### Uniform Buffer Object (UBO) 和数组索引

**使用 `uniformBlock` 定义包含数组的 UBO：**

```typescript
import { uniformBlock, gl_InstanceID, int, Mat4ArrayMember, Vec4ArrayMember, varying, vec4 } from '@feng3d/tsl';

// 定义 Transform UBO（包含 MVP 矩阵数组）
const Transform = uniformBlock({
    blockName: 'Transform',
    instanceName: 'transform',
    members: [
        { name: 'MVP', type: 'mat4', length: 2 }
    ]
});

// 定义 Material UBO（包含颜色数组）
const Material = uniformBlock({
    blockName: 'Material',
    instanceName: 'material',
    members: [
        { name: 'Diffuse', type: 'vec4', length: 2 }
    ]
});

// flat varying 传递实例 ID
const v_instance = int(varying('v_instance', { interpolation: 'flat' }));

// 在顶点着色器中使用数组索引（需要类型断言）
v_instance.assign(int(gl_InstanceID));
const mvp = (Transform.MVP as Mat4ArrayMember).index(gl_InstanceID);  // 根据实例 ID 索引 MVP
gl_Position.assign(mvp.multiply(vec4(pos, 0.0, 1.0)));

// 在片段着色器中使用数组索引（需要类型断言）
const color = (Material.Diffuse as Vec4ArrayMember).index(v_instance);  // 根据实例 ID 索引颜色
return_(color);
```

**类型断言说明**：由于 `UniformBlock` 的动态属性使用 `[key: string]: any` 索引签名，TypeScript 无法自动推断成员类型，因此需要手动添加类型断言：
- `mat4` 数组成员使用 `as Mat4ArrayMember`
- `vec4` 数组成员使用 `as Vec4ArrayMember`

**绑定资源传递 UBO 数据：**

```typescript
const renderObject = {
    bindingResources: {
        Transform: {
            value: {
                MVP: [mvp0Float32Array, mvp1Float32Array]
            }
        },
        Material: {
            value: {
                Diffuse: [
                    [1.0, 0.5, 0.0, 1.0],  // 橙色
                    [0.0, 0.5, 1.0, 1.0]   // 蓝色
                ]
            }
        }
    },
    // ...
};
```

**GLSL 生成代码：**

```glsl
layout(std140, column_major) uniform;
uniform Transform {
    mat4 MVP[2];
} transform;
// 使用: transform.MVP[gl_InstanceID]
```

**WGSL 生成代码：**

```wgsl
@group(0) @binding(0) var<uniform> MVP: array<mat4x4<f32>, 2>;
// 使用: MVP[input.instance_index]
```

**支持的数组元素类型：**
- `mat4` - 4x4 矩阵
- `vec4` - 4 维向量

### 整数类型操作

```typescript
// Int 类型
const v_instance = int(varying('v_instance', { interpolation: 'flat' }));

// 赋值
v_instance.assign(int(gl_InstanceID));
v_instance.assign(0);

// 比较
v_instance.equals(0)  // v_instance == 0

// 从 UInt 转换为 Int
const intVal = int(gl_InstanceID);  // gl_InstanceID 是 UInt
```

### Varying 插值选项

```typescript
// 普通 varying（默认 perspective + center 插值）
const v_attr = float(varying('v_attr'));

// 指定 location
const v_color = vec4(varying('v_color', { location: 0 }));
// 或使用简写形式（向后兼容）
const v_color = vec4(varying('v_color', 0));

// centroid 插值（避免多重采样时的边缘外推）
const v_attr = float(varying('v_attr', { sampling: 'centroid' }));
// 生成 GLSL: centroid in/out float v_attr;
// 生成 WGSL: @location(0) @interpolate(perspective, centroid) v_attr: f32

// flat 插值（不进行插值，使用第一个顶点的值）
const v_id = int(varying('v_id', { interpolation: 'flat' }));

// linear 插值（无透视校正）
const v_ndc = vec2(varying('v_ndc', { interpolation: 'linear' }));

// 完整选项
const v_attr = float(varying('v_attr', {
    location: 0,                    // WGSL location
    interpolation: 'perspective',   // 'perspective' | 'linear' | 'flat'
    sampling: 'centroid'            // 'center' | 'centroid' | 'sample'
}));
```

### 完整示例（带纹理）

```typescript
import { attribute, fragment, gl_Position, mat4, precision, return_, sampler2D, texture, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

const position = attribute('position', vec2(), 0);
const texcoord = attribute('texcoord', vec2(), 4);
const MVP = mat4(uniform('MVP'));

// Varying 变量独立声明
const v_st = vec2(varying('v_st'));

export const vertexShader = vertex('main', () => {
    precision('highp', 'float');
    precision('highp', 'int');
    v_st.assign(texcoord);
    gl_Position.assign(MVP.multiply(vec4(position, 0.0, 1.0)));
});

const diffuse = sampler2D(uniform('diffuse'));

export const fragmentShader = fragment('main', () => {
    precision('highp', 'float');
    precision('highp', 'int');
    return_(texture(diffuse, v_st));
});
```

## 常见错误

| 错误写法 | 正确写法 | 说明 |
|---------|---------|------|
| `mul(a, b)` | `a.multiply(b)` | 矩阵/向量乘法 |
| `vec4.mix(other, t)` | `mix(a, b, t)` | 插值使用函数，非方法 |
| `value >= 0.0` | `value.greaterThanOrEqual(0.0)` | 比较运算使用方法 |
| `cond ? a : b` | `select(cond, a, b)` | 三元运算符用 select |
| `if (cond) {...}` | `if_(cond, () => {...})` | if 语句用 if_ |
| `sampler2D(uniform('name'))` | 旧写法 `sampler2D('name')` | 纹理采样器 |
| 普通 sampler 用于深度纹理 | `depthSampler(uniform('depth'))` | 深度纹理需要特殊类型 |
| WGSL 深度纹理用 `textureSample` | 用 `textureLoad` | 深度纹理不支持过滤采样 |
| WGSL 深度纹理用 `texture_2d<f32>` | 用 `texture_depth_2d` | 深度纹理有专用类型 |

## 参考示例

根据功能复杂度选择参考：
- `draw_primitive_restart/` - 基础模板（无纹理，双渲染）
- `draw_range_arrays/` - 视口分割绘制（双渲染）
- `draw_image_space/` - 纹理采样（双渲染）
- `draw_instanced_ubo/` - UBO 和数组索引（uniformBlock，gl_InstanceID）
- `query_occlusion/` - 遮挡查询（OcclusionQuery）
- `sampler_filter/` - 纹理过滤模式（4视口，双渲染）
- `sampler_wrap/` - 纹理包裹模式（4视口，双渲染）
- `texture_lod/` - 纹理 LOD bias 控制（4视口，鼠标交互，双渲染）
- `texture_offset/` - textureOffset 和 texelFetchOffset（偏移纹理采样，双渲染）
- `fbo_multisample/` - 多重采样 + 两阶段渲染（双渲染）
- `fbo_rtt_depth_texture/` - 深度纹理渲染（双渲染，深度纹理处理）
- `glsl_centroid/` - centroid 插值（varying 插值选项，select 三元条件选择）
- `fbo_blit/` - 仅 WebGL 支持（BlitFramebuffer）
- `webgl-examples/sample5/` - 完整 MVP 变换

## 调试技巧

注释掉 TSL 生成代码，即可切换到原始着色器调试：

```typescript
// const vertexGlsl = vertexShader.toGLSL(2);
// const fragmentGlsl = fragmentShader.toGLSL(2);
// const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });
// const fragmentWgsl = fragmentShader.toWGSL(vertexShader);
```

**重要**：导入的着色器变量名必须与 TSL 生成的变量名相同，这样才能通过简单注释切换。

## TSL 代码规范

### 函数重载签名规范

**允许使用以下便捷联合类型**，以提高使用便利性：
- `Float | number` - 允许直接传入数字而无需 `float()` 包装
- `Bool | boolean` - 允许直接传入布尔值而无需 `bool()` 包装
- `Int | number` - 允许直接传入整数而无需 `int()` 包装

```typescript
// ✅ 允许：使用便捷联合类型
export function smoothstep(edge0: Float | number, edge1: Float | number, x: Float | number): Float;
export function vec4(x: Float | number, y: Float | number, z: Float | number, w: Float | number): Vec4;

// ✅ 允许：字面量联合
export function precision(value: 'lowp' | 'mediump' | 'highp'): Precision;

// ✅ 允许：返回类型使用联合类型
export function fract(x: Float | Vec2 | number): Float | Vec2;
```

**需要独立重载的情况**：当不同类型组合导致不同的返回类型时，需要创建独立的重载签名：

```typescript
// 需要独立重载：返回类型不同
export function fract(x: Float | number): Float;
export function fract(x: Vec2): Vec2;
export function fract(x: Float | Vec2 | number): Float | Vec2
{
    // 实现...
}
```

### 采样器类型规范

**不使用内部抽象类 `Sampler`**，在重载签名中明确使用具体的采样器类型：

```typescript
// ❌ 错误：使用内部抽象类
export function texture(sampler: Sampler, coord: Vec2): Vec4;

// ✅ 正确：使用具体类型
export function texture(sampler: Sampler2D, coord: Vec2): Vec4;
export function texture(sampler: DepthSampler, coord: Vec2): Vec4;
export function texture(sampler: Sampler3D, coord: Vec3): Vec4;
export function texture(sampler: Sampler2DArray, coord: Vec3): Vec4;
```
