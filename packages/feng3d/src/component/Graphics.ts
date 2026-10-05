import { registerLogic } from '@feng3d/reactivity';
import { dataTransform } from '@feng3d/polyfill';
import type { Object3D } from '../core/Object3D';
import { Component3D, Component3DLogic, createComponentLogicBase } from './Component';


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
 * 工厂函数：GraphicsLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * 自身状态（主画布 / 上下文 / 图片缓存）全部为闭包内变量；
 * 覆写 init / draw / dispose。
 *
 * @param data 组件数据（raw）
 */
export function graphicsLogic(data: Graphics): GraphicsLogic
{
    const { state, members } = createComponentLogicBase(data);

    /** 主画布（init 时创建） */
    let canvas: HTMLCanvasElement | null = null;
    /** 主画布 2D 上下文（init 时创建） */
    let context2D: CanvasRenderingContext2D | null = null;
    /** draw 生成的图片缓存（当前仅写入，待消费点接入后读取） */
    const imageCache: { image: HTMLImageElement | null } = { image: null };

    const logic: GraphicsLogic = {
        get component() { return members.component; },
        get entity() { return state.entity as Object3D | null; },
        init(object3D)
        {
            members.init(object3D);
            canvas = document.createElement('canvas');

            const ctxt = canvas.getContext('2d');

            // strictNullChecks：拿不到 2D 上下文就没法画（显式抛错，不再静默继续）
            if (!ctxt)
            {
                throw new Error('Graphics.init：无法创建 2D 画布上下文');
            }

            context2D = ctxt;
            watchContext2D(context2D);
        },
        async draw(width, height)
        {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctxt = canvas.getContext('2d');

            if (!ctxt)
            {
                throw new Error('Graphics.draw：无法创建 2D 画布上下文');
            }

            imageCache.image = await dataTransform.canvasToImage(canvas, 'png', 1);

            return ctxt;
        },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        get isLoaded() { return members.isLoaded; },
        dispose()
        {
            imageCache.image = null;
            canvas = null;
            context2D = null;
        },
    };

    return logic;
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

// 注册到 logic 分发表（只接受工厂函数，见 registerLogic 的说明）
registerLogic('Graphics', graphicsLogic);
