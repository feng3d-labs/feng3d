import { logic as getLogic, reactive } from 'feng3d';
import type { Camera, GeometryLike, Material, Object3D, Scene, View, ViewLogic } from 'feng3d';

// TODO(P1 API 迁移)：以下符号仅供「旧实现存档」注释参考，当前不需要导入——
// `serialization`（`setValue` 命令式构造对象，现用纯数据字面量）、
// `PerspectiveLens`（已合并进 `PerspectiveCamera`，`camera.lens` 不存在）、
// `Texture2D` / `TextureCube`（已统一为 `Texture` 纯数据接口）、
// `Geometry.getDefault` / `Material.getDefault`（默认资源获取方式待定）、
// `Vector3`（相机旋转参数，改用 `{ x, y, z }` 字面量）、
// `Renderable`（渲染组件改为 `MeshRenderer`）。

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
 * **P0 阶段（编辑器启动解阻塞）说明**：
 * 旧实现把 `View` 当**类**使用（`new View()` / `view.scene` / `view.camera` /
 * `view.setSize()` / `view.render()` / `view.stop()`），但主仓 `View` 已是**纯数据
 * interface**（运行时无值），`new View()` 会抛 `TypeError: View is not a constructor`，
 * 使整个模块图加载失败。P0 改为「纯数据 View 字面量 + `logic(view)`」初始化，
 * 其余依赖已移除 API 的渲染逻辑暂缓执行并标注 TODO。
 */
export class Feng3dScreenShot
{
    static get feng3dScreenShot(): Feng3dScreenShot
    {
        this._feng3dScreenShot = this._feng3dScreenShot || new Feng3dScreenShot();

        return this._feng3dScreenShot;
    }

    private static _feng3dScreenShot: Feng3dScreenShot | null = null;

    /** 离线渲染视图（纯数据 View + 其 logic） */
    view: View;

    /** 视图 logic（渲染链入口：`viewLogic.submit`） */
    viewLogic: ViewLogic;

    /**
     * 视图场景。
     *
     * TODO(P1 API 迁移)：新范式下场景由 `view.root` 派生（`ViewLogic` 内部 computed），
     * 不再有 `view.scene` 字段；本字段待渲染路径迁移后由 `logic(view).submit` 链路取代。
     */
    scene: Scene | null = null;

    /**
     * 视图相机。
     *
     * TODO(P1 API 迁移)：同上，相机由 `view.root` 子树派生（`ViewLogic` 内部 computed）。
     */
    camera: Camera | null = null;

    /** 渲染截图容器（预览对象临时挂载点） */
    container: Object3D;

    /** 默认几何体（原 `Geometry.getDefault('Sphere')`，获取方式待迁移） */
    defaultGeometry: unknown = undefined;

    /** 默认材质（原 `Material.getDefault('Default-Material')`，获取方式待迁移） */
    defaultMaterial: unknown = undefined;

    /** 材质预览宿主对象 */
    private materialObject: Object3D;

    /** 几何体预览宿主对象 */
    private geometryObject: Object3D;

    constructor()
    {
        // 初始化 3D 视图：纯数据字面量 + `logic(view)` 触发 `ViewLogic`
        //（自动创建默认场景与默认相机，见 packages/feng3d/src/core/View.ts）。
        // 旧写法 `const view = new View(); view.canvas.style.visibility = 'hidden'; view.setSize(64, 64);`
        // 中的画布尺寸同步由 `ViewLogic` 每帧按 `canvas.clientWidth/Height` 完成。
        this.view = {
            __type__: 'View',
            canvas: document.createElement('canvas'),
            root: {
                __type__: 'Object3D',
                name: 'screenShotRoot',
                components: [],
                children: [],
            },
        };
        this.viewLogic = getLogic(this.view);

        // 预览宿主对象与容器（纯数据声明；父子关系由 ContainerLogic 的 effect 维护）
        this.container = { __type__: 'Object3D', name: '渲染截图容器', children: [] };
        this.materialObject = { __type__: 'Object3D', name: 'materialObject', components: [] };
        this.geometryObject = { __type__: 'Object3D', name: 'geometryObject', components: [] };
        reactive(this.view).root.children.push(this.container);
        reactive(this.container).children.push(this.materialObject, this.geometryObject);

        // TODO(P1 API 迁移)：以下旧初始化逐条对应新写法，待渲染路径迁移后恢复——
        //   canvas.style.visibility = 'hidden'; view.setSize(64, 64);
        //   const scene = this.scene = view.scene;                  // → view.root 派生
        //   scene.background.fromUnit(0xff525252);                  // → reactive(scene).background = { __type__: 'Color4', ... }
        //   scene.ambientColor.setTo(0.4, 0.4, 0.4);                // → reactive(scene).ambientColor = { __type__: 'Color4', ... }
        //   const camera = this.camera = view.camera;               // → view.root 子树派生
        //   camera.lens = new PerspectiveLens(45);                  // → PerspectiveCamera 内联 fov/near/far
        //   serialization.setValue(new Object3D(), { ... })         // → { __type__: 'Object3D', name: 'DirectionalLight', components: [{ __type__: 'DirectionalLight' }] }
        //   reactive(light.transform.rotation).x = 50; ...          // → reactive(light).rotation = { x: 50 * DEG2RAD, y: -30 * DEG2RAD, z: 0 }
        //   scene.object3D.addChild(light);                         // → reactive(view.root).children.push(light)
        //   view.stop();                                            // → 帧循环改由 ticker.onframe + webgpu.submit(viewLogic.submit) 驱动
    }

    /**
     * 绘制贴图。
     *
     * TODO(P1 API 迁移)：旧实现读取 `texture.activePixels`（`Texture2D` 已移除），
     * 并按 `HTMLImageElement` / `ImageData` 画入 2D 画布。主仓统一 `Texture` 纯数据接口后，
     * 需改从纹理资源（`TextureResource`）取像素，待纹理预览迁移时恢复。
     *
     * @param _texture 贴图（旧 `Texture2D`）
     * @returns PNG DataURL
     */
    drawTexture(_texture: unknown): string
    {
        throw new Error('[Feng3dScreenShot] drawTexture 待迁移：`Texture2D.activePixels` 已从主仓移除（TODO(P1 API 迁移)）');
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
     * 绘制材质预览图。
     *
     * TODO(P1 API 迁移)：旧实现把材质挂到预览对象（`this.materialObject.getComponent(Renderable)`）
     * 后旋转相机并调用 `_drawObject3D`；`getComponent` / 命令式渲染路径均已变更，
     * 待 `ViewLogic.submit` 渲染链迁移后恢复。
     *
     * @param _material 材质
     * @returns PNG DataURL（P1 恢复后由 `toDataURL()` 产出）
     */
    drawMaterial(_material: Material): string
    {
        throw new Error('[Feng3dScreenShot] drawMaterial 待迁移：命令式渲染路径已移除（TODO(P1 API 迁移)）');
    }

    /**
     * 绘制几何体预览图。
     *
     * TODO(P1 API 迁移)：同 {@link drawMaterial}。
     *
     * @param _geometry 几何体
     * @returns PNG DataURL（P1 恢复后由 `toDataURL()` 产出）
     */
    drawGeometry(_geometry: GeometryLike): string
    {
        throw new Error('[Feng3dScreenShot] drawGeometry 待迁移：命令式渲染路径已移除（TODO(P1 API 迁移)）');
    }

    /**
     * 绘制游戏对象预览图。
     *
     * TODO(P1 API 迁移)：同 {@link drawMaterial}。
     *
     * @param _object3D 游戏对象
     * @returns PNG DataURL（P1 恢复后由 `toDataURL()` 产出）
     */
    drawObject3D(_object3D: Object3D): string
    {
        throw new Error('[Feng3dScreenShot] drawObject3D 待迁移：命令式渲染路径已移除（TODO(P1 API 迁移)）');
    }

    /**
     * 转换为 DataURL。
     *
     * TODO(P1 API 迁移)：旧实现为 `this.view.setSize(width, height); this.view.render();
     * this.view.canvas.toDataURL();`。新范式无 `setSize` / `render`——画布尺寸由 `ViewLogic`
     * 每帧同步，渲染结果经 `viewLogic.submit` 提交（`webgpu.submit`）后从画布取像素。
     *
     * @param width 截图宽度
     * @param height 截图高度
     * @returns PNG DataURL
     */
    toDataURL(width = 64, height = 64): string
    {
        void width;
        void height;

        throw new Error('[Feng3dScreenShot] toDataURL 待迁移：`View.setSize/render` 已移除（TODO(P1 API 迁移)）');
    }

    /**
     * 更新相机位置以框住目标对象。
     *
     * TODO(P1 API 迁移)：旧实现读取 `object3D.boundingBox.worldBounds`、
     * `camera.lens`（`PerspectiveLens` 已并入 `PerspectiveCamera`）与
     * `logic(camera.transform)`（`transform` 已移除，改用 `logic(cameraObject).local2world`）。
     *
     * @param _object3D 目标对象
     */
    updateCameraPosition(_object3D: Object3D): void
    {
        throw new Error('[Feng3dScreenShot] updateCameraPosition 待迁移：`camera.lens` / `transform` 已移除（TODO(P1 API 迁移)）');
    }

    // ---------------------------------------------------------------------
    // 旧实现存档（P1 按新范式重写）：
    //
    // drawMaterial(material: Material, cameraRotation = new Vector3(20, -90, 0))
    // {
    //     const mode = this.materialObject.getComponent(Renderable);
    //     mode.geometry = this.defaultGeometry;
    //     mode.material = material;
    //     if (cameraRotation)
    //     {
    //         const r = reactive(this.camera.transform.rotation);
    //         r.x = cameraRotation.x; r.y = cameraRotation.y; r.z = cameraRotation.z;
    //     }
    //     this._drawObject3D(this.materialObject);
    //     return this;
    // }
    //
    // drawGeometry(geometry, cameraRotation = new Vector3(-20, 120, 0))  —— 同上，模型为 geometryObject
    // drawObject3D(object3D, cameraRotation = new Vector3(20, -120, 0))  —— 只设相机旋转
    //
    // private _drawObject3D(object3D: Object3D)
    // {
    //     this.container.removeChildren();
    //     this.container.addChild(object3D);
    //     this.updateCameraPosition(object3D);
    // }
    // ---------------------------------------------------------------------
}
