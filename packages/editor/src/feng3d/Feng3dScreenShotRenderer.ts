import { logic as getLogic, markMutation, Matrix4x4, reactive, Vector3 } from 'feng3d';
import type { Camera, Object3D, PerspectiveCamera, Scene, View, ViewLogic } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';
import type { ReadPixels } from '@feng3d/webgpu';
import { pixelsToDataURL } from './screenShotCanvas';

/** 角度 → 弧度 */
const DEG2RAD = Math.PI / 180;

/**
 * 资源预览的离屏渲染上下文。
 *
 * 职责：维护「离屏画布 + 纯数据 View + ViewLogic + WebGPU 实例」，提供
 * 「提交一次渲染 → 从画布纹理读回像素 → PNG DataURL」与「相机取景」两项能力。
 *
 * 渲染通路（新范式）：
 * 1. 纯数据 View 字面量经 `logic(view)` 得到 `ViewLogic`（渲染链由响应式提交链承载，
 *    不再有 `ForwardRenderer.draw` / `View.setSize` / `View.render` 等命令式 API）；
 * 2. 读取 `viewLogic.submit`（同步构建提交链）并 `webgpu.submit` 提交一次；
 * 3. `webgpu.readPixels` 从画布纹理读回像素——其内部的 `copyTextureToBuffer` 与上面的
 *    渲染命令在同一队列中顺序执行，`await` 返回即代表本帧确实渲染完毕（确定性完成信号，
 *    不用定时器猜时机）。**不使用 `canvas.toDataURL()`**：WebGPU 画布的内容取决于浏览器
 *    合成（present）时机，提交后同步读取并不可靠。
 */
export class Feng3dScreenShotRenderer
{
    /** 离屏渲染画布（挂在 DOM 屏幕外，见构造函数注释） */
    readonly canvas: HTMLCanvasElement;

    /** 离线渲染视图（纯数据 View 字面量） */
    readonly view: View;

    /** 视图 logic（渲染链入口：`viewLogic.submit`） */
    readonly viewLogic: ViewLogic;

    /** 视图场景（预览画面背景与环境色） */
    readonly scene: Scene;

    /** 视图相机（`PerspectiveCamera` 内联 fov/aspect/near/far） */
    readonly camera: Camera;

    /** 相机宿主对象（相机变换只经宿主对象的 position/rotation 写入） */
    readonly cameraObject: Object3D;

    /** WebGPU 实例（懒初始化；缓存 Promise 避免并发重复创建设备） */
    #webgpu: Promise<WebGPU> | null = null;

    /** 相机朝向是否已初始化（用户拖拽旋转相机后不再被取景重置） */
    #cameraRotationInited = false;

    /** 最近一次设置的像素尺寸（clientWidth 不可用时的回退） */
    #width: number;

    /** 最近一次设置的像素尺寸 */
    #height: number;

    /** @param size 初始预览像素边长 */
    constructor(size = 64)
    {
        this.#width = size;
        this.#height = size;

        // 离屏画布：`ViewLogic` 用 `canvas.clientWidth/Height` 同步渲染分辨率，
        // 未挂载到 DOM 时 clientWidth 恒为 0（渲染退化为 1×1）。因此挂到屏幕外的
        // 隐藏区域——visibility:hidden 仍参与布局，能给出真实的 clientWidth/Height。
        const canvas = this.canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        canvas.style.cssText = 'position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none;';
        this.setSize(size, size);
        (document.body ?? document.documentElement).appendChild(canvas);

        // 场景：默认灰底 + 环境光，使无直射光照的材质也能看清轮廓
        const scene: Scene = {
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.32, g: 0.32, b: 0.32, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
        };
        this.scene = scene;

        // 预览相机：镜头参数已内联进相机（`camera.lens` 不存在）；
        // aspect 由 `ViewLogic` 每帧按画布宽高比同步，无需在此声明。
        const cameraObject: Object3D = {
            __type__: 'Object3D',
            name: 'previewCamera',
            position: { x: 0, y: 0, z: 3 },
            components: [{ __type__: 'PerspectiveCamera', fov: 45, near: 0.1, far: 100 }],
        };
        this.cameraObject = cameraObject;
        this.camera = cameraObject.components[0] as Camera;

        // 视图：root 中预先声明场景 / 相机 / 光照。
        // 必须先于 `logic(view)` 声明相机——`ViewLogic` 从 root 子树查找 Camera，
        // 命中本相机后不会另建默认相机（`camera` 因而始终有效）。
        this.view = {
            __type__: 'View',
            canvas,
            root: {
                __type__: 'Object3D',
                name: 'screenShotRoot',
                components: [scene],
                children: [cameraObject, {
                    __type__: 'Object3D',
                    name: 'previewLight',
                    rotation: { x: 50 * DEG2RAD, y: -30 * DEG2RAD, z: 0 },
                    components: [{ __type__: 'DirectionalLight' }],
                }],
            },
        };
        this.viewLogic = getLogic(this.view);
    }

    /** 同步画布显示尺寸（`ViewLogic` 据此同步渲染分辨率） */
    setSize(width: number, height: number): void
    {
        this.#width = width;
        this.#height = height;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }

    /**
     * 更新相机位置以框住目标对象（保留相机当前朝向，仅调整距离与裁剪面）。
     *
     * @param object3D 目标对象
     */
    updateCameraPosition(object3D: Object3D): void
    {
        const bounds = getLogic(object3D).boundingBox.worldBounds;
        const center = bounds.getCenter();
        const size = bounds.getSize();
        // 包围球半径取半对角线：仅取最长边会在目标旋转后露角
        const radius = 0.5 * Math.sqrt((size.x * size.x) + (size.y * size.y) + (size.z * size.z)) || 0.5;

        const camera = this.camera as PerspectiveCamera;
        const fov = (camera.fov ?? 45) * DEG2RAD;
        // 球完全落入垂直视锥：distance = r / sin(fov/2)，乘 1.2 留边距
        const distance = (radius / Math.sin(fov / 2)) * 1.2;

        if (!this.#cameraRotationInited)
        {
            // 默认略微侧视的朝向（沿用旧实现 drawMaterial 的相机旋转 (20°, -90°, 0°)）；
            // 初始化后不再覆盖——预览面板拖拽旋转相机的结果要保留。
            reactive(this.cameraObject).rotation = { x: 20 * DEG2RAD, y: -90 * DEG2RAD, z: 0 };
            this.#cameraRotationInited = true;
        }

        // 相机前向 = 旋转矩阵 × (0,0,-1)（与 Object3DLogic 的矩阵构造同源，避免欧拉约定差异）
        const rotation = getLogic(this.cameraObject).rotation;
        const forward = new Matrix4x4()
            .setRotation(new Vector3(rotation.x, rotation.y, rotation.z))
            .transformVector3(new Vector3(0, 0, -1));

        const centerX = Number.isFinite(center.x) ? center.x : 0;
        const centerY = Number.isFinite(center.y) ? center.y : 0;
        const centerZ = Number.isFinite(center.z) ? center.z : 0;
        reactive(this.cameraObject).position = {
            x: centerX - (forward.x * distance),
            y: centerY - (forward.y * distance),
            z: centerZ - (forward.z * distance),
        };

        // 裁剪面随目标尺度自适应（避免目标过大被 far 裁掉 / 过小被 near 裁掉）
        reactive(camera).near = Math.max(distance * 0.01, 0.001);
        reactive(camera).far = (distance + radius) * 10;
    }

    /** 提交一次离屏渲染，并从画布纹理读回像素，产出 PNG DataURL */
    async render(): Promise<string>
    {
        const webgpu = await this.#ensureWebGPU();
        const width = this.canvas.clientWidth || this.#width;
        const height = this.canvas.clientHeight || this.#height;

        // 标记一次数据变更：`WebGPU.submit` 对版本号未变的 Submit 会跳过（按需呈现），
        // 被跳过时画布纹理仍是上一帧已 present 的纹理，读取会失效。预览必须真实提交一次。
        markMutation();
        webgpu.submit(this.viewLogic.submit);

        const readPixels: ReadPixels = { origin: [0, 0], copySize: [width, height] };
        await webgpu.readPixels(readPixels);

        return pixelsToDataURL(readPixels.result as Uint8Array, readPixels.format, width, height);
    }

    /** 懒初始化 WebGPU（Promise 缓存：并发预览只创建一次设备） */
    #ensureWebGPU(): Promise<WebGPU>
    {
        this.#webgpu ||= new WebGPU({ canvasId: this.canvas }).init();

        return this.#webgpu;
    }
}
