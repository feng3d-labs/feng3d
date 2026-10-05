import { effect, logic as getLogic, reactive, shortcut, ticker, Vector3, Vector3Like } from 'feng3d';
import type { Billboard, Camera, Color4, MeshRenderer, Object3D, OrthographicCamera, PerspectiveCamera, PlaneGeometry, PointGeometry, PointInfo, PointMaterial, Segment, SegmentGeometry, SegmentMaterial, TextureMaterial } from 'feng3d';
import { useEditorStore } from '../vue-app/stores/editorStore';
import { createEditorScriptLogicBase } from './EditorScript';
import type { EditorScript, EditorScriptLogic } from './EditorScript';
import { ALPHA_BLEND, appendChildren, cameraObject3D, setWorldMatrix } from './iconUtils';

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
 * CameraIcon 逻辑接口。
 */
export interface CameraIconLogic extends EditorScriptLogic
{
    /**
     * 选中被跟随的相机对象。
     *
     * 旧写法在 `init()` 中注册 `this.on('mousedown', ...)`；主仓已移除纯数据
     * Object3D 的字符串事件，本方法保留为点击选择入口待接线（TODO）。
     */
    selectCamera(): void;
}

/**
 * 工厂函数：CameraIconLogic 的唯一创建入口。
 *
 * @param data 相机图标数据（raw）
 */
export function cameraIconLogic(data: CameraIcon): CameraIconLogic
{
    const { members } = createEditorScriptLogicBase(data);

    // 自身状态：全部为工厂闭包变量（原挂在实例上的 _xxx 字段）

    /** 图标根对象（懒创建） */
    let lightIcon: Object3D | null = null;
    /** 视锥线框对象（懒创建） */
    let lightLines: Object3D | null = null;
    /** 视锥远平面点对象（懒创建） */
    let lightpoints: Object3D | null = null;
    /** 线段几何体（视锥参数变化时重算 segments） */
    let segmentGeometry: SegmentGeometry | null = null;
    /** 点几何体（视锥参数变化时重算 points） */
    let pointGeometry: PointGeometry | null = null;
    /** 视锥参数是否变化（由响应式 effect 置脏，替代旧 `'lensChanged'` 字符串事件） */
    let lensChanged = true;

    /**
     * 构建图标子对象（幂等）。
     *
     * `hideFlags = HideFlags.Hide` 无替代（主仓 `Object3D` 无该字段）；
     * 深度写入策略已可用——`TextureMaterial` 现在暴露 `depthWrite` 数据字段，
     * 需要时用 `setDepthWrite(material, false)` 即可（见 issue #157）。
     *
     * 原 `CameraIconLogic.#initIcon`：工厂闭包形态下作为工厂内函数，直接读写闭包状态。
     */
    function initIcon(): void
    {
        if (lightIcon) return;

        const host = members.entity;
        const editorCamera = data.editorCamera;
        if (!host || !editorCamera) return;

        const textureMaterial: TextureMaterial = {
            __type__: 'TextureMaterial',
            uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
            s_texture: { __type__: 'Texture', url: useEditorStore().getEditorAssetPath('assets/3d/icons/camera.png') },
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

        const linesGeometry: SegmentGeometry = { __type__: 'SegmentGeometry', segments: [] };
        const linesObject3D: Object3D = {
            __type__: 'Object3D',
            name: 'Lines',
            mouseEnabled: false,
            components: [
                {
                    __type__: 'MeshRenderer',
                    geometry: linesGeometry,
                    material: {
                        __type__: 'SegmentMaterial',
                        uniforms: { u_segmentColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 0.5 } },
                    },
                },
            ],
        };

        const pointsGeometry: PointGeometry = { __type__: 'PointGeometry', points: [] };
        const pointsObject3D: Object3D = {
            __type__: 'Object3D',
            name: 'points',
            mouseEnabled: false,
            components: [
                {
                    __type__: 'MeshRenderer',
                    geometry: pointsGeometry,
                    material: {
                        __type__: 'PointMaterial',
                        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 1 },
                    },
                },
            ],
        };

        // 用 `appendChildren`：本方法在组件 init 内同步执行，此时宿主 children 可能尚未
        // 被 ContainerLogic pre-fill（详见 iconUtils.appendChildren 注释）。
        appendChildren(host, iconObject3D, linesObject3D, pointsObject3D);

        lightIcon = iconObject3D;
        lightLines = linesObject3D;
        lightpoints = pointsObject3D;
        segmentGeometry = linesGeometry;
        pointGeometry = pointsGeometry;
    }

    /**
     * 按相机投影参数重建视锥线框（近平面矩形 + 4 条侧棱 + 远平面矩形 + 远平面中心十字点）。
     *
     * 透视与正交由 `camera.__type__` 判别（替代已移除的 `instanceof PerspectiveLens /
     * OrthographicLens`）；抽象基类 Camera 无投影参数，直接跳过。
     *
     * 原 `CameraIconLogic.#rebuildFrustum`：工厂闭包形态下作为工厂内函数，直接读写闭包状态。
     */
    function rebuildFrustum(camera: Camera): void
    {
        const white: Color4 = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };
        const segmentOf = (start: Vector3Like, end: Vector3Like): Segment => ({ start, end, startColor: white, endColor: white });

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
            { position: { x: 0, y: farBottom, z: far } },
            { position: { x: 0, y: farTop, z: far } },
            { position: { x: farLeft, y: 0, z: far } },
            { position: { x: farRight, y: 0, z: far } },
        ];
        const segments: Segment[] = [
            segmentOf({ x: nearLeft, y: nearBottom, z: near }, { x: nearRight, y: nearBottom, z: near }),
            segmentOf({ x: nearLeft, y: nearBottom, z: near }, { x: nearLeft, y: nearTop, z: near }),
            segmentOf({ x: nearLeft, y: nearTop, z: near }, { x: nearRight, y: nearTop, z: near }),
            segmentOf({ x: nearRight, y: nearBottom, z: near }, { x: nearRight, y: nearTop, z: near }),
            //
            segmentOf({ x: nearLeft, y: nearBottom, z: near }, { x: farLeft, y: farBottom, z: far }),
            segmentOf({ x: nearLeft, y: nearTop, z: near }, { x: farLeft, y: farTop, z: far }),
            segmentOf({ x: nearRight, y: nearBottom, z: near }, { x: farRight, y: farBottom, z: far }),
            segmentOf({ x: nearRight, y: nearTop, z: near }, { x: farRight, y: farTop, z: far }),
            //
            segmentOf({ x: farLeft, y: farBottom, z: far }, { x: farRight, y: farBottom, z: far }),
            segmentOf({ x: farLeft, y: farBottom, z: far }, { x: farLeft, y: farTop, z: far }),
            segmentOf({ x: farLeft, y: farTop, z: far }, { x: farRight, y: farTop, z: far }),
            segmentOf({ x: farRight, y: farBottom, z: far }, { x: farRight, y: farTop, z: far }),
        ];

        // 整体替换 segments / points（纯数据数组，替代旧 length=0 + addSegment 命令式修改）
        if (pointGeometry) reactive(pointGeometry).points = points;
        if (segmentGeometry) reactive(segmentGeometry).segments = segments;
    }

    const logic: CameraIconLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        init(object3D)
        {
            members.init(object3D);

            // @边界 effect：editorCamera 就绪 → 构建图标（替代旧 setter 内的 initicon() 副作用）
            effect(() =>
            {
                reactive(data).editorCamera; // 建立依赖

                if (data.editorCamera) initIcon();
            });

            // @边界 effect：视锥参数变化 → 置脏
            // 读具体相机的 projectionMatrix（依赖 fov/aspect/near/far 或 left/right/top/bottom）
            // 建立依赖，替代旧 `newValue.on('lensChanged', ...)` 字符串事件。
            effect(() =>
            {
                const r_data = reactive(data);
                r_data.camera; // 建立对 camera 字段的依赖

                const camera = data.camera; // 原始值
                if (camera)
                {
                    const type = (camera as { __type__: string }).__type__;
                    if (type === 'PerspectiveCamera') void getLogic(camera as PerspectiveCamera).projectionMatrix;
                    else if (type === 'OrthographicCamera') void getLogic(camera as OrthographicCamera).projectionMatrix;
                }

                lensChanged = true;
            });

            // @边界 effect：跟随相机世界变换
            // （替代旧 watcher.watch(this, 'camera', ...) + 'scenetransformChanged' 字符串事件）
            effect(() =>
            {
                const r_data = reactive(data);
                r_data.camera; // 建立依赖

                const camera = data.camera;
                if (!camera) return;

                const cameraObject = cameraObject3D(camera);
                const host = members.entity;
                if (!cameraObject || !host) return;

                setWorldMatrix(host, getLogic(cameraObject).local2world);
            });
        },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        update()
        {
            const camera = data.camera;
            const host = members.entity;
            if (!camera || !host) return;

            const lines = lightLines;
            const points = lightpoints;
            if (!lines || !points) return;

            const cameraObject = cameraObject3D(camera);
            if (!cameraObject) return;

            if (useEditorStore().selectedObject3Ds.indexOf(cameraObject) === -1)
            {
                reactive(lines).activeSelf = false;
                reactive(points).activeSelf = false;

                return;
            }

            if (lensChanged)
            {
                rebuildFrustum(camera);
                lensChanged = false;
            }

            reactive(lines).activeSelf = true;
            reactive(points).activeSelf = true;
        },
        selectCamera()
        {
            const camera = data.camera;
            if (!camera) return;

            const cameraObject = cameraObject3D(camera);
            if (!cameraObject) return;

            useEditorStore().selectObject(cameraObject);
            // 防止再次调用鼠标拾取
            shortcut.activityState('selectInvalid');
            ticker.once(100, () =>
            {
                shortcut.deactivityState('selectInvalid');
            });
        },
        get isLoaded() { return members.isLoaded; },
        dispose()
        {
            const icon = lightIcon;
            const lines = lightLines;
            const points = lightpoints;
            lightIcon = null;
            lightLines = null;
            lightpoints = null;
            segmentGeometry = null;
            pointGeometry = null;

            if (icon) getLogic(icon).dispose();
            if (lines) getLogic(lines).dispose();
            if (points) getLogic(points).dispose();

            // 基类 dispose 写入 enabled = false
            members.dispose();
        },
    };

    return logic;
}
