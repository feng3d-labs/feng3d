# 快速开始

## 安装

```bash
npm install @feng3d/tsl
```

## 5 分钟上手

### 步骤 1：定义着色器变量

```typescript
import { attribute, uniform, vec2, vec4, vertex, fragment } from '@feng3d/tsl';

// 顶点属性 - 从顶点缓冲区读取
const position = attribute('position', vec2());

// Uniform 变量 - 从 CPU 传递
const color = uniform('color', vec4());
```

### 步骤 2：编写顶点着色器

```typescript
export const vertexShader = vertex('main', () => {
    // 将 2D 位置转换为 4D 齐次坐标
    return vec4(position, 0.0, 1.0);
});
```

### 步骤 3：编写片段着色器

```typescript
import { precision, return_ } from '@feng3d/tsl';

export const fragmentShader = fragment('main', () => {
    // 设置精度（GLSL 需要）
    precision('mediump', 'float');

    // 输出颜色
    return_(color);
});
```

### 步骤 4：生成着色器代码

```typescript
// 生成 WGSL (WebGPU)
const vertexWgsl = vertexShader.toWGSL();
const fragmentWgsl = fragmentShader.toWGSL();

console.log(vertexWgsl);
// 输出：
// struct VertexInput {
//   @location(0) position: vec2<f32>,
// }
// ...
```

### 步骤 5：在 WebGPU 中使用

```typescript
import { WebGPU } from '@feng3d/webgpu';

const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

const renderObject = {
    vertices: {
        position: { data: new Float32Array([-1, 0, 0, -1, 1, 1]), format: 'float32x2' }
    },
    bindingResources: { color: { value: [1, 0, 0, 1] } },
    pipeline: {
        vertex: { wgsl: vertexWgsl },
        fragment: { wgsl: fragmentWgsl }
    }
};

webgpu.submit({ commandEncoders: [{ passEncoders: [{ renderPassObjects: [renderObject] }] }] });
```

## 完整示例

```typescript
import { Submit } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';
import { attribute, fragment, uniform, vec2, vec4, vertex, precision, return_ } from '@feng3d/tsl';

// 定义着色器
const position = attribute('position', vec2());
const color = uniform('color', vec4());

const vertexShader = vertex('main', () => {
    return vec4(position, 0.0, 1.0);
});

const fragmentShader = fragment('main', () => {
    precision('mediump', 'float');
    return_(color);
});

// 生成 WGSL
const vertexWgsl = vertexShader.toWGSL();
const fragmentWgsl = fragmentShader.toWGSL();

// 初始化 WebGPU 并渲染
document.addEventListener('DOMContentLoaded', async () => {
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    const renderObject = {
        vertices: { position: { data: new Float32Array([-1, 0, 0, -1, 1, 1]), format: 'float32x2' } },
        bindingResources: { color: { value: [1, 0, 0, 1] } },
        pipeline: { vertex: { wgsl: vertexWgsl }, fragment: { wgsl: fragmentWgsl } }
    };

    webgpu.submit({ commandEncoders: [{ passEncoders: [{ renderPassObjects: [renderObject] }] }] });
});
```

## 下一步

- [API 参考](api.md) - 查看完整的 API 列表
- [示例](../examples/) - 查看更多示例代码
