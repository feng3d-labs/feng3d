import { Color } from '../data/RenderPassColorAttachment';
import { RenderPassFormat } from '../internal/RenderPassFormat';

export type CommandType =
    | [func: 'setViewport', args: [x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number]]
    | [func: 'setScissorRect', args: [x: GPUIntegerCoordinate, y: GPUIntegerCoordinate, width: GPUIntegerCoordinate, height: GPUIntegerCoordinate]]
    | [func: 'setPipeline', args: [pipeline: GPURenderPipeline]]
    | [func: 'setBindGroup', args: [index: number, bindGroup: GPUBindGroup]]
    | [func: 'setVertexBuffer', args: [slot: GPUIndex32, buffer: GPUBuffer | null | undefined, offset?: GPUSize64, size?: GPUSize64]]
    | [func: 'setIndexBuffer', args: [buffer: GPUBuffer | null | undefined, indexFormat: GPUIndexFormat, offset?: GPUSize64, size?: GPUSize64]]
    | [func: 'draw', args: [vertexCount: GPUSize32, instanceCount?: GPUSize32, firstVertex?: GPUSize32, firstInstance?: GPUSize32]]
    | [func: 'drawIndexed', args: [indexCount: GPUSize32, instanceCount?: GPUSize32, firstIndex?: GPUSize32, baseVertex?: GPUSignedOffset32, firstInstance?: GPUSize32]]
    | [func: 'drawIndexedIndirect', args: [indirectBuffer: GPUBuffer, indirectOffset: GPUSize64]]
    | [func: 'drawIndirect', args: [indirectBuffer: GPUBuffer, indirectOffset: GPUSize64]]
    | [func: 'setBlendConstant', args: [color: GPUColor]]
    | [func: 'setStencilReference', args: [reference: GPUStencilValue]]
    | [func: 'executeBundles', args: [bundles: GPURenderBundle[]]]
    | [func: 'beginOcclusionQuery', args: [queryIndex: GPUSize32]]
    | [func: 'endOcclusionQuery']
    ;

export class WGPURenderPassEncoder implements GPURenderPassEncoder
{
    private _commands: CommandType[] = [];
    private _queryIndex: number;
    private _setViewport: [x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number] | undefined;
    private _setScissorRect: [x: GPUIntegerCoordinate, y: GPUIntegerCoordinate, width: GPUIntegerCoordinate, height: GPUIntegerCoordinate] | undefined;
    private _setBlendConstant: GPUColor | undefined;
    private _setPipeline: GPURenderPipeline;
    private _setStencilReference: number | undefined;
    private _setBindGroup: GPUBindGroup[] = [];
    // setVertexBuffer / setIndexBuffer 的参数按 WebGPU 规范允许 null（解除绑定）与 undefined（不传），
    // 缓存与命令表如实带上这两种值
    private _setVertexBuffer: [buffer: GPUBuffer | null | undefined, offset?: GPUSize64, size?: GPUSize64][] = [];
    private _setIndexBuffer: [buffer: GPUBuffer | null | undefined, indexFormat: GPUIndexFormat, offset?: GPUSize64, size?: GPUSize64];

    constructor(public readonly device: GPUDevice, public readonly renderPassFormat: RenderPassFormat, public readonly attachmentSize: { readonly width: number, readonly height: number })
    {
        this._queryIndex = 0;
        this._setViewport = [0, 0, attachmentSize.width, attachmentSize.height, 0, 1];
        this._setScissorRect = [0, 0, attachmentSize.width, attachmentSize.height];
    }

    setViewport(x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number): undefined
    {
        const currentViewport = this._setViewport;

        if (currentViewport && x === currentViewport[0] && y === currentViewport[1] && width === currentViewport[2] && height === currentViewport[3] && minDepth === currentViewport[4] && maxDepth === currentViewport[5]) return;

        this._commands.push(['setViewport', [x, y, width, height, minDepth, maxDepth]]);
        this._setViewport = [x, y, width, height, minDepth, maxDepth];
    }

    setScissorRect(x: GPUIntegerCoordinate, y: GPUIntegerCoordinate, width: GPUIntegerCoordinate, height: GPUIntegerCoordinate): undefined
    {
        const currentScissorRect = this._setScissorRect;

        if (currentScissorRect && x === currentScissorRect[0] && y === currentScissorRect[1] && width === currentScissorRect[2] && height === currentScissorRect[3]) return;

        this._commands.push(['setScissorRect', [x, y, width, height]]);
        this._setScissorRect = [x, y, width, height];
    }

    // 参数类型必须覆盖基类 GPURenderPassEncoder.setBlendConstant 的全部重载参数：基类既接受
    // GPUColor（`number[]`）也接受 `Iterable<number>`，而 Color 是 4 元组——元组赋得进 number[]、
    // number[] 却赋不进元组，所以这里按基类口径写成联合，再统一成数组用于比较与缓存
    setBlendConstant(blendConstant: GPUColor | Iterable<number> | undefined): undefined
    {
        if (blendConstant === undefined) return;

        // 调用方实际传的都是 Color/数组，其它两种形态只为类型兼容；
        // 数组时 toBlendColorArray 原样返回同一引用，下面的比较与缓存行为完全不变
        const color = toBlendColorArray(blendConstant);
        const currentBlendConstant = this._setBlendConstant;

        if (color === currentBlendConstant || (color && currentBlendConstant && color[0] === currentBlendConstant[0] && color[1] === currentBlendConstant[1] && color[2] === currentBlendConstant[2] && color[3] === currentBlendConstant[3])) return;

        this._commands.push(['setBlendConstant', [color]]);
        this._setBlendConstant = color;
    }

    setStencilReference(stencilReference: number | undefined): undefined
    {
        if (stencilReference === undefined) return;

        if (stencilReference === this._setStencilReference) return;

        this._commands.push(['setStencilReference', [stencilReference]]);
        this._setStencilReference = stencilReference;
    }

    setPipeline(pipeline: GPURenderPipeline): undefined
    {
        if (pipeline === undefined) return;

        if (pipeline === this._setPipeline) return;

        this._commands.push(['setPipeline', [pipeline]]);
        this._setPipeline = pipeline;
    }

    setBindGroup(i: GPUIndex32, bindGroup: GPUBindGroup): undefined
    {
        if (this._setBindGroup[i] !== bindGroup)
        {
            this._commands.push(['setBindGroup', [i, bindGroup]]);
            this._setBindGroup[i] = bindGroup;
        }
    }

    setVertexBuffer(i: GPUIndex32, buffer: GPUBuffer | null | undefined, offset?: GPUSize64, size?: GPUSize64): undefined
    {
        const currentVertexBuffer = this._setVertexBuffer[i];

        if (!currentVertexBuffer || currentVertexBuffer[0] !== buffer || currentVertexBuffer[1] !== offset || currentVertexBuffer[2] !== size)
        {
            this._commands.push(['setVertexBuffer', [i, buffer, offset, size]]);
            this._setVertexBuffer[i] = [buffer, offset, size];
        }
    }

    setIndexBuffer(buffer: GPUBuffer | null | undefined, indexFormat: GPUIndexFormat, offset?: GPUSize64, size?: GPUSize64): undefined
    {
        if (!this._setIndexBuffer || this._setIndexBuffer[0] !== buffer || this._setIndexBuffer[1] !== indexFormat || this._setIndexBuffer[2] !== offset || this._setIndexBuffer[3] !== size)
        {
            this._commands.push(['setIndexBuffer', [buffer, indexFormat, offset, size]]);
            this._setIndexBuffer = [buffer, indexFormat, offset, size];
        }
    }

    draw(vertexCount: GPUSize32, instanceCount?: GPUSize32, firstVertex?: GPUSize32, firstInstance?: GPUSize32): undefined
    {
        this._commands.push(['draw', [vertexCount, instanceCount, firstVertex, firstInstance]]);
    }

    drawIndexed(indexCount: GPUSize32, instanceCount?: GPUSize32, firstIndex?: GPUSize32, baseVertex?: GPUSignedOffset32, firstInstance?: GPUSize32): undefined
    {
        this._commands.push(['drawIndexed', [indexCount, instanceCount, firstIndex, baseVertex, firstInstance]]);
    }

    drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset?: GPUSize64): undefined
    {
        this._commands.push(['drawIndexedIndirect', [indirectBuffer, indirectOffset ?? 0]]);
    }

    executeBundles(bundles: GPURenderBundle[]): undefined
    {
        this._commands.push(['executeBundles', [bundles]]);
    }

    beginOcclusionQuery(): undefined
    {
        const queryIndex = this._queryIndex++;

        this._commands.push(['beginOcclusionQuery', [queryIndex]]);
    }

    endOcclusionQuery(): undefined
    {
        this._commands.push(['endOcclusionQuery']);
    }

    runCommands(renderBundleEncoder: GPURenderBundleEncoder | GPURenderPassEncoder)
    {
        const commands = this._commands;

        for (let i = 0, n = commands.length; i < n; i++)
        {
            const [func, args] = commands[i];

            (renderBundleEncoder[func] as Function).apply(renderBundleEncoder, args);
        }
    }

    //
    __brand: 'GPURenderPassEncoder';
    label: string;
    end(): undefined
    {
        throw new Error('Method not implemented.');
    }

    pushDebugGroup(_groupLabel: string): undefined
    {
        throw new Error('Method not implemented.');
    }

    popDebugGroup(): undefined
    {
        throw new Error('Method not implemented.');
    }

    insertDebugMarker(_markerLabel: string): undefined
    {
        throw new Error('Method not implemented.');
    }

    drawIndirect(indirectBuffer: GPUBuffer, indirectOffset?: GPUSize64): undefined
    {
        this._commands.push(['drawIndirect', [indirectBuffer, indirectOffset ?? 0]]);
    }
}

export class WGPURenderBundleEncoder extends WGPURenderPassEncoder
{
    setViewport(_x: number, _y: number, _width: number, _height: number, _minDepth: number, _maxDepth: number): undefined
    { }

    setScissorRect(_x: GPUIntegerCoordinate, _y: GPUIntegerCoordinate, _width: GPUIntegerCoordinate, _height: GPUIntegerCoordinate): undefined
    { }

    setBlendConstant(_blendConstant: Color | undefined): undefined
    { }

    setStencilReference(_stencilReference: number | undefined): undefined
    { }

    executeBundles(_bundles: GPURenderBundle[]): undefined
    { }

    beginOcclusionQuery(): undefined
    { }

    endOcclusionQuery(): undefined
    { }
}

/**
 * 把基类 `GPURenderPassEncoder.setBlendConstant` 接受的三种形态统一成数组。
 *
 * 基类重载同时接受 `GPUColor`（= `Iterable<number> | GPUColorDict`）与裸 `Iterable<number>`，
 * 而本类的命令缓存与去重比较都需要按下标取值，所以先归一化。
 * 调用方传的都是 `Color`/数组，走第一个分支并原样返回同一引用。
 *
 * @param blendConstant 混合常量
 * @returns 归一化后的颜色数组
 */
function toBlendColorArray(blendConstant: GPUColor | Iterable<number>): number[]
{
    if (Array.isArray(blendConstant)) return blendConstant;

    if (Symbol.iterator in (blendConstant as object)) return [...(blendConstant as Iterable<number>)];

    const dict = blendConstant as GPUColorDict;

    return [dict.r, dict.g, dict.b, dict.a];
}
