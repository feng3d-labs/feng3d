import { Lazy } from '@feng3d/polyfill';
import { oav } from '@feng3d/objectview';
import { SerializeProperty } from '@feng3d/serialization';
import { DrawMode } from './RenderParams';

export class DrawCall
{
    /**
     * 渲染模式，默认 TRIANGLES，每三个顶点绘制一个三角形。
     *
     * * POINTS 绘制单个点。
     * * LINE_LOOP 绘制循环连线。
     * * LINE_STRIP 绘制连线
     * * LINES 每两个顶点绘制一条线段。
     * * TRIANGLES 每三个顶点绘制一个三角形。
     * * TRIANGLE_STRIP 绘制三角形条带。
     * * TRIANGLE_FAN  绘制三角扇形。
     *
     * A GLenum specifying the type primitive to render. Possible values are:
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
     */
    @SerializeProperty()
    @oav({ component: 'OAVEnum', tooltip: '渲染模式，默认RenderMode.TRIANGLES', componentParam: { enumClass: ['POINTS', 'LINE_LOOP', 'LINE_STRIP', 'LINES', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN'] } })
    drawMode: DrawMode = 'TRIANGLES';

    /**
     * 渲染实例数量
     */
    instanceCount: Lazy<number>;

    offset: number;

    count: number;
}
