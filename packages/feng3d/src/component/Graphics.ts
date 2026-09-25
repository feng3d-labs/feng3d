import { Component3D } from './Component';
import { Component3DLogic, ComponentLogicBase } from './Component';
import type { Object3D } from '../core/Object3D';
import { registerLogic } from "@feng3d/reactivity";
import { dataTransform } from '@feng3d/polyfill';


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
 * GraphicsLogic 实现（AGENTS 第 3 章 class 模板）。
 *
 * protected constructor（只能经 logic() 创建）；继承 ComponentLogicBase
 * 复用 component/entity/init 行为；私有状态用 #field；方法在原型上共享。
 */
export class GraphicsLogic extends ComponentLogicBase
{
    // eslint-disable-next-line no-unused-private-class-members -- draw 生成的图片缓存（当前仅写入，待消费点接入后读取）
    #image: HTMLImageElement | null = null;
    /** 主画布（init 时创建） */
    #canvas: HTMLCanvasElement | null = null;
    /** 主画布 2D 上下文（init 时创建） */
    #context2D: CanvasRenderingContext2D | null = null;

    protected constructor(data: Graphics)
    {
        super(data);
    }

    get entity(): Object3D | null
    {
        return this._entity as Object3D | null;
    }

    init(object3D?: Object3D): void
    {
        super.init(object3D);
        this.#canvas = document.createElement('canvas');
        this.#context2D = this.#canvas.getContext('2d');
        watchContext2D(this.#context2D);
    }

    async draw(width: number, height: number): Promise<CanvasRenderingContext2D>
    {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctxt = canvas.getContext('2d');
        this.#image = await dataTransform.canvasToImage(canvas, 'png', 1);

        return ctxt;
    }

    dispose(): void
    {
        this.#image = null;
        this.#canvas = null;
        this.#context2D = null;
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

// 注册到 logic 分发表（class 经 new factory(data) 统一调用）
registerLogic('Graphics', GraphicsLogic as unknown as new (data: Graphics) => GraphicsLogic);
