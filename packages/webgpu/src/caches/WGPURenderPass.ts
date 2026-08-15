import { Computed, computed, reactive } from '@feng3d/reactivity';
import { CanvasContext } from '../data/CanvasContext';
import { ChainMap } from '../utils/ChainMap';
import { OcclusionQuery } from '../data/OcclusionQuery';
import { RenderObject } from '../data/RenderObject';
import { RenderPass } from '../data/RenderPass';
import { RenderPassObject } from '../data/RenderPass';
import { RenderBundle } from '../data/RenderBundle';
import { runOcclusionQuery } from '../internal/runOcclusionQuery';
import { runRenderBundle } from '../internal/runRenderBundle';
import { runRenderObject } from '../internal/runRenderObject';
import { ReactiveObject } from '../ReactiveObject';
import { WGPURenderPassDescriptor } from './WGPURenderPassDescriptor';
import { WGPURenderPassEncoder } from './WGPURenderPassEncoder';

export class WGPURenderPass extends ReactiveObject
{
    get commands()
    {
        return this._computedCommands.value;
    }

    private _computedCommands: Computed<WGPURenderPassEncoder>;

    constructor(device: GPUDevice, renderPass: RenderPass, canvasContext?: CanvasContext)
    {
        super();
        this._onCreate(device, renderPass, canvasContext);

        //
        WGPURenderPass.map.set([device, renderPass, canvasContext], this);
        this.destroyCall(() =>
        {
            WGPURenderPass.map.delete([device, renderPass, canvasContext]);
        });
    }

    private _onCreate(device: GPUDevice, renderPass: RenderPass, canvasContext?: CanvasContext)
    {
        const r_renderPass = reactive(renderPass);

        // 自动 RenderBundle 化（框架设计文档 6.5）：连续 RenderObject 段打包为一个
        // bundle，命令编码一次、逐帧 executeBundles 重放——每帧 CPU 从 O(draw) 降到
        // O(段数)。
        //
        // 稳定性（缓存命中的前提）：分段方案按 renderPassObjects **数组身份**缓存——
        // 上游（View 的 renderPass computed）在数据无变化时写入同一数组引用，bundle
        // 包装对象稳定 → WGPURenderBundle 缓存命中，命令零重编码；数组变化（剔除/
        // 排序/增删对象）时重录，成本 ≈ 原逐帧直编，不劣化。
        // uniform 更新（相机/动画/材质参数）走 buffer 内容写入，不经过本 computed，
        // 不触发重录——这正是声明式绑定与 RenderBundle 契合的前提。
        let _plan: { src: readonly RenderPassObject[]; items: readonly RenderPassObject[] } | null = null;
        const sameElements = (a: readonly RenderPassObject[], b: readonly RenderPassObject[]): boolean =>
        {
            // 元素身份序列指纹：上游重建数组但元素复用（如相机移动触发 forward 重算、
            // RenderObject 实例缓存不变）时序列一致 → 复用 bundle，零重录
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++)
            {
                if (a[i] !== b[i]) return false;
            }

            return true;
        };
        const buildPlan = (src: readonly RenderPassObject[]): readonly RenderPassObject[] =>
        {
            const items: RenderPassObject[] = [];
            let runStart = -1;
            const flushRun = (end: number): void =>
            {
                if (runStart < 0) return;
                items.push({ __type__: 'RenderBundle', renderObjects: src.slice(runStart, end) } as RenderBundle);
                runStart = -1;
            };
            src.forEach((element, i) =>
            {
                if (!element.__type__ || element.__type__ === 'RenderObject')
                {
                    // 排序敏感对象（透明混合）排除在 bundle 外（设计 6.5）：
                    // 视距排序结果随相机逐帧变化，打包进 bundle 会在排序变化前一直重录，
                    // 不如逐帧直编；不透明主体仍进 bundle
                    const renderObject = element as RenderObject;
                    if (renderObject.pipeline?.fragment?.targets?.[0]?.blend)
                    {
                        flushRun(i);
                        items.push(element);

                        return;
                    }
                    if (runStart < 0) runStart = i;

                    return;
                }
                flushRun(i);
                items.push(element);
            });
            flushRun(src.length);
            _plan = { src, items };

            return items;
        };

        this._computedCommands = computed(() =>
        {
            r_renderPass.descriptor;
            r_renderPass.descriptor.attachmentSize;

            const wgpuRenderPassDescriptor = WGPURenderPassDescriptor.getInstance(device, renderPass.descriptor, canvasContext);
            const renderPassFormat = wgpuRenderPassDescriptor.renderPassFormat;

            const attachmentSize = renderPass.descriptor.attachmentSize;

            const passEncoder = new WGPURenderPassEncoder(device, renderPassFormat, attachmentSize);

            r_renderPass.renderPassObjects.concat();
            const src = renderPass.renderPassObjects;
            let items: readonly RenderPassObject[];
            if (_plan && (_plan.src === src || sameElements(_plan.src, src)))
            {
                // 数组身份相同或元素序列一致：复用分段与 bundle（源引用同步为新数组）
                if (_plan.src !== src) _plan = { src, items: _plan.items };
                items = _plan.items;
            }
            else
            {
                items = buildPlan(src);
            }
            items.forEach((element) =>
            {
                if (!element.__type__ || element.__type__ === 'RenderObject')
                {
                    runRenderObject(element as RenderObject, passEncoder);
                }
                else if (element.__type__ === 'RenderBundle')
                {
                    runRenderBundle(element as RenderBundle, passEncoder);
                }
                else if (element.__type__ === 'OcclusionQuery')
                {
                    runOcclusionQuery(element as OcclusionQuery, passEncoder);
                }
                else
                {
                    throw `未处理 ${(element as RenderPassObject).__type__} 类型的渲染通道对象！`;
                }
            });

            return passEncoder;
        });
    }

    static getInstance(device: GPUDevice, renderPass: RenderPass, canvasContext?: CanvasContext)
    {
        return this.map.get([device, renderPass, canvasContext]) || new WGPURenderPass(device, renderPass, canvasContext);
    }

    private static readonly map = new ChainMap<[GPUDevice, RenderPass, CanvasContext], WGPURenderPass>();
}