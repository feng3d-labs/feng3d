import { EventEmitter } from '../packages/event/src/EventEmitter';
import type { IEventTarget } from '../packages/event/src/IEventTarget';
import { WGPUMultisampleState } from '../packages/webgpu/src/caches/WGPUMultisampleState';
import { WGPUPipelineLayout } from '../packages/webgpu/src/caches/WGPUPipelineLayout';
import { WGPUStencilFaceState } from '../packages/webgpu/src/caches/WGPUStencilFaceState';
import { Buffer } from '../packages/webgpu/src/data/Buffer';
import type { MultisampleState } from '../packages/webgpu/src/data/MultisampleState';
import type { StencilFaceState } from '../packages/webgpu/src/data/StencilFaceState';
import { describe, expect, it } from 'vitest';

/**
 * R2 模块级缓存 lazy-init 的**行为**回归（issue #614）。
 *
 * 背景：`scripts/check-module-side-effects.mjs --strict` 判「import 时分配缓存容器」为违规，
 * 于是一批「类 `static` 字段 `= new Map()`」被改成「`static get` + `_xxx: T | null = null`，
 * 首次访问时创建」。门禁（AST 判据）只能证明**模块 import 时不再分配**，
 * 证明不了**第一次访问仍然拿到同一个容器、缓存语义没变**——这份用例补的是后半句
 * （任务里的口径："调两次只创建一次"）。
 *
 * 两件事分开断言，因为它们是 lazy 化的两面：
 *   ① 私有存储字段 `_xxx` 在调用前必须是 `null`（否则 lazy 是假的，只是换了个位置写 `new`）；
 *   ② 同一输入第二次调用必须拿回**同一实例**（缓存命中，行为与 lazy 化之前一致）。
 *
 * 为什么能断言 `null`：本文件只 import 这几个模块本身，**不** import 那些在模块顶层
 * `new` 出实例的模块（如 `packages/event/src/GlobalEmitter.ts`），vitest 又按文件隔离模块图，
 * 所以「读到 null」就是「import 期没有分配」的直接证据。
 *
 * 这里**不**覆盖 `reactivity` 的两处（`PropertyReactivity._targetMap` / `EffectReactivity.pausedQueueEffects`）：
 * 它们的 lazy 存储只在响应式读写路径上建立，而那条路径已有大量既有用例
 * （`packages/reactivity/test/{reactive,effect,computed,collections}.spec.ts`）覆盖，
 * 重复断言实现细节收益不大。
 */
describe('R2 模块级缓存 lazy-init（issue #614）', () =>
{
    it('EventEmitter：三张注册表首次访问才创建，发射器按目标复用', () =>
    {
        const internals = EventEmitter as unknown as {
            _targetEmitterMap: Map<unknown, EventEmitter> | null;
            _emitterTargetMap: Map<EventEmitter, IEventTarget> | null;
            _emitterListenerMap: Map<EventEmitter, unknown> | null;
        };

        // ① import 期没有分配（这三张表原来就是模块级 `private static ... = new Map()`）
        expect(internals._targetEmitterMap).toBeNull();
        expect(internals._emitterTargetMap).toBeNull();
        expect(internals._emitterListenerMap).toBeNull();

        const target: IEventTarget = {};
        const emitter = EventEmitter.getOrCreateEventEmitter(target);

        // 首次访问建成「目标 → 发射器」「发射器 → 目标」两张表
        expect(internals._targetEmitterMap).not.toBeNull();
        expect(internals._emitterTargetMap!.get(emitter)).toBe(target);
        expect(internals._targetEmitterMap!.get(target)).toBe(emitter);

        // ② 第二次调用命中缓存（lazy 化前后必须一致）
        expect(EventEmitter.getOrCreateEventEmitter(target)).toBe(emitter);
        expect(EventEmitter.getEventEmitter(target)).toBe(emitter);

        // 监听表照常参与事件路由
        const received: string[] = [];
        emitter.on('ping', () => { received.push('ping'); });
        emitter.emit('ping');

        expect(received).toEqual(['ping']);
        expect(emitter.listenerCount('ping')).toBe(1);
    });

    it('Buffer：缓冲区配置缓存首次调用才创建，同一 ArrayBuffer 复用同一配置', () =>
    {
        const internals = Buffer as unknown as { _bufferMap: WeakMap<ArrayBufferLike, Buffer> | null };

        expect(internals._bufferMap).toBeNull();

        const arrayBuffer = new ArrayBuffer(16);
        const buffer = Buffer.getBuffer(arrayBuffer);

        expect(internals._bufferMap).not.toBeNull();
        expect(Buffer.getBuffer(arrayBuffer)).toBe(buffer);
        expect(Buffer.getBuffer(new ArrayBuffer(16))).not.toBe(buffer);
        expect(buffer.size).toBe(16);
    });

    it('WGPU 状态缓存首次调用才创建，同一状态对象复用同一实例', () =>
    {
        const multisampleInternals = WGPUMultisampleState as unknown as { _map: Map<MultisampleState, WGPUMultisampleState> | null };

        expect(multisampleInternals._map).toBeNull();

        const multisampleState: MultisampleState = { mask: 0xFF, alphaToCoverageEnabled: true };
        const multisampleStateInstance = WGPUMultisampleState.getInstance(multisampleState);

        expect(multisampleInternals._map).not.toBeNull();
        expect(WGPUMultisampleState.getInstance(multisampleState)).toBe(multisampleStateInstance);

        const stencilInternals = WGPUStencilFaceState as unknown as { _map: Map<StencilFaceState, WGPUStencilFaceState> | null };

        expect(stencilInternals._map).toBeNull();

        const stencilFaceState: StencilFaceState = { compare: 'always' };
        const stencilFaceStateInstance = WGPUStencilFaceState.getInstance(stencilFaceState);

        expect(stencilInternals._map).not.toBeNull();
        expect(WGPUStencilFaceState.getInstance(stencilFaceState)).toBe(stencilFaceStateInstance);
    });

    it('WGPUPipelineLayout：管线布局缓存在 import 期未分配', () =>
    {
        // 该缓存的唯一入口 getGPUPipelineLayout 需要真 GPUDevice（device.createPipelineLayout），
        // 单测里没有可用的轻量路径，所以这里只守「import 时未分配」；写入路径由 GPU 端到端覆盖。
        const internals = WGPUPipelineLayout as unknown as { _pipelineLayoutMapCache: unknown };

        expect(internals._pipelineLayoutMapCache).toBeNull();
    });
});
