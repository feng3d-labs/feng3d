import { logic } from '@feng3d/reactivity';
import { dataTransform } from '@feng3d/polyfill';
import { ComponentLogic, registerComponentLogic } from './componentLogic';
import { Graphics } from './Graphics';

/**
 * Graphics 逻辑处理输出。
 *
 * 提供 canvas/context2D 创建与 draw 方法。
 */
export interface GraphicsLogic extends ComponentLogic
{
    draw(width: number, height: number): Promise<CanvasRenderingContext2D>;
}


/**
 * 获取 Graphics 的 logic。
 */
export function graphicsLogic(graphics: Graphics): GraphicsLogic

{
    return logic<GraphicsLogic>(graphics);
}

function createGraphicsLogic(graphics: Graphics): GraphicsLogic
{
    let _image: HTMLImageElement | null = null;
    let _canvas: HTMLCanvasElement | null = null;
    let _context2D: CanvasRenderingContext2D | null = null;

    const logic: GraphicsLogic = {
        object3D: null as any,
        init()
        {
            _canvas = document.createElement('canvas');
            _context2D = _canvas.getContext('2d');
            watchContext2D(_context2D);
        },
        beforeRender() { /* no-op */ },
        async draw(width: number, height: number)
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
            (context2D as any)['__changed'] = true;
        };
    });
}

// 注册到 componentLogic 分发表（Graphics 未用 @RegisterComponent，手动注册类名）
registerComponentLogic('Graphics', (component) =>
{
    return createGraphicsLogic(component as Graphics);
});
