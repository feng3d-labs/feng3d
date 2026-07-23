import { Component3D, Component, Component3DLogic, ComponentLogic } from './Component';
import { registerLogic, logic as getLogic } from "@feng3d/reactivity";
import { dataTransform } from '@feng3d/polyfill';

import './Graphics';

declare module './Component'
{
    export interface ComponentMap
    {
        Graphics: Graphics;
    }
}

/**
 * Graphics（纯数据接口）。
 */
export interface Graphics extends Component3D
{
    readonly __type__: 'Graphics';
}

/**
 * 创建 Graphics 实例。
 */
export function createGraphics(): Graphics
{
    return {
        __type__: 'Graphics'
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Graphics: GraphicsLogic;
    }
}

/**
 * Graphics 逻辑处理类。
 *
 * 提供 canvas/context2D 创建与 draw 方法。
 */
export class GraphicsLogic extends Component3DLogic
{
    /** 由 draw 生成的图片（缓存） */
    private _image: HTMLImageElement | null = null;
    /** 主画布（init 时创建） */
    private _canvas: HTMLCanvasElement | null = null;
    /** 主画布 2D 上下文（init 时创建） */
    private _context2D: CanvasRenderingContext2D | null = null;

    constructor(graphics: Graphics)
    {
        super(graphics);
    }

    init(object3D?)
    {
        super.init(object3D);
        this._canvas = document.createElement('canvas');
        this._context2D = this._canvas.getContext('2d');
        watchContext2D(this._context2D);
    }

    async draw(width: number, height: number): Promise<CanvasRenderingContext2D>
    {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctxt = canvas.getContext('2d');
        this._image = await dataTransform.canvasToImage(canvas, 'png', 1);

        return ctxt;
    }

    dispose()
    {
        this._image = null;
        this._canvas = null;
        this._context2D = null;
    }
}
export function watchContext2D(context2D: CanvasRenderingContext2D, watchFuncs = ['rect'])
{
    watchFuncs.forEach((v) =>
    {
        const oldFunc = context2D[v];
        context2D[v] = function (...args): void
        {
            oldFunc.apply(context2D, args);
            // 标记更改
            (context2D as unknown as { __changed?: boolean }).__changed = true;
        };
    });
}

// 注册到 componentLogic 分发表（Graphics 未用 @RegisterComponent，手动注册类名）
registerLogic('Graphics', GraphicsLogic);
