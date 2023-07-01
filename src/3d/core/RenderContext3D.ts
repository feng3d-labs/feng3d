import { Camera3D } from '../../3d/cameras/Camera3D';
import { Rectangle } from '@feng3d/math';
import { Vector2 } from '@feng3d/math';
import { Vector3 } from '@feng3d/math';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { windowEventProxy } from '../../shortcut/WindowEventProxy';
import { Node3D } from './Node3D';
import { Scene3D } from './Scene3D';

/**
 * 渲染上下文。
 *
 * 包括渲染场景、摄像机、画布等。
 */
export class RenderContext3D
{
    /**
     * 渲染时将使用的摄像机。
     */
    camera: Camera3D;

    /**
     * 将被渲染的3D场景。
     */
    scene: Scene3D;

    /**
     * 画布。
     */
    canvas: HTMLCanvasElement;

    /**
     * WEBGL 渲染器
     */
    webGLRenderer: WebGLRenderer;

    /**
     * 视窗（canvas）所在页面显示区域。
     */
    viewRect: Rectangle;

    /**
     * 鼠标所在画布中的位置
     */
    mousePos: Vector2;

    constructor(camera: Camera3D, scene: Scene3D, webGLRenderer: WebGLRenderer)
    {
        this.canvas = webGLRenderer.canvas;
        this.camera = camera;
        this.scene = scene;
        this.webGLRenderer = webGLRenderer;

        // 计算视窗区域
        const clientRect = this.canvas.getBoundingClientRect();
        this.viewRect = new Rectangle(clientRect.x, clientRect.y, clientRect.width, clientRect.height);

        // 更新摄像机宽高比
        camera.aspect = clientRect.width / clientRect.height;

        // 计算鼠标所在画布中的位置
        this.mousePos = new Vector2(windowEventProxy.clientX - clientRect.left, windowEventProxy.clientY - clientRect.top);
    }

    /**
     * 屏幕坐标转GPU坐标
     * @param screenPos 屏幕坐标 (x: [0-width], y: [0 - height])
     * @return GPU坐标 (x: [-1, 1], y: [-1, 1])
     */
    screenToGpuPosition(screenPos: Vector2): Vector2
    {
        const gpuPos: Vector2 = new Vector2();
        gpuPos.x = (screenPos.x * 2 - this.viewRect.width) / this.viewRect.width;
        // 屏幕坐标与gpu中使用的坐标Y轴方向相反
        gpuPos.y = -(screenPos.y * 2 - this.viewRect.height) / this.viewRect.height;

        return gpuPos;
    }

    /**
     * 投影坐标（全局坐标转换为3D视图坐标）
     * @param point3d 全局坐标
     * @return 屏幕的绝对坐标
     */
    project(point3d: Vector3): Vector3
    {
        const v: Vector3 = this.camera.project(point3d);
        v.x = (v.x + 1.0) * this.viewRect.width / 2.0;
        v.y = (1.0 - v.y) * this.viewRect.height / 2.0;

        return v;
    }

    /**
     * 屏幕坐标投影到场景坐标
     * @param nX 屏幕坐标X ([0-width])
     * @param nY 屏幕坐标Y ([0-height])
     * @param sZ 到屏幕的距离
     * @param v 场景坐标（输出）
     * @return 场景坐标
     */
    unproject(sX: number, sY: number, sZ: number, v = new Vector3()): Vector3
    {
        const gpuPos: Vector2 = this.screenToGpuPosition(new Vector2(sX, sY));

        return this.camera.unproject(new Vector3(gpuPos.x, gpuPos.y, sZ), v);
    }

    /**
     * 获取单位像素在指定深度映射的大小
     * @param   depth   深度
     */
    getScaleByDepth(depth: number, dir = new Vector2(0, 1))
    {
        let scale = this.camera.getScaleByDepth(depth, dir);
        scale = scale / new Vector2(this.viewRect.width * dir.x, this.viewRect.height * dir.y).length;

        return scale;
    }

    /**
     * 获取鼠标射线（与鼠标重叠的摄像机射线）
     */
    getMouseRay3D()
    {
        const gpuPos = this.screenToGpuPosition(this.mousePos);

        const ray = this.camera.getGlobalRay3D(gpuPos.x, gpuPos.y);

        return ray;
    }

    /**
     * 获取屏幕区域内所有游戏对象
     * @param start 起点
     * @param end 终点
     */
    getObjectsInGlobalArea(start: Vector2, end: Vector2)
    {
        const s = this.viewRect.clampPoint(start);
        const e = this.viewRect.clampPoint(end);
        s.sub(this.viewRect.topLeft);
        e.sub(this.viewRect.topLeft);
        const min = s.clone().min(e);
        const max = s.clone().max(e);
        const rect = new Rectangle(min.x, min.y, max.x - min.x, max.y - min.y);
        //
        let node3ds = this.scene.entity.traverse((node3d: Node3D) =>
        {
            if (node3d === this.scene.entity) return;

            return node3d;
        });

        node3ds = node3ds.filter((node3d) =>
        {
            if (!node3d) return false;

            const m = node3d.getComponent('Mesh3D');
            if (m)
            {
                const include = m.globalBounds.toPoints().every((pos) =>
                {
                    const p = this.project(pos);

                    return rect.contains(p.x, p.y);
                });

                return include;
            }
            const p = this.project(node3d.globalPosition);

            return rect.contains(p.x, p.y);
        });

        return node3ds;
    }
}
