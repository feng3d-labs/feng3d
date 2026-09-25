import { logic as getLogic, reactive } from 'feng3d';
import type { Camera, GeometryLike, Geometrys, Material, Materials, MeshRenderer, Object3D, Scene, TextureMaterial, TextureResource, View, ViewLogic } from 'feng3d';
import { Feng3dScreenShotRenderer } from './Feng3dScreenShotRenderer';
import { imageToDataURL, textureCubeToDataURL } from './screenShotCanvas';
import type { LegacyTextureCubeData } from './screenShotCanvas';

/**
 * 主仓 `Texture2D.activePixels` 移除后，editor 资源系统把纹理像素附加在 `_pixels` 上
 * （见 `@feng3d/assets` 的 `TextureAsset.readFile`）。
 */
interface TextureWithPixels
{
    readonly _pixels?: ImageData | CanvasImageSource;
}

/**
 * feng3d 预览图工具。
 *
 * 注意：本类**不是组件**，不参与 `ComponentMap` / `LogicMap` 注册；它只是编辑器资源面板
 * 与检查器预览面板用来离线渲染一张预览图的辅助类（`Feng3dScreenShot.feng3dScreenShot` 单例）。
 *
 * 离屏渲染与取像素由 {@link Feng3dScreenShotRenderer} 承载（纯数据 View + `ViewLogic.submit`
 * + `webgpu.readPixels`，无需 Ticker 每帧驱动）；2D 画布工具在 `screenShotCanvas.ts`。
 * 本类负责「把绘制目标挂进预览容器 → 取景 → 渲染」，并把多来源的并发调用串行化。
 *
 * 所有绘制方法均为**异步**（`Promise<string>`，值为 PNG DataURL）：WebGPU 取像素只能经
 * `mapAsync` 异步完成，`canvas.toDataURL()` 对 WebGPU 画布并不可靠。
 */
export class Feng3dScreenShot
{
    static get feng3dScreenShot(): Feng3dScreenShot
    {
        this._feng3dScreenShot = this._feng3dScreenShot || new Feng3dScreenShot();

        return this._feng3dScreenShot;
    }

    private static _feng3dScreenShot: Feng3dScreenShot | null = null;

    /** 离屏渲染上下文（画布 / 视图 / WebGPU / 取景） */
    readonly renderer: Feng3dScreenShotRenderer;

    /** 渲染截图容器（预览对象临时挂载点） */
    readonly container: Object3D;

    /** 离线渲染视图（纯数据 View + 其 logic） */
    get view(): View { return this.renderer.view; }

    /** 视图 logic（渲染链入口：`viewLogic.submit`） */
    get viewLogic(): ViewLogic { return this.renderer.viewLogic; }

    /** 离屏渲染画布 */
    get canvas(): HTMLCanvasElement { return this.renderer.canvas; }

    /** 视图场景（预览画面背景与环境色） */
    get scene(): Scene { return this.renderer.scene; }

    /** 视图相机（`PerspectiveCamera` 内联 fov/aspect/near/far） */
    get camera(): Camera { return this.renderer.camera; }

    /** 相机宿主对象（相机变换只经宿主对象的 position/rotation 写入） */
    get cameraObject(): Object3D { return this.renderer.cameraObject; }

    /** 材质预览宿主对象（球体） */
    readonly #materialObject: Object3D;

    /** 几何体预览宿主对象 */
    readonly #geometryObject: Object3D;

    /** 材质预览渲染组件（每次预览替换 geometry/material） */
    readonly #materialRenderer: MeshRenderer;

    /** 几何体预览渲染组件（每次预览替换 geometry） */
    readonly #geometryRenderer: MeshRenderer;

    /** 预览渲染串行化队列（见 #enqueue） */
    #renderQueue: Promise<unknown> = Promise.resolve();

    /** 最近一次预览的像素尺寸（贴图预览直接绘制时使用） */
    #size = 64;

    constructor()
    {
        this.renderer = new Feng3dScreenShotRenderer(this.#size);

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

        // 容器挂进视图 root：预览对象都挂在容器下，容器自身无位移（不影响取景）
        reactive(this.view).root.children.push(this.container);
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
                return imageToDataURL(pixels, this.#size);
            }

            if ((texture as { __type__?: string } | null)?.__type__ === 'Texture')
            {
                const material: TextureMaterial = {
                    __type__: 'TextureMaterial',
                    uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
                    s_texture: texture as TextureResource,
                };
                const r_renderer = reactive(this.#materialRenderer);
                r_renderer.geometry = { __type__: 'QuadGeometry' };
                r_renderer.material = material;
                // 声明式纹理是惰性加载的：等材质报告就绪，否则渲染到的是 1×1 占位纹理
                await this.#waitMaterialLoaded(material);

                return this.#renderObject3D(this.#materialObject);
            }

            throw new Error('[Feng3dScreenShot] drawTexture 无法取像素：纹理既无 `_pixels`（editor 资源系统附加的像素），也不是 `{ __type__: "Texture", url }` 声明式引用');
        });
    }

    /**
     * 绘制立方体贴图（六面像素拼成十字布局，旧实现保留）。
     *
     * TODO(P1 API 迁移)：`TextureCube` 已从主仓移除，六面像素不再以 `_pixels` 暴露；
     * 调用方（资源面板）当前无数据来源，待立方体贴图预览迁移后恢复。
     *
     * @param textureCube 立方体贴图旧数据
     * @returns PNG DataURL
     */
    drawTextureCube(textureCube: LegacyTextureCubeData): string
    {
        return textureCubeToDataURL(textureCube, this.#size);
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
            const r_renderer = reactive(this.#materialRenderer);
            r_renderer.geometry = { __type__: 'SphereGeometry' };
            r_renderer.material = material as unknown as Materials;

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
        this.#size = size;
        this.renderer.setSize(size, size);
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
            this.#size = width;
            this.renderer.setSize(width, height);

            return this.renderer.render();
        });
    }

    /**
     * 更新相机位置以框住目标对象（保留相机当前朝向，仅调整距离与裁剪面）。
     *
     * @param object3D 目标对象
     */
    updateCameraPosition(object3D: Object3D): void
    {
        this.renderer.updateCameraPosition(object3D);
    }

    // ---------------------------------------------------------------------
    // 内部实现
    // ---------------------------------------------------------------------

    /**
     * 把「挂载预览对象 → 提交渲染 → 取像素」整段串行化。
     *
     * 资源面板与检查器预览面板共享同一个离屏视图与容器，并发绘制会互相覆盖容器内容，
     * 导致各方拿到别人的画面；串行执行保证每次绘制与取像素对应同一份场景。
     */
    #enqueue<T>(task: () => Promise<T>): Promise<T>
    {
        const result = this.#renderQueue.then(task, task);
        this.#renderQueue = result.then(() => undefined, () => undefined);

        return result;
    }

    /** 预览对象挂载（容器只保留该对象）+ 相机取景 + 渲染取像素 */
    #renderObject3D(object3D: Object3D): Promise<string>
    {
        // 旧实现等价于 container.removeChildren() + container.addChild(object3D)
        reactive(this.container).children = [object3D];
        this.renderer.updateCameraPosition(object3D);

        return this.renderer.render();
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
}
