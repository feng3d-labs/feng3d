import { dataTransform } from '@feng3d/polyfill';
import { RegisterComponent } from '../../ecs/Component';
import { Component3D } from '../core/Component3D';

declare module '../../ecs/Component' { interface ComponentMap { Graphics3D: Graphics3D; } }

/**
 * Graphics 类包含一组可用来创建矢量形状的方法。
 */
@RegisterComponent({ name: 'Graphics3D' })
export class Graphics3D extends Component3D
{
    declare __class__: 'Graphics3D';

    private image: HTMLImageElement;
    private context2D: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private width: number;
    private height: number;

    constructor()
    {
        super();

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context2D = this.canvas.getContext('2d');

        //
        watchContext2D(this.context2D);
    }

    async draw(width: number, height: number)
    {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctxt = canvas.getContext('2d');
        const img = await dataTransform.canvasToImage(canvas, 'png', 1);
        this.image = img;

        return ctxt;
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
            context2D['__changed'] = true;
        };
    });
}

// var ctxts = [];
// var num = 100;
// for (var i = 0; i < num; i++)
// {
//     var canvas = document.createElement("canvas");
//     canvas.width = 100;
//     canvas.height = 100;
//     var ctxt = canvas.getContext('2d');
//     ctxts.push(ctxt);
// }
