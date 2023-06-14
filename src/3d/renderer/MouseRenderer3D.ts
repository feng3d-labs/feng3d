import { EventEmitter } from '@feng3d/event';
import { Rectangle } from '../../math/geom/Rectangle';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { Uniforms } from '../../renderer/data/Uniforms';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { windowEventProxy } from '../../shortcut/WindowEventProxy';
import { Node3D } from '../core/Node3D';
import { Renderable3D } from '../core/Renderable3D';

declare module '../../renderer/data/Uniforms'
{
    interface Uniforms
    {
        /**
         * 3D对象编号
         */
        u_objectID: number;
    }
}

/**
 * 鼠标拾取渲染器
 */
export class MouseRenderer extends EventEmitter
{
    private objects: Node3D[] = [];

    /**
     * 渲染
     */
    draw(WebGLRenderer: WebGLRenderer, viewRect: Rectangle)
    {
        const { webGLContext } = WebGLRenderer;

        const mouseX = windowEventProxy.clientX;
        const mouseY = windowEventProxy.clientY;

        const offsetX = -(mouseX - viewRect.x);
        const offsetY = -(viewRect.height - (mouseY - viewRect.y));// y轴与window中坐标反向，所以需要 h = (maxHeight - h)

        webGLContext.clearColor(0, 0, 0, 0);
        webGLContext.clearDepth(1);
        webGLContext.clear(['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT']);
        webGLContext.viewport(offsetX, offsetY, viewRect.width, viewRect.height);

        this.objects.length = 1;

        // 启动裁剪，只绘制一个像素
        webGLContext.enable('SCISSOR_TEST');
        webGLContext.scissor(0, 0, 1, 1);
        // super.draw(renderContext);
        webGLContext.disable('SCISSOR_TEST');

        // 读取鼠标拾取索引
        // this.frameBufferObject.readBuffer(gl, "objectID");

        const data = new Uint8Array(4);
        webGLContext.readPixels(0, 0, 1, 1, 'RGBA', 'UNSIGNED_BYTE', data);
        const id = data[0] + data[1] * 255 + data[2] * 255 * 255 + data[3] * 255 * 255 * 255 - data[3];// 最后（- data[3]）表示很奇怪，不过data[3]一般情况下为0
        // log(`选中索引3D对象${id}`, data.toString());

        return this.objects[id];
    }

    protected drawRenderables(_gl: WebGLRenderingContext, renderable: Renderable3D)
    {
        if (renderable.entity.mouseEnabled)
        {
            const object = renderable.entity;
            const uObjectID = this.objects.length;
            this.objects[uObjectID] = object;

            const renderAtomic = renderable.renderAtomic;

            renderAtomic.uniforms.u_objectID = uObjectID;
            // super.drawRenderables(renderContext, model);
        }
    }

    /**
     * 绘制3D对象
     */
    protected drawObject3D(_gl: WebGLRenderingContext, _renderAtomic: RenderAtomic)
    {
        // var shader = new Shader();
        // shader.vertexCode = shaderlib.getShader("mouse").vertex;
        // shader.fragmentCode = shaderlib.getShader("mouse").fragment;
        // super.drawObject3D(gl, renderAtomic, shader);
    }
}

export const mouseRenderer = new MouseRenderer();
