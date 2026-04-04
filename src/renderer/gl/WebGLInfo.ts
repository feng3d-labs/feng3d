import { DrawMode } from '../data/RenderParams';
import { WebGLRenderer } from '../WebGLRenderer';

/**
 * WebGL信息
 */
export class WebGLInfo
{
    readonly memory = {
        geometries: 0,
        textures: 0
    };

    readonly render = {
        frame: 0,
        calls: 0,
        triangles: 0,
        points: 0,
        lines: 0
    };

    private _webGLRenderer: WebGLRenderer;

    constructor(webGLRenderer: WebGLRenderer)
    {
        this._webGLRenderer = webGLRenderer;
    }

    update(count: number, mode: DrawMode, instanceCount: number)
    {
        const { render } = this;

        render.calls++;

        switch (mode)
        {
            case 'TRIANGLE_FAN':
                render.triangles += instanceCount * (count - 2);
                break;

            case 'TRIANGLES':
                render.triangles += instanceCount * (count / 3);
                break;

            case 'TRIANGLE_STRIP':
                render.triangles += instanceCount * (count - 2);
                break;

            case 'LINES':
                render.lines += instanceCount * (count / 2);
                break;

            case 'LINE_STRIP':
                render.lines += instanceCount * (count - 1);
                break;

            case 'LINE_LOOP':
                render.lines += instanceCount * count;
                break;

            case 'POINTS':
                render.points += instanceCount * count;
                break;

            default:
                console.error('WebGLInfo: Unknown draw mode:', mode);
                break;
        }
    }

    reset()
    {
        const { render } = this;

        render.frame++;
        render.calls = 0;
        render.triangles = 0;
        render.points = 0;
        render.lines = 0;
    }
}
