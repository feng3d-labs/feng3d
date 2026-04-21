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

        this._computedCommands = computed(() =>
        {
            r_renderPass.descriptor;
            r_renderPass.descriptor.attachmentSize;

            const wgpuRenderPassDescriptor = WGPURenderPassDescriptor.getInstance(device, renderPass.descriptor, canvasContext);
            const renderPassFormat = wgpuRenderPassDescriptor.renderPassFormat;

            const attachmentSize = renderPass.descriptor.attachmentSize;

            const passEncoder = new WGPURenderPassEncoder(device, renderPassFormat, attachmentSize);

            r_renderPass.renderPassObjects.concat();
            renderPass.renderPassObjects.forEach((element) =>
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