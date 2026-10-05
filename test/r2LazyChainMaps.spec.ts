import { WGPUBindGroup } from '../packages/webgpu/src/caches/WGPUBindGroup';
import { WGPUBindGroupEntry } from '../packages/webgpu/src/caches/WGPUBindGroupEntry';
import { WGPUBindGroupLayout } from '../packages/webgpu/src/caches/WGPUBindGroupLayout';
import { WGPUBlendState } from '../packages/webgpu/src/caches/WGPUBlendState';
import { WGPUBuffer } from '../packages/webgpu/src/caches/WGPUBuffer';
import { WGPUBufferBinding } from '../packages/webgpu/src/caches/WGPUBufferBinding';
import { WGPUCanvasContext } from '../packages/webgpu/src/caches/WGPUCanvasContext';
import { WGPUCanvasTexture } from '../packages/webgpu/src/caches/WGPUCanvasTexture';
import { WGPUColorTargetState } from '../packages/webgpu/src/caches/WGPUColorTargetState';
import { WGPUComputePipeline } from '../packages/webgpu/src/caches/WGPUComputePipeline';
import { WGPUDepthStencilState } from '../packages/webgpu/src/caches/WGPUDepthStencilState';
import { WGPUExternalTexture } from '../packages/webgpu/src/caches/WGPUExternalTexture';
import { WGPUFragmentState } from '../packages/webgpu/src/caches/WGPUFragmentState';
import { WGPUPipelineLayout } from '../packages/webgpu/src/caches/WGPUPipelineLayout';
import { WGPUPrimitiveState } from '../packages/webgpu/src/caches/WGPUPrimitiveState';
import { WGPUQuerySet } from '../packages/webgpu/src/caches/WGPUQuerySet';
import { WGPURenderBundle } from '../packages/webgpu/src/caches/WGPURenderBundle';
import { WGPURenderPass } from '../packages/webgpu/src/caches/WGPURenderPass';
import { WGPURenderPassColorAttachment } from '../packages/webgpu/src/caches/WGPURenderPassColorAttachment';
import { WGPURenderPassDepthStencilAttachment } from '../packages/webgpu/src/caches/WGPURenderPassDepthStencilAttachment';
import { WGPURenderPassDescriptor } from '../packages/webgpu/src/caches/WGPURenderPassDescriptor';
import { WGPURenderPipeline } from '../packages/webgpu/src/caches/WGPURenderPipeline';
import { WGPUSampler } from '../packages/webgpu/src/caches/WGPUSampler';
import { WGPUShaderModule } from '../packages/webgpu/src/caches/WGPUShaderModule';
import { WGPUTexture } from '../packages/webgpu/src/caches/WGPUTexture';
import { WGPUTextureView } from '../packages/webgpu/src/caches/WGPUTextureView';
import { WGPUTimestampQuery } from '../packages/webgpu/src/caches/WGPUTimestampQuery';
import { WGPUVertexBufferLayout } from '../packages/webgpu/src/caches/WGPUVertexBufferLayout';
import { WGPUVertexState } from '../packages/webgpu/src/caches/WGPUVertexState';
import { Buffer } from '../packages/webgpu/src/data/Buffer';
import { ChainMap } from '../packages/webgpu/src/utils/ChainMap';
import { describe, expect, it } from 'vitest';

/**
 * `webgpu/src/caches/*` 里 30 处 `ChainMap` 缓存 lazy-init 的**行为**回归（issue #614 欠账批）。
 *
 * 背景：这些类原先写的是「类 `static` 字段初始化器 `= new ChainMap()`」——`ChainMap` 不是
 * `Map` / `WeakMap` / `Set` / `WeakSet`，所以既不在 R2 自研规则的候选名单里、也不在
 * `check-module-side-effects.mjs` 的「缓存创建」判据里，只被 `check-toplevel-new.mjs` 的
 * 基线冻着（import 期实打实分配）。本批按 PR #630 的范式改成「`private static _xxx = null`
 * + `static get xxx()` 首次访问创建」。
 *
 * 门禁只能证明「import 时不再分配」，证明不了「第一次访问仍然拿到同一个容器、缓存语义没变」，
 * 这份用例补的是后半句，分三层：
 *   ① **30 处**私有存储在 import 期必须是 `null`（否则 lazy 是假的，只是换了个位置写 `new`）；
 *   ② 访问 getter 后私有存储必须变成那个容器，且**两次访问是同一实例**；
 *   ③ 走**真实业务入口**（`getInstance` / `getGPU*`）验证「同一输入两次调用 → 同一实例」，
 *      以及 `destroy()` 后缓存条目被清掉、再取是新实例（清理路径没被 lazy 化打断）。
 *
 * **为什么能断言 `null`**：本文件只 import 这些缓存类本身，而 R2 的目标就是「import 这些模块
 * 不产生副作用」，vitest 又按文件隔离模块图，所以「读到 null」就是「import 期没有分配」的直接证据。
 *
 * **GPU 桩**：`vitest.setup.ts` 明确不模拟 WebGPU 设备（见其头注释），所以③用最小假 device——
 * 所有 GPU 调用都发生在 `computed(...)` 里、是惰性的，构造器只做 `map.set` / `trackCreate` /
 * `destroyCall`，因此不需要真 GPU。少数必须真着色器反射或复杂数据形状的入口
 * （`WGPUPipelineLayout.getGPUPipelineLayout` / `WGPUBindGroupEntry` / `WGPUShaderModule`
 * 的编译信息检查等）只在①②里覆盖。
 */
describe('webgpu caches 的 ChainMap 缓存 lazy-init（issue #614 欠账批）', () =>
{
    /** `[说明, 类, 私有存储字段, 公开缓存字段]`：本批改造的全部 30 处。 */
    const lazyCaches: [string, object, string, string][] = [
        ['WGPUBindGroup.gpuBindGroupMap', WGPUBindGroup, '_gpuBindGroupMap', 'gpuBindGroupMap'],
        ['WGPUBindGroup.map', WGPUBindGroup, '_map', 'map'],
        ['WGPUBindGroupEntry.map', WGPUBindGroupEntry, '_map', 'map'],
        ['WGPUBindGroupLayout.map', WGPUBindGroupLayout, '_map', 'map'],
        ['WGPUBlendState.map', WGPUBlendState, '_map', 'map'],
        ['WGPUBuffer.map', WGPUBuffer, '_map', 'map'],
        ['WGPUBufferBinding.map', WGPUBufferBinding, '_map', 'map'],
        ['WGPUCanvasContext.map', WGPUCanvasContext, '_map', 'map'],
        ['WGPUCanvasTexture.map', WGPUCanvasTexture, '_map', 'map'],
        ['WGPUColorTargetState.map', WGPUColorTargetState, '_map', 'map'],
        ['WGPUComputePipeline.map', WGPUComputePipeline, '_map', 'map'],
        ['WGPUDepthStencilState.map', WGPUDepthStencilState, '_map', 'map'],
        ['WGPUExternalTexture.map', WGPUExternalTexture, '_map', 'map'],
        ['WGPUFragmentState.map', WGPUFragmentState, '_map', 'map'],
        ['WGPUPipelineLayout.map', WGPUPipelineLayout, '_map', 'map'],
        ['WGPUPrimitiveState.map', WGPUPrimitiveState, '_map', 'map'],
        ['WGPUQuerySet.map', WGPUQuerySet, '_map', 'map'],
        ['WGPURenderBundle.map', WGPURenderBundle, '_map', 'map'],
        ['WGPURenderPass.map', WGPURenderPass, '_map', 'map'],
        ['WGPURenderPassColorAttachment.map', WGPURenderPassColorAttachment, '_map', 'map'],
        ['WGPURenderPassDepthStencilAttachment.map', WGPURenderPassDepthStencilAttachment, '_map', 'map'],
        ['WGPURenderPassDescriptor.map', WGPURenderPassDescriptor, '_map', 'map'],
        ['WGPURenderPipeline.map', WGPURenderPipeline, '_map', 'map'],
        ['WGPUSampler.map', WGPUSampler, '_map', 'map'],
        ['WGPUShaderModule.map', WGPUShaderModule, '_map', 'map'],
        ['WGPUTexture.map', WGPUTexture, '_map', 'map'],
        ['WGPUTextureView.map', WGPUTextureView, '_map', 'map'],
        ['WGPUTimestampQuery.map', WGPUTimestampQuery, '_map', 'map'],
        ['WGPUVertexBufferLayout.map', WGPUVertexBufferLayout, '_map', 'map'],
        ['WGPUVertexState.map', WGPUVertexState, '_map', 'map'],
    ];

    /** 读静态成员（含 `private static`、`static get`）：运行时无可见性，`Readonly` 只存在于编译期。 */
    const read = (cls: object, key: string) => (cls as unknown as Record<string, unknown>)[key];

    /**
     * 最小假 device：任何方法调用都返回一个新的普通对象（可作 `WeakMap` 键）。
     * `createShaderModule` 额外补 `getCompilationInfo()`，因为 `getGPUShaderModule` 会同步调它。
     */
    function makeDevice(): GPUDevice
    {
        const created = new Map<string, unknown[]>();

        return new Proxy({}, {
            get(_target, prop)
            {
                if (prop === 'then') return undefined;

                return () =>
                {
                    const list = created.get(String(prop)) ?? [];

                    created.set(String(prop), list);
                    const value: Record<string, unknown> = {};

                    if (prop === 'createShaderModule')
                    {
                        value.getCompilationInfo = () => Promise.resolve({ messages: [] });
                    }

                    list.push(value);

                    return value;
                };
            },
        }) as unknown as GPUDevice;
    }

    it('① 30 处私有存储在 import 期都为 null', () =>
    {
        expect(lazyCaches).toHaveLength(30);

        for (const [name, cls, store] of lazyCaches)
        {
            expect(read(cls, store), `${name}：import 期不应分配容器`).toBeNull();
        }
    });

    it('② 首次访问才创建容器，且两次访问是同一实例', () =>
    {
        for (const [name, cls, store, pub] of lazyCaches)
        {
            expect(read(cls, store), `${name}：访问前仍为 null`).toBeNull();

            const first = read(cls, pub);

            expect(first, `${name}：首次访问应创建容器`).not.toBeNull();
            expect(read(cls, store), `${name}：私有存储应指向该容器`).toBe(first);
            expect(read(cls, pub), `${name}：二次访问应拿回同一容器`).toBe(first);
        }
    });

    it('③ 同一输入两次调用 getInstance 拿回同一实例（缓存语义未变）', () =>
    {
        const device = makeDevice();
        const blendState = {};
        const colorTargetState = {};
        const primitiveState = {};
        const depthStencilState = {};
        const buffer = Buffer.getBuffer(new ArrayBuffer(16));
        const bindGroupLayoutEntry = {};
        const bindGroupLayout = { entries: [] };
        const fragmentState = {};
        const vertexState = {};
        const vertexAttributes = {};
        const sampler = {};
        const computePipeline = {};
        const renderPass = {};
        const renderPassDescriptor = {};
        const texture = {};
        const textureView = {};
        const renderPipeline = {};
        const bindingResources = {};
        const colorAttachments: string[] = [];

        const pairs: [string, () => unknown][] = [
            ['WGPUBlendState', () => WGPUBlendState.getInstance(blendState as never)],
            ['WGPUColorTargetState', () => WGPUColorTargetState.getInstance(colorTargetState as never, 'bgra8unorm')],
            ['WGPUPrimitiveState', () => WGPUPrimitiveState.getInstance(primitiveState as never, 'uint16')],
            ['WGPUDepthStencilState', () => WGPUDepthStencilState.getInstance(depthStencilState as never, 'depth24plus')],
            ['WGPUFragmentState', () => WGPUFragmentState.getInstance(device, fragmentState as never, colorAttachments as never)],
            ['WGPUVertexState', () => WGPUVertexState.getInstance(device, vertexState as never, vertexAttributes as never)],
            ['WGPUVertexBufferLayout', () => WGPUVertexBufferLayout.getInstance(vertexState as never, vertexAttributes as never)],
            ['WGPUBuffer', () => WGPUBuffer.getInstance(device, buffer)],
            ['WGPUSampler', () => WGPUSampler.getInstance(device, sampler as never)],
            ['WGPUComputePipeline', () => WGPUComputePipeline.getInstance(device, computePipeline as never)],
            ['WGPUQuerySet', () => WGPUQuerySet.getInstance(device, renderPass as never)],
            ['WGPURenderPass', () => WGPURenderPass.getInstance(device, renderPass as never, undefined)],
            ['WGPURenderPassDescriptor', () => WGPURenderPassDescriptor.getInstance(device, renderPassDescriptor as never, undefined)],
            ['WGPUTexture', () => WGPUTexture.getInstance(device, texture as never)],
            ['WGPUTextureView', () => WGPUTextureView.getInstance(device, textureView as never)],
            ['WGPURenderPipeline', () => WGPURenderPipeline.getInstance(device, renderPipeline as never, renderPassDescriptor as never, vertexAttributes as never, 'uint16')],
            ['WGPUBindGroup', () => WGPUBindGroup.getInstance(device, bindGroupLayout as never, bindingResources as never)],
            ['WGPUBindGroupLayout', () => WGPUBindGroupLayout.getGPUBindGroupLayout(device, bindGroupLayoutEntry as never)],
        ];

        for (const [name, call] of pairs)
        {
            const first = call();
            const second = call();

            expect(second, `${name}：同一输入应命中缓存`).toBe(first);
        }

        // 键里含 `code` 字符串的着色器模块缓存（假 device 的 `getCompilationInfo` 返回无消息）
        const shaderFirst = WGPUShaderModule.getGPUShaderModule(device, 'code-a');
        const shaderSecond = WGPUShaderModule.getGPUShaderModule(device, 'code-a');

        expect(shaderSecond).toBe(shaderFirst);
        expect(WGPUShaderModule.getGPUShaderModule(device, 'code-b')).not.toBe(shaderFirst);

        // 同一份输入绑定到不同 device 时必须各建一份（缓存键含 device）
        const otherDevice = makeDevice();

        expect(WGPUBindGroupLayout.getGPUBindGroupLayout(otherDevice, bindGroupLayoutEntry as never))
            .not.toBe(WGPUBindGroupLayout.getGPUBindGroupLayout(device, bindGroupLayoutEntry as never));
    });

    it('④ destroy() 仍能拿回同一容器完成清理，再取时是新实例', () =>
    {
        const blendState = {};
        const first = WGPUBlendState.getInstance(blendState as never);
        const map = read(WGPUBlendState, 'map') as ChainMap<[unknown], WGPUBlendState>;

        expect(map.get([blendState])).toBe(first);

        first.destroy();

        // 清理路径走的是同一个 lazy 容器：条目已删除，再取时必然新建
        expect(map.get([blendState])).toBeUndefined();
        expect(WGPUBlendState.getInstance(blendState as never)).not.toBe(first);
    });
});
