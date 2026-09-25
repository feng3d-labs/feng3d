import { logic as getLogic, markMutation, Matrix4x4, reactive, Vector3 } from 'feng3d';
import type { Camera, GeometryLike, Geometrys, Material, Materials, MeshRenderer, Object3D, PerspectiveCamera, Scene, TextureMaterial, TextureResource, View, ViewLogic } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';
import type { ReadPixels, TextureFormat } from '@feng3d/webgpu';

/** 角度 → 弧度 */
const DEG2RAD = Math.PI / 180;

/**
 * 主仓 `Texture2D.activePixels` 移除后，editor 资源系统把纹理像素附加在 `_pixels` 上
 * （见 `@feng3d/assets` 的 `TextureAsset.readFile`）。
 */
interface TextureWithPixels
{
    readonly _pixels?: ImageData | CanvasImageSource;
}

/**
 * 立方体贴图旧数据（仅供存档的贴图预览实现使用）。
 *
 * TODO(P1 API 迁移)：主仓 `Texture2D` / `TextureCube` 已统一为 `Texture` 纯数据接口，
 * 六面像素不再以 `_pixels` 暴露；本接口在贴图预览迁移完成后删除。
 */
interface LegacyTextureCubeData
{
    readonly _pixels?: readonly (CanvasImageSource | undefined)[];
}

/**
 * feng3d 预览图工具。
 *
 * 注意：本类**不是组件**，不参与 `ComponentMap` / `LogicMap` 注册；它只是编辑器资源面板
 * 用来离线渲染一张 64×64 预览图的辅助类（`Feng3dScreenShot.feng3dScreenShot` 单例）。
 *
 * 渲染通路（P1 恢复）：纯数据 `View` 字面量 + `logic(view)` 得到 {@link ViewLogic}，
 * 每次预览读取一次 `viewLogic.submit` 经 `webgpu.submit` 提交（同步构建提交链），
 * 再用 `webgpu.readPixels` 从画布纹理读回像素（`await` 即本轮 GPU 渲染完成的确定性信号），
 * 最后写进 2D 画布导出 PNG DataURL。全过程不依赖每一帧的 Ticker 驱动。
 *
 * 所有绘制方法均为**异步**：WebGPU 的取像素只能经 `mapAsync` 异步完成
 * （`canvas.toDataURL()` 对 WebGPU 画布取到的内容取决于浏览器合成时机，不可靠）。
 */
export class Feng3dScreenShot
{
    static get feng3dScreenShot(): Feng3dScreenShot
    {
        this._feng3dScreenShot = this._feng3dScreenShot || new Feng3dScreenShot();

        return this._feng3dScreenShot;
    }

    private static _feng3dScreenShot: Feng3dScreenShot | null = null;

    /** 离屏渲染画布（挂在 DOM 屏幕外，见构造函数注释） */
    readonly canvas: HTMLCanvasElement;

    /** 离线渲染视图（纯数据 View + 其 logic） */
    readonly view: View;

    /** 视图 logic（渲染链入口：`viewLogic.submit`） */
    readonly viewLogic: ViewLogic;

    /** 视图场景（预览画面背景与环境色） */
    readonly scene: Scene;

    /** 视图相机（`PerspectiveCamera` 内联 fov/aspect/near/far） */
    readonly camera: Camera;

    /** 相机宿主对象（相机变换只经宿主对象的 position/rotation 写入） */
    readonly cameraObject: Object3D;

    /** 渲染截图容器（预览对象临时挂载点） */
    readonly container: Object3D;

    /** 材质预览宿主对象（球体） */
    readonly #materialObject: Object3D;

    /** 几何体预览宿主对象 */
    readonly #geometryObject: Object3D;

    /** 材质预览渲染组件（每次预览替换 geometry/material） */
    readonly #materialRenderer: MeshRenderer;

    /** 几何体预览渲染组件（每次预览替换 geometry） */
    readonly #geometryRenderer: MeshRenderer;

    /** WebGPU 实例（懒初始化；缓存 Promise 避免并发重复创建设备） */
    #webgpu: Promise<WebGPU> | null = null;

    /** 预览渲染串行化队列（多个调用方共享同一离屏视图与容器，见 #enqueue） */
    #renderQueue: Promise<unknown> = Promise.resolve();

    /** 相机朝向是否已初始化（用户拖拽旋转相机后不再被预览重置） */
    #cameraRotationInited = false;

    /** 最近一次预览的像素尺寸（贴图预览直接绘制时使用） */
    #width = 64;

    /** 最近一次预览的像素尺寸 */
    #height = 64;

    constructor()
    {
        // 离屏画布：`ViewLogic` 用 `canvas.clientWidth/Height` 同步渲染分辨率，
        // 未挂载到 DOM 时 clientWidth 恒为 0（渲染退化为 1×1）。因此挂到屏幕外的
        // 隐藏区域——visibility:hidden 仍参与布局，能给出真实的 clientWidth/Height。
        const canvas = this.canvas = document.createElement('canvas');
        canvas.width = this.#width;
        canvas.height = this.#height;
        canvas.style.cssText = 'position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none;';
        this.#applySize(this.#width, this.#height);
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

        // 预览宿主对象：几何体走默认材质（RenderableLogic 缺失时 fallback StandardMaterial），
        // 材质预览固定用球体展示（旧实现 defaultGeometry 为 Sphere）。
        const materialRenderer: MeshRenderer = {
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry' },
        };
        const geometryRenderer: MeshRenderer = { __type__: 'MeshRenderer' };
        this.#materialRenderer = materialRenderer;
        this.#geometryRenderer = geometryRenderer;

        const materialObject: Object3D = { __type__: 'Object3D', name: 'materialObject', components: [materialRenderer] };
        const geometryObject: Object3D = { __type__: 'Object3D', name: 'geometryObject', components: [geometryRenderer] };
        this.#materialObject = materialObject;
        this.#geometryObject = geometryObject;
        this.container = { __type__: 'Object3D', name: '渲染截图容器', children: [materialObject, geometryObject] };

        // 视图：root 中预先声明场景 / 相机 / 光照与预览容器。
        // 必须先于 `logic(view)` 声明相机——`ViewLogic` 从 root 子树查找 Camera，
        // 命中本相机后不会另建默认相机（`Feng3dScreenShot.camera` 因而始终有效）。
        this.view = {
            __type__: 'View',
            canvas,
            root: {
                __type__: 'Object3D',
                name: 'screenShotRoot',
                components: [scene],
                children: [cameraObject, this.container, {
                    __type__: 'Object3D',
                    name: 'previewLight',
                    rotation: { x: 50 * DEG2RAD, y: -30 * DEG2RAD, z: 0 },
                    components: [{ __type__: 'DirectionalLight' }],
                }],
            },
        };
        this.viewLogic = getLogic(this.view);
    }

    /**
     * 绘制贴图。
     *
     * 两条通路：
     * 1. 纹理数据带 `_pixels`（editor 资源系统读文件时附加的 `HTMLImageElement` / `ImageData`）：
     *    直接写进 2D 画布——主仓 `Texture` 数据接口不再暴露像素，这是当前唯一的像素来源；
     * 2. `{ __type__: 'Texture', url }` 声明式纹理引用：交 GPU 通路渲染
     *    （铺满的四边面 + `TextureMaterial`，纹理由 `resolveTexture` 惰性加载）。
     *
     * @param texture 贴图数据
     * @returns PNG DataURL
     */
    async drawTexture(texture: unknown): Promise<string>
    {
        return this.#enqueue(async () =>
        {
            const pixels = (texture as TextureWithPixels | null)?._pixels;
            if (pixels)
            {
                return this.#imageToDataURL(pixels, this.#width);
            }

            if ((texture as { __type__?: string } | null)?.__type__ === 'Texture')
            {
                const material: TextureMaterial = {
                    __type__: 'TextureMaterial',
                    uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
                    s_texture: texture as TextureResource,
                };
                const renderer = reactive(this.#materialRenderer);
                renderer.geometry = { __type__: 'QuadGeometry' };
                renderer.material = material;
                // 声明式纹理是惰性加载的：等材质报告就绪，否则渲染到的是 1×1 占位纹理
                await this.#waitMaterialLoaded(material);

                return this.#renderObject3D(this.#materialObject);
            }

            throw new Error('[Feng3dScreenShot] drawTexture 无法取像素：纹理既无 `_pixels`（editor 资源系统附加的像素），也不是 `{ __type__: "Texture", url }` 声明式引用');
        });
    }

    /**
     * 绘制立方体贴图。
     *
     * 逻辑保持旧实现（六面像素拼成画布十字布局），仅把类型适配为
     * {@link LegacyTextureCubeData}——`TextureCube` 已从主仓移除。
     *
     * @param textureCube 立方体贴图旧数据
     * @returns PNG DataURL
     */
    drawTextureCube(textureCube: LegacyTextureCubeData): string
    {
        const pixels = textureCube._pixels ?? [];

        const canvas2D = document.createElement('canvas');
        const width = 64;
        canvas2D.width = width;
        canvas2D.height = width;
        const context2D = canvas2D.getContext('2d');
        if (!context2D) throw new Error('[Feng3dScreenShot] 无法创建 2D 画布上下文');

        context2D.fillStyle = 'black';

        const w4 = Math.round(width / 4);
        const Yoffset = w4 / 2;
        //
        let X = w4 * 2;
        let Y = w4;
        if (pixels[0])
        { context2D.drawImage(pixels[0], X, Y + Yoffset, w4, w4); }
        else
        { context2D.fillRect(X, Y + Yoffset, w4, w4); }
        //
        X = w4;
        Y = 0;
        if (pixels[1]) context2D.drawImage(pixels[1], X, Y + Yoffset, w4, w4);
        else context2D.fillRect(X, Y + Yoffset, w4, w4);
        //
        X = w4;
        Y = w4;
        if (pixels[2]) context2D.drawImage(pixels[2], X, Y + Yoffset, w4, w4);
        else context2D.fillRect(X, Y + Yoffset, w4, w4);
        //
        X = 0;
        Y = w4;
        if (pixels[3]) context2D.drawImage(pixels[3], X, Y + Yoffset, w4, w4);
        else context2D.fillRect(X, Y + Yoffset, w4, w4);
        //
        X = w4;
        Y = w4 * 2;
        if (pixels[4]) context2D.drawImage(pixels[4], X, Y + Yoffset, w4, w4);
        else context2D.fillRect(X, Y + Yoffset, w4, w4);
        //
        X = w4 * 3;
        Y = w4;
        if (pixels[5]) context2D.drawImage(pixels[5], X, Y + Yoffset, w4, w4);
        else context2D.fillRect(X, Y + Yoffset, w4, w4);

        //
        const dataUrl = canvas2D.toDataURL();

        return dataUrl;
    }

    /**
     * 绘制材质预览图（球体 + 该材质）。
     *
     * @param material 材质
     * @returns PNG DataURL
     */
    async drawMaterial(material: Material): Promise<string>
    {
        return this.#enqueue(() =>
        {
            const renderer = reactive(this.#materialRenderer);
            renderer.geometry = { __type__: 'SphereGeometry' };
            renderer.material = material as unknown as Materials;

            return this.#renderObject3D(this.#materialObject);
        });
    }

    /**
     * 绘制几何体预览图（几何体 + 默认材质）。
     *
     * @param geometry 几何体
     * @returns PNG DataURL
     */
    async drawGeometry(geometry: GeometryLike): Promise<string>
    {
        return this.#enqueue(() =>
        {
            reactive(this.#geometryRenderer).geometry = geometry as unknown as Geometrys;

            return this.#renderObject3D(this.#geometryObject);
        });
    }

    /**
     * 绘制游戏对象预览图（对象挂进预览容器）。
     *
     * @param object3D 游戏对象
     * @returns PNG DataURL
     */
    async drawObject3D(object3D: Object3D): Promise<string>
    {
        return this.#enqueue(() => this.#renderObject3D(object3D));
    }

    /**
     * 设置预览渲染分辨率（正方形像素边长，下一次绘制生效）。
     *
     * @param size 像素边长
     */
    setPreviewSize(size: number): void
    {
        this.#applySize(size, size);
    }

    /**
     * 以指定尺寸重新渲染当前预览内容并导出 PNG DataURL。
     *
     * @param width 截图宽度（像素）
     * @param height 截图高度（像素）
     * @returns PNG DataURL
     */
    async toDataURL(width = 64, height = 64): Promise<string>
    {
        return this.#enqueue(() =>
        {
            this.#applySize(width, height);

            return this.#render();
        });
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
            // 默认略带俯视的朝向（旧实现 drawMaterial 默认相机旋转 (20°, -90°, 0°)）；
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

    // ---------------------------------------------------------------------
    // 内部实现
    // ---------------------------------------------------------------------

    /**
     * 把「挂载预览对象 → 提交渲染 → 取像素」整段串行化。
     *
     * 资源面板与检查器预览面板共享同一个离屏视图与容器，并发绘制会互相覆盖容器内容，
     * 导致各方拿到别人的画面；串行执行保证每次绘制与取像素是同一份场景。
     */
    #enqueue<T>(task: () => Promise<T>): Promise<T>
    {
        const result = this.#renderQueue.then(task, task);
        this.#renderQueue = result.then(() => undefined, () => undefined);

        return result;
    }

    /** 预览对象挂载（容器只保留该对象）+ 相机取景 + 渲染取像素 */
    async #renderObject3D(object3D: Object3D): Promise<string>
    {
        // 旧实现等价于 container.removeChildren() + container.addChild(object3D)
        reactive(this.container).children = [object3D];
        this.updateCameraPosition(object3D);

        return this.#render();
    }

    /** 同步画布显示尺寸（`ViewLogic` 据此同步渲染分辨率） */
    #applySize(width: number, height: number): void
    {
        this.#width = width;
        this.#height = height;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }

    /** 懒初始化 WebGPU（Promise 缓存：并发预览只创建一次设备） */
    #ensureWebGPU(): Promise<WebGPU>
    {
        this.#webgpu ||= new WebGPU({ canvasId: this.canvas }).init();

        return this.#webgpu;
    }

    /** 等待声明式纹理（`{ __type__: 'Texture', url }`）加载完成 */
    async #waitMaterialLoaded(material: Materials | undefined, maxTries = 300): Promise<void>
    {
        for (let i = 0; i < maxTries; i++)
        {
            if (!material || getLogic(material).isLoaded) return;
            // 轮询的是确定性状态（isLoaded），间隔只用于让出事件循环等待加载回调
            await new Promise<void>((resolve) => { setTimeout(resolve, 16); });
        }
    }

    /** 提交一次离屏渲染，并从画布纹理读回像素 */
    async #render(): Promise<string>
    {
        const webgpu = await this.#ensureWebGPU();
        const width = this.canvas.clientWidth || this.#width;
        const height = this.canvas.clientHeight || this.#height;

        // 标记一次数据变更：`WebGPU.submit` 对版本号未变的 Submit 会跳过（按需呈现），
        // 被跳过时画布纹理仍是上一帧已 present 的纹理，读取会失效。预览必须真实提交一次。
        markMutation();
        webgpu.submit(this.viewLogic.submit);

        // 确定性完成信号：readPixels 内部的 copyTextureToBuffer 与上面的渲染命令在同一
        // 队列中顺序执行，await 返回即代表像素已从 GPU 拷贝回 CPU（非定时器猜测时机）。
        const readPixels: ReadPixels = { origin: [0, 0], copySize: [width, height] };
        await webgpu.readPixels(readPixels);

        return this.#pixelsToDataURL(readPixels.result as Uint8Array, readPixels.format, width, height);
    }

    /** GPU 像素 → 2D 画布 → PNG DataURL（画布纹理通道序为 BGRA，需交换 R/B） */
    #pixelsToDataURL(pixels: Uint8Array, format: TextureFormat | undefined, width: number, height: number): string
    {
        const canvas2D = document.createElement('canvas');
        canvas2D.width = width;
        canvas2D.height = height;
        const context2D = canvas2D.getContext('2d');
        if (!context2D) throw new Error('[Feng3dScreenShot] 无法创建 2D 画布上下文');

        const imageData = context2D.createImageData(width, height);
        const data = imageData.data;
        const swapRB = format === 'bgra8unorm' || format === 'bgra8unorm-srgb';
        for (let i = 0; i < width * height; i++)
        {
            const offset = i * 4;
            data[offset] = swapRB ? pixels[offset + 2] : pixels[offset];
            data[offset + 1] = pixels[offset + 1];
            data[offset + 2] = swapRB ? pixels[offset] : pixels[offset + 2];
            data[offset + 3] = pixels[offset + 3];
        }
        context2D.putImageData(imageData, 0, 0);

        return canvas2D.toDataURL('image/png');
    }

    /** 贴图像素 → 2D 画布（铺满正方形）→ PNG DataURL */
    #imageToDataURL(pixels: ImageData | CanvasImageSource, size: number): string
    {
        const canvas2D = document.createElement('canvas');
        canvas2D.width = size;
        canvas2D.height = size;
        const context2D = canvas2D.getContext('2d');
        if (!context2D) throw new Error('[Feng3dScreenShot] 无法创建 2D 画布上下文');

        let source: CanvasImageSource | null = null;
        if (pixels instanceof ImageData)
        {
            const sourceCanvas = document.createElement('canvas');
            sourceCanvas.width = pixels.width;
            sourceCanvas.height = pixels.height;
            const sourceContext = sourceCanvas.getContext('2d');
            if (!sourceContext) throw new Error('[Feng3dScreenShot] 无法创建 2D 画布上下文');
            sourceContext.putImageData(pixels, 0, 0);
            source = sourceCanvas;
        }
        else
        {
            source = pixels;
        }

        context2D.drawImage(source, 0, 0, size, size);

        return canvas2D.toDataURL('image/png');
    }
}
