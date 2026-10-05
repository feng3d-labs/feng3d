# particlesystem

粒子系统（`@feng3d/particlesystem`）。

- **组件**：`ParticleSystem`（`__type__: 'ParticleSystem'`）。属于上层扩展包，依赖 `feng3d`（引擎不反向依赖它）。
- **渲染**：活跃粒子的实例属性（`a_particle_position` / `a_particle_scale` / `a_particle_rotation` /
  `a_particle_color` / `a_particle_tilingOffset` / `a_particle_flipUV`）交错进**一个**顶点缓冲，
  每帧由 `ParticleSystem._syncRenderData` 并入 `renderObject.vertices` 并用 `Buffer.writeBuffers` 增量上传；
  材质是引擎内置的 `ParticleMaterial`（`packages/feng3d/src/materials/ParticleMaterial.ts`），
  着色器见 `packages/feng3d/src/shaders/particleMaterial.ts`（手写 WGSL）。
- **示例**：[`examples/src/particlesystem/`](../../examples/src/particlesystem) ——
  `ParticleBasicTest`（基础发射）/ `ParticleAdditiveTest`（加性混合火焰）/ `ParticleShapesTest`（三种发射形状）。
- **文档**：https://feng3d.com/particlesystem

## 用法（纯数据声明式）

```ts
{
    __type__: 'Object3D',
    components: [{
        __type__: 'ParticleSystem',
        main: { startSpeed: { constant: 3 }, startSize: { constant: 0.4 } },
        material: {
            __type__: 'ParticleMaterial',
            // 粒子贴图是径向衰减的圆点，配 alpha 混合才不会看到方片黑底
            blend: {
                color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
                alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
            },
        },
    }],
}
```

> **过渡期说明**：`ParticleSystem` 与各模块目前仍是 class，纯数据字面量由 `particleSystemLogic`
> 按默认实例**递归补全**（`instantiateParticleSystem`）。彻底纯数据化（去掉 class、字段改可选）
> 是后续欠账——届时示例里的 `as unknown as Components` 断言可以一并去掉。
