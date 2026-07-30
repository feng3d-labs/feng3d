import { Component3D } from './Component';
import { Component3DLogic, componentLogic } from './Component';
import type { Object3D } from '../core/Object3D';
import { registerLogic } from "@feng3d/reactivity";
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

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Graphics: GraphicsLogic;
    }
}

/**
 * Graphics 逻辑处理接口。
 *
 * 提供 canvas/context2D 创建与 draw 方法。
 */
export interface GraphicsLogic extends Component3DLogic
{
    /** 绘制指定尺寸画布并返回其 2D 上下文（同时缓存生成的图片） */
    draw(width: number, height: number): Promise<CanvasRenderingContext2D>;
}

/**
 * 创建 GraphicsLogic 实例（工厂函数，组合 componentLogic 基础行为）。
 *
 * 子类工厂通过 `const base = graphicsLogic(data)` 组合复用全部 Graphics 行为。
 */
export function graphicsLogic(graphics: Graphics): GraphicsLogic
{
    /** 由 draw 生成的图片（缓存） */
    let _image: HTMLImageElement | null = null;
    /** 主画布（init 时创建） */
    let _canvas: HTMLCanvasElement | null = null;
    /** 主画布 2D 上下文（init 时创建） */
    let _context2D: CanvasRenderingContext2D | null = null;

    const base = componentLogic(graphics);

    // 捕获基类方法，避免覆盖后再调用 base.init 导致递归
    const baseInit = base.init;

    return Object.assign(base, {
        init(object3D?: Object3D)
        {
            baseInit(object3D);
            _canvas = document.createElement('canvas');
            _context2D = _canvas.getContext('2d');
            watchContext2D(_context2D);
        },
        async draw(width: number, height: number): Promise<CanvasRenderingContext2D>
        {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctxt = canvas.getContext('2d');
            _image = await dataTransform.canvasToImage(canvas, 'png', 1);

            return ctxt;
        },
        dispose()
        {
            _image = null;
            _canvas = null;
            _context2D = null;
        },
    }) as unknown as GraphicsLogic;
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
registerLogic('Graphics', graphicsLogic);
