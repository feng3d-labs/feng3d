## 计划：单独测试 StandardMaterial 颜色响应式

### 目标
隔离测试 `reactive(material.uniforms.u_diffuse).r = newValue` 是否能触发 GPU 重新上传颜色，排除点击拾取逻辑的干扰。

### 方案
在已有的 Container3DTest（已知渲染正常）中，利用 `ticker.onframe` 每隔 60 帧修改 cube 材质的 `u_diffuse` 随机颜色：

```ts
// Container3DTest.ts 新增
let num = 0;
ticker.onframe(() => {
    // 已有的旋转逻辑...
    num++;
    if (num % 60 === 0) {
        reactive(u_diffuseInput).r = Math.random();  // 已有的变色（Container3DTest 已验证可变色）
    }
});
```

Container3DTest **已经能变色**（使用 `u_diffuseInput`）。但 MousePickTest 使用 `u_diffuse`。两者的区别：
- Container3DTest：`u_diffuseInput`（Color4 纯数据，声明在 uniforms 中）
- MousePickTest：`u_diffuse`（Color4 纯数据，通过 applyDefaults 深拷贝填充）

### 测试步骤
1. 在 Container3DTest 中，把变色目标从 `u_diffuseInput` 改为 `u_diffuse`，验证 `u_diffuse` 字段本身是否响应式
2. 如果 `u_diffuse` 不变色但 `u_diffuseInput` 能变色 → 说明是 `u_diffuse` 字段（applyDefaults 深拷贝）的响应式链断裂
3. 如果两者都能变色 → 说明 MousePickTest 的问题是材质引用不匹配（点击拿到的 material 不是渲染用的那个）

### 根因假设
`applyDefaults` 的 `deepClone` 创建了新的 `u_diffuse` 对象，但可能 `WGPUBufferBinding` 的 effect 没有正确订阅 `Color4Logic` 的 computed（因为 `logic(value)` 的缓存时机或 `reactive(color4)` 的代理不匹配）。

### 修复方向（根据测试结果决定）
- 如果 `u_diffuse` 不响应式：检查 `WGPUBufferBinding` 中 `logic(value).value.value` 的响应式追踪是否正确建立，或改为直接 `reactive(value).r` 读取
- 如果材质引用不匹配：检查 MousePickTest 点击处理中获取 material 的路径