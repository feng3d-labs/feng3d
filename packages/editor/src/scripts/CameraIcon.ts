import { Vector3, logic as getLogic, reactive, effect, shortcut, ticker } from 'feng3d';
import type { Billboard, Camera, Color4, MeshRenderer, Object3D, OrthographicCamera, PerspectiveCamera, PlaneGeometry, PointGeometry, PointInfo, PointMaterial, Segment, SegmentGeometry, SegmentMaterial, TextureMaterial } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
import { EditorData } from '../global/EditorData';
import { EditorScript, EditorScriptLogic } from './EditorScript';
import { ALPHA_BLEND, cameraObject3D, setWorldMatrix } from './iconUtils';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        CameraIcon: CameraIcon;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        CameraIcon: CameraIconLogic;
    }
}

/**
 * 相机图标（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class CameraIcon extends EditorScript`。
 * 图标 = 相机贴图（camera.png）+ 选中时显示的视锥线框（透视 / 正交两种投影分别计算）。
 *
 * 旧范式依赖的 `PerspectiveLens` / `OrthographicLens` / `Texture2D` / `Transform`
 * 在主仓均已移除，本实现改用：
 * - `PerspectiveCamera` / `OrthographicCamera` 的**内联投影参数字段**（`fov/aspect/near/far`
 *   或 `left/right/top/bottom/near/far`）替代 `camera.lens`
 * - `__type__` 字符串判别替代 `instanceof PerspectiveLens / OrthographicLens`
 * - `{ __type__: 'Texture', url }` 声明式纹理替代 `new Texture2D()`
 */
export interface CameraIcon extends EditorScript
{
    /** 组件类型名 */
    readonly __type__: 'CameraIcon';
    /** 被跟随的相机组件 */
    readonly camera?: Camera;
    /** 编辑器相机（缺失时不构建图标） */
    readonly editorCamera?: Camera;
}

/**
 * CameraIcon 逻辑类。
 */
export class CameraIconLogic extends EditorScriptLogic
{
    /** 组件数据（raw） */
    #data: CameraIcon;

    /** 图标根对象（懒创建） */
    #lightIcon: Object3D | null = null;
    /** 视锥线框对象（懒创建） */
    #lightLines: Object3D | null = null;
    /** 视锥远平面点对象（懒创建） */
    #lightpoints: Object3D | null = null;
    /** 线段几何体（视锥参数变化时重算 segments） */
    #segmentGeometry: SegmentGeometry | null = null;
    /** 点几何体（视锥参数变化时重算 points） */
    #pointGeometry: PointGeometry | null = null;

    /** 视锥参数是否变化（由响应式 effect 置脏，替代旧 `'lensChanged'` 字符串事件） */
    #lensChanged = true;

    protected constructor(data: CameraIcon)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CameraIcon): CameraIconLogic
    {
        return new CameraIconLogic(data);
    }

    override init(object3D?: Object3D): void
    {
        super.init(object3D);

        // @边界 effect：editorCamera 就绪 → 构建图标（替代旧 setter 内的 initicon() 副作用）
        effect(() =>
        {
            reactive(this.#data).editorCamera; // 建立依赖

            if (this.#data.editorCamera) this.#initIcon();
        });

        // @边界 effect：视锥参数变化 → 置脏
        // 读具体相机的 projectionMatrix（依赖 fov/aspect/near/far 或 left/right/top/bottom）
        // 建立依赖，替代旧 `newValue.on('lensChanged', ...)` 字符串事件。
        effect(() =>
        {
            const r_data = reactive(this.#data);
            r_data.camera; // 建立对 camera 字段的依赖

            const camera = this.#data.camera; // 原始值
            if (camera)
            {
                const type = (camera as { __type__: string }).__type__;
                if (type === 'PerspectiveCamera') void getLogic(camera as PerspectiveCamera).projectionMatrix;
                else if (type === 'OrthographicCamera') void getLogic(camera as OrthographicCamera).projectionMatrix;
            }

            this.#lensChanged = true;
        });

        // @边界 effect：跟随相机世界变换
        // （替代旧 watcher.watch(this, 'camera', ...) + 'scenetransformChanged' 字符串事件）
        effect(() =>
        {
            const r_data = reactive(this.#data);
            r_data.camera; // 建立依赖

            const camera = this.#data.camera;
            if (!camera) return;

            const cameraObject = cameraObject3D(camera);
            const host = this.entity;
            if (!cameraObject || !host) return;

            setWorldMatrix(host, getLogic(cameraObject).local2world);
        });
    }

    override update(): void
    {
        const camera = this.#data.camera;
        const host = this.entity;
        if (!camera || !host) return;

        const lines = this.#lightLines;
        const points = this.#lightpoints;
        if (!lines || !points) return;

        const cameraObject = cameraObject3D(camera);
        if (!cameraObject) return;

        if (EditorData.editorData.selectedObject3Ds.indexOf(cameraObject) === -1)
        {
            reactive(lines).activeSelf = false;
            reactive(points).activeSelf = false;

            return;
        }

        if (this.#lensChanged)
        {
            this.#rebuildFrustum(camera);
            this.#lensChanged = false;
        }

        reactive(lines).activeSelf = true;
        reactive(points).activeSelf = true;
    }

    /**
     * 选中被跟随的相机对象。
     *
     * 旧写法在 `init()` 中注册 `this.on('mousedown', ...)`；主仓已移除纯数据
     * Object3D 的字符串事件，本方法保留为点击选择入口待接线（TODO）。
     */
    selectCamera(): void
    {
        const camera = this.#data.camera;
        if (!camera) return;

        const cameraObject = cameraObject3D(camera);
        if (!cameraObject) return;

        EditorData.editorData.selectObject(cameraObject);
        // 防止再次调用鼠标拾取
        shortcut.activityState('selectInvalid');
        ticker.once(100, () =>
        {
            shortcut.deactivityState('selectInvalid');
        });
    }

    override dispose(): void
    {
        const icon = this.#lightIcon;
        const lines = this.#lightLines;
        const points = this.#lightpoints;
        this.#lightIcon = null;
        this.#lightLines = null;
        this.#lightpoints = null;
        this.#segmentGeometry = null;
        this.#pointGeometry = null;

        if (icon) getLogic(icon).dispose();
        if (lines) getLogic(lines).dispose();
        if (points) getLogic(points).dispose();

        // 基类 dispose 写入 enabled = false
        super.dispose();
    }

    /**
     * 构建图标子对象（幂等）。
     *
     * `hideFlags = HideFlags.Hide` 与 `setDepthWrite(material, false)` 无替代：
     * 主仓 `Object3D` 无 `hideFlags` 字段，`TextureMaterial` 也未暴露深度写入策略
     * （pipeline 由材质 logic 内部持有）。
     */
    #initIcon(): void
    {
        if (this.#lightIcon) return;

        const host = this.entity;
        const editorCamera = this.#data.editorCamera;
        if (!host || !editorCamera) return;

        const textureMaterial: TextureMaterial = {
            __type__: 'TextureMaterial',
            uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
            s_texture: { __type__: 'Texture', url: EditorData.editorData.getEditorAssetPath('assets/3d/icons/camera.png') },
            blend: ALPHA_BLEND,
        };
        const iconObject3D: Object3D = {
            __type__: 'Object3D',
            name: 'CameraIcon',
            components: [
                { __type__: 'Billboard' },
                {
                    __type__: 'MeshRenderer',
                    material: textureMaterial,
                    geometry: { __type__: 'PlaneGeometry', width: 1, height: 1, segmentsW: 1, segmentsH: 1, yUp: false },
                },
            ],
        };

        const segmentGeometry: SegmentGeometry = { __type__: 'SegmentGeometry', segments: [] };
        const linesObject3D: Object3D = {
            __type__: 'Object3D',
            name: 'Lines',
            mouseEnabled: false,
            components: [
                {
                    __type__: 'MeshRenderer',
                    geometry: segmentGeometry,
                    material: {
                        __type__: 'SegmentMaterial',
                        uniforms: { u_segmentColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 0.5 } },
                    },
                },
            ],
        };

        const pointGeometry: PointGeometry = { __type__: 'PointGeometry', points: [] };
        const pointsObject3D: Object3D = {
            __type__: 'Object3D',
            name: 'points',
            mouseEnabled: false,
            components: [
                {
                    __type__: 'MeshRenderer',
                    geometry: pointGeometry,
                    material: {
                        __type__: 'PointMaterial',
                        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 1 },
                    },
                },
            ],
        };

        const r_children = reactive(host).children as unknown as Object3D[];
        r_children.push(iconObject3D, linesObject3D, pointsObject3D);

        this.#lightIcon = iconObject3D;
        this.#lightLines = linesObject3D;
        this.#lightpoints = pointsObject3D;
        this.#segmentGeometry = segmentGeometry;
        this.#pointGeometry = pointGeometry;
    }

    /**
     * 按相机投影参数重建视锥线框（近平面矩形 + 4 条侧棱 + 远平面矩形 + 远平面中心十字点）。
     *
     * 透视与正交由 `camera.__type__` 判别（替代已移除的 `instanceof PerspectiveLens /
     * OrthographicLens`）；抽象基类 Camera 无投影参数，直接跳过。
     */
    #rebuildFrustum(camera: Camera): void
    {
        const white: Color4 = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };
        const segmentOf = (start: Vector3, end: Vector3): Segment => ({ start, end, startColor: white, endColor: white });

        const type = (camera as { __type__: string }).__type__;
        let near: number;
        let far: number;
        let nearLeft: number;
        let nearRight: number;
        let nearTop: number;
        let nearBottom: number;
        let farLeft: number;
        let farRight: number;
        let farTop: number;
        let farBottom: number;

        if (type === 'PerspectiveCamera')
        {
            const perspectiveCamera = camera as PerspectiveCamera;
            const fov = perspectiveCamera.fov ?? 60;
            const aspect = perspectiveCamera.aspect ?? 1;
            near = perspectiveCamera.near ?? 0.3;
            far = perspectiveCamera.far ?? 1000;
            const tan = Math.tan(fov * Math.PI / 360);
            nearLeft = -tan * near * aspect;
            nearRight = tan * near * aspect;
            nearTop = tan * near;
            nearBottom = -tan * near;
            farLeft = -tan * far * aspect;
            farRight = tan * far * aspect;
            farTop = tan * far;
            farBottom = -tan * far;
        }
        else if (type === 'OrthographicCamera')
        {
            // 正交投影视锥是方盒，near/far 平面边界相同
            const orthographicCamera = camera as OrthographicCamera;
            near = orthographicCamera.near ?? 0.3;
            far = orthographicCamera.far ?? 1000;
            nearLeft = orthographicCamera.left ?? -1;
            nearRight = orthographicCamera.right ?? 1;
            nearTop = orthographicCamera.top ?? 1;
            nearBottom = orthographicCamera.bottom ?? -1;
            farLeft = nearLeft;
            farRight = nearRight;
            farTop = nearTop;
            farBottom = nearBottom;
        }
        else
        {
            return;
        }

        const points: PointInfo[] = [
            { position: new Vector3(0, farBottom, far) },
            { position: new Vector3(0, farTop, far) },
            { position: new Vector3(farLeft, 0, far) },
            { position: new Vector3(farRight, 0, far) },
        ];
        const segments: Segment[] = [
            segmentOf(new Vector3(nearLeft, nearBottom, near), new Vector3(nearRight, nearBottom, near)),
            segmentOf(new Vector3(nearLeft, nearBottom, near), new Vector3(nearLeft, nearTop, near)),
            segmentOf(new Vector3(nearLeft, nearTop, near), new Vector3(nearRight, nearTop, near)),
            segmentOf(new Vector3(nearRight, nearBottom, near), new Vector3(nearRight, nearTop, near)),
            //
            segmentOf(new Vector3(nearLeft, nearBottom, near), new Vector3(farLeft, farBottom, far)),
            segmentOf(new Vector3(nearLeft, nearTop, near), new Vector3(farLeft, farTop, far)),
            segmentOf(new Vector3(nearRight, nearBottom, near), new Vector3(farRight, farBottom, far)),
            segmentOf(new Vector3(nearRight, nearTop, near), new Vector3(farRight, farTop, far)),
            //
            segmentOf(new Vector3(farLeft, farBottom, far), new Vector3(farRight, farBottom, far)),
            segmentOf(new Vector3(farLeft, farBottom, far), new Vector3(farLeft, farTop, far)),
            segmentOf(new Vector3(farLeft, farTop, far), new Vector3(farRight, farTop, far)),
            segmentOf(new Vector3(farRight, farBottom, far), new Vector3(farRight, farTop, far)),
        ];

        // 整体替换 segments / points（纯数据数组，替代旧 length=0 + addSegment 命令式修改）
        if (this.#pointGeometry) reactive(this.#pointGeometry).points = points;
        if (this.#segmentGeometry) reactive(this.#segmentGeometry).segments = segments;
    }
}

// 注册到分发表
registerLogic('CameraIcon', CameraIconLogic as unknown as new (data: CameraIcon) => CameraIconLogic);
