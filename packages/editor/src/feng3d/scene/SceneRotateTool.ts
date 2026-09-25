import { ComponentLogicBase, Matrix4x4, Vector3, globalEmitter, logic as getLogic, reactive, ticker } from 'feng3d';
import type { Color4, Component3D, Object3D, PerspectiveCamera, Ray3, Scene, StandardMaterial, Vector3Like, View, ViewLogic } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
import type { EditorView } from '../EditorView';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        SceneRotateTool: SceneRotateTool;
    }
}

// 注：`'editorCameraRotate'` 已在 `polyfill/feng3d/EventDispatcher.ts` 的
// `MixinsGlobalEvents` 声明合并中声明为 `Vector3`。此处**不要**重复声明——
// 重复声明若类型不同会触发 TS2717（后续属性声明必须同类型）。

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SceneRotateTool: SceneRotateToolLogic;
    }
}

/**
 * 场景旋转工具（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class SceneRotateTool extends Component`：
 * 新范式中组件是纯数据接口，行为由 {@link SceneRotateToolLogic} 提供。
 *
 * 职责：在右上角小视图里渲染六个轴向箭头，点击箭头把编辑器相机切到对应视图
 * （前/后/左/右/顶/底）。
 */
export interface SceneRotateTool extends Component3D
{
    readonly __type__: 'SceneRotateTool';

    /** 编辑器视图（由 SceneView 注入，缺失时不创建小视图） */
    readonly view?: EditorView;

    /** 图层容器（可选，缺失时回退到全局 `#SceneRotateToolLayer` 元素） */
    readonly layerContainer?: HTMLElement;
}

/** 六个轴向箭头：方向标签 → 箭头末端（单位向量）与颜色 */
const ARROW_SPECS: { readonly name: string; readonly dir: Vector3Like; readonly color: { r: number; g: number; b: number } }[] = [
    { name: 'arrowsX', dir: { x: 1, y: 0, z: 0 }, color: { r: 1, g: 0.2, b: 0.2 } },
    { name: 'arrowsNX', dir: { x: -1, y: 0, z: 0 }, color: { r: 0.45, g: 0.1, b: 0.1 } },
    { name: 'arrowsY', dir: { x: 0, y: 1, z: 0 }, color: { r: 0.3, g: 1, b: 0.3 } },
    { name: 'arrowsNY', dir: { x: 0, y: -1, z: 0 }, color: { r: 0.1, g: 0.45, b: 0.1 } },
    { name: 'arrowsZ', dir: { x: 0, y: 0, z: 1 }, color: { r: 0.3, g: 0.5, b: 1 } },
    { name: 'arrowsNZ', dir: { x: 0, y: 0, z: -1 }, color: { r: 0.1, g: 0.2, b: 0.45 } },
];

/** 箭头长度（小视图里的世界尺寸，小视图相机距离 1.0 时刚好占满） */
const ARROW_LENGTH = 0.34;

/** 相机距离小视图原点 */
const TOOL_CAMERA_DISTANCE = 1;

/**
 * 创建旋转工具箭头模型（纯数据字面量）。
 *
 * 旧实现从 `resource/gameobjects/SceneRotateTool.gameobject.json` 加载——该资源是旧格式
 * （`GameObject` / `Transform` / `Material.shaderName`），主仓旧反序列化链路已不可用，
 * 与 `Trident.ts` 同理改为字面量构造。
 *
 * 材质用 `StandardMaterial`：`ColorMaterial` 的 uniform（`u_diffuseInput`）在当前主仓
 * WebGPU 路径下未生效（渲染为黑色），`StandardMaterial` 已验证正常。
 *
 * @returns 模型根对象（六个箭头作为子级，顺序与 {@link ARROW_SPECS} 一致）
 */
function createRotateToolModel(): Object3D
{
    const children: Object3D[] = ARROW_SPECS.map((spec) =>
    {
        const diffuse: Color4 = { __type__: 'Color4', r: spec.color.r, g: spec.color.g, b: spec.color.b, a: 1 };
        const material: StandardMaterial = { __type__: 'StandardMaterial', uniforms: { u_diffuse: diffuse } };

        // 圆锥默认尖端朝 +Y：X/Z 向箭头需要旋转到对应轴（弧度）
        const isX = spec.dir.x !== 0;
        const isY = spec.dir.y !== 0;
        const halfPi = Math.PI / 2;
        const rotation = isY
            ? { x: spec.dir.y > 0 ? 0 : Math.PI, y: 0, z: 0 }
            : isX
                ? { x: 0, y: 0, z: spec.dir.x > 0 ? -halfPi : halfPi }
                : { x: spec.dir.z > 0 ? halfPi : -halfPi, y: 0, z: 0 };

        return {
            __type__: 'Object3D',
            name: spec.name,
            position: { x: spec.dir.x * ARROW_LENGTH, y: spec.dir.y * ARROW_LENGTH, z: spec.dir.z * ARROW_LENGTH },
            rotation,
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'ConeGeometry', bottomRadius: 0.09, height: 0.22 },
                material,
            }],
        };
    });

    return { __type__: 'Object3D', name: 'sceneRotateToolModel', children };
}

/**
 * SceneRotateToolLogic 逻辑类。
 *
 * 初始化时在图层容器里创建一个 80×80 的独立小视图（纯数据 `View` + `ViewLogic`），
 * 渲染箭头模型；每帧经 {@link EditorView.submit} 复用编辑器的 WebGPU 设备提交。
 * 点击箭头 → 把编辑器相机切到对应视图。
 */
export class SceneRotateToolLogic extends ComponentLogicBase
{
    #data: SceneRotateTool;

    /** 小视图画布 */
    #canvas: HTMLCanvasElement | null = null;

    /** 小视图 logic */
    #viewLogic: ViewLogic | null = null;

    /** 小视图相机组件 */
    #camera: PerspectiveCamera | null = null;

    /** 箭头对象（顺序与 {@link ARROW_SPECS} 一致） */
    #arrows: Object3D[] = [];

    /** 每帧提交回调（dispose 时移除） */
    #frame: (() => void) | null = null;

    /** 画布 mouseup 监听（dispose 时移除） */
    #onMouseUp: ((event: MouseEvent) => void) | null = null;

    protected constructor(data: SceneRotateTool)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: SceneRotateTool): SceneRotateToolLogic
    {
        return new SceneRotateToolLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        const editorView = this.#data.view;
        const container = this.#data.layerContainer ?? document.getElementById('SceneRotateToolLayer');
        if (!editorView || !container) return;

        // ---- 小画布：撑满图层容器（80×80） ----
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:auto;';
        container.appendChild(canvas);
        this.#canvas = canvas;

        // ---- 箭头模型 ----
        const model = createRotateToolModel();
        this.#arrows = model.children as Object3D[];

        // ---- 小视图场景：相机 + 光照 + 模型（相机斜视，六个箭头互不遮挡） ----
        const camera: PerspectiveCamera = { __type__: 'PerspectiveCamera', fov: 45, aspect: 1, near: 0.01, far: 10 };
        const cameraObject: Object3D = {
            __type__: 'Object3D',
            name: 'rotateToolCamera',
            position: { x: 0.62, y: 0.5, z: 0.82 },
            components: [camera],
        };
        const sceneComponent: Scene = {
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.14, g: 0.14, b: 0.15, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.75, g: 0.75, b: 0.75, a: 1 },
        };
        const lightObject: Object3D = {
            __type__: 'Object3D',
            name: 'rotateToolLight',
            position: { x: 0.6, y: 0.8, z: 0.9 },
            components: [{ __type__: 'PointLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1, range: 10 }],
        };
        const root: Object3D = {
            __type__: 'Object3D',
            name: 'sceneRotateToolRoot',
            components: [sceneComponent],
            children: [cameraObject, lightObject, model],
        };
        const view = { __type__: 'View', canvas, root } as View;

        this.#camera = camera;
        this.#viewLogic = getLogic(view);
        // 小视图相机看向原点
        getLogic(cameraObject).lookAt(new Vector3(0, 0, 0));

        // ---- 每帧提交（复用编辑器 WebGPU 设备） ----
        const viewLogic = this.#viewLogic;
        const frame = () => { editorView.submit(viewLogic.submit); };
        this.#frame = frame;
        ticker.onframe(frame);

        // ---- 点击箭头 → 切换编辑器相机视图 ----
        const onMouseUp = (event: MouseEvent) => { this.#pickArrow(event); };
        this.#onMouseUp = onMouseUp;
        canvas.addEventListener('mouseup', onMouseUp);
    }

    override dispose(): void
    {
        if (this.#frame) ticker.offframe(this.#frame);
        this.#frame = null;
        if (this.#canvas && this.#onMouseUp) this.#canvas.removeEventListener('mouseup', this.#onMouseUp);
        this.#onMouseUp = null;
        if (this.#canvas?.parentElement) this.#canvas.parentElement.removeChild(this.#canvas);
        this.#canvas = null;
        this.#viewLogic = null;

        super.dispose();
    }

    /** 在小视图里拾取被点击的箭头并切换视图 */
    #pickArrow(event: MouseEvent): void
    {
        const canvas = this.#canvas;
        const camera = this.#camera;
        if (!canvas || !camera) return;

        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        // 屏幕坐标 → GPU 坐标（-1~1，Y 翻转）
        const gx = ((event.clientX - rect.left) * 2 - rect.width) / rect.width;
        const gy = -((event.clientY - rect.top) * 2 - rect.height) / rect.height;
        const ray = getLogic(camera).getRay3D(gx, gy);

        let nearest: Object3D | null = null;
        let nearestDistance = Number.MAX_VALUE;
        for (const arrow of this.#arrows)
        {
            const model = arrow.components?.[0];
            if (!model) continue;
            const hit = (getLogic(model) as unknown as { worldRayIntersection(ray: Ray3): { rayEntryDistance: number } | null })
                .worldRayIntersection(ray);
            if (hit && hit.rayEntryDistance < nearestDistance)
            {
                nearestDistance = hit.rayEntryDistance;
                nearest = arrow;
            }
        }
        if (nearest) this.clickItem(nearest);
    }

    /**
     * 点击某个轴向箭头 → 把编辑器相机旋转到对应视图。
     *
     * 与旧实现一致：由目标视图角度算出相机朝向，并广播 `editorCameraRotate`
     * （供其它编辑器模块订阅）；相机朝向经响应式写入宿主对象。
     *
     * @param item 被点击的箭头对象
     */
    clickItem(item: Object3D): void
    {
        if (!item) return;

        const frontView = { x: 0, y: 0, z: 0 }; // 前视图
        const backView = { x: 0, y: 180, z: 0 }; // 后视图
        const rightView = { x: 0, y: 90, z: 0 }; // 右视图
        const leftView = { x: 0, y: -90, z: 0 }; // 左视图
        const topView = { x: -90, y: 0, z: 0 }; // 顶视图
        const bottomView = { x: 90, y: 0, z: 0 }; // 底视图

        let rotation: { readonly x: number; readonly y: number; readonly z: number } | undefined;
        switch (item.name)
        {
            case 'arrowsX':
                rotation = rightView;
                break;
            case 'arrowsNX':
                rotation = leftView;
                break;
            case 'arrowsY':
                rotation = topView;
                break;
            case 'arrowsNY':
                rotation = bottomView;
                break;
            case 'arrowsZ':
                rotation = backView;
                break;
            case 'arrowsNZ':
                rotation = frontView;
                break;
        }
        if (!rotation) return;

        // `Matrix4x4.fromRotation` 接受弧度（视图角度按惯例用度书写，这里换算）
        const DEG2RAD = Math.PI / 180;
        const cameraTargetMatrix = Matrix4x4.fromRotation(rotation.x * DEG2RAD, rotation.y * DEG2RAD, rotation.z * DEG2RAD);
        cameraTargetMatrix.invert();
        const result = cameraTargetMatrix.toTRS()[1];

        globalEmitter.emit('editorCameraRotate', result);

        // 写入编辑器相机宿主对象（rotation 单位为弧度）
        const editorCamera = this.#data.view?.camera;
        const cameraObject = editorCamera ? getLogic(editorCamera).entity as Object3D | null : null;
        if (cameraObject)
        {
            reactive(cameraObject).rotation = { x: result.x, y: result.y, z: result.z };
        }
    }

    /** 组件数据（raw） */
    get data(): SceneRotateTool
    {
        return this.#data;
    }
}

// 注册到 logic 分发表
registerLogic('SceneRotateTool', SceneRotateToolLogic as unknown as new (data: SceneRotateTool) => SceneRotateToolLogic);
