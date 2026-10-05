import { effect, logic as getLogic, mat4TransformPoint3, reactive, shortcut, ticker, vec3Dot, Vector3, Vector3Like } from 'feng3d';
import type { Billboard, Camera, Color4, MeshRenderer, Object3D, PlaneGeometry, PointGeometry, PointInfo, PointMaterial, PointLight, Segment, SegmentGeometry, SegmentMaterial, TextureMaterial } from 'feng3d';
import { createLogicProto } from '@feng3d/reactivity';
import { useEditorStore } from '../vue-app/stores/editorStore';
import { editorScriptLogicProto, setupEditorScriptLogicState } from './EditorScript';
import type { EditorScript, EditorScriptLogic, EditorScriptLogicState } from './EditorScript';
import { ALPHA_BLEND, appendChildren, cameraObject3D, setWorldMatrix } from './iconUtils';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        PointLightIcon: PointLightIcon;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PointLightIcon: PointLightIconLogic;
    }
}

/**
 * 点光源图标（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class PointLightIcon extends EditorScript`。
 * 图标由三部分组成（均为纯数据子对象）：
 * - billboard 贴图（light.png，颜色跟随灯光）
 * - 三个正交圆环线段（背面半透明，按相机方位实时计算）
 * - 六个轴向点（红/绿/蓝，同样按相机方位计算透明度）
 */
export interface PointLightIcon extends EditorScript
{
    /** 组件类型名 */
    readonly __type__: 'PointLightIcon';
    /** 被跟随的点光源组件 */
    readonly light?: PointLight;
    /** 编辑器相机 */
    readonly editorCamera?: Camera;
}

/**
 * PointLightIcon 逻辑接口。
 */
export interface PointLightIconLogic extends EditorScriptLogic
{
    /**
     * 选中被跟随的灯光对象。
     *
     * 旧写法在 `init()` 中注册 `this.on('mousedown', ...)`；主仓已移除纯数据
     * Object3D 的字符串事件，本方法保留为点击选择入口待接线（TODO）。
     */
    selectLight(): void;
}

/** PointLightIconLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface PointLightIconLogicState extends EditorScriptLogicState
{
    /** 组件数据（raw） */
    _data: PointLightIcon;

    /** 图标根对象（懒创建） */
    _lightIcon: Object3D | null;
    /** 圆环线段对象（懒创建） */
    _lightLines: Object3D | null;
    /** 轴向点对象（懒创建） */
    _lightpoints: Object3D | null;
    /** 图标贴图材质（用于按灯光颜色更新 u_color） */
    _textureMaterial: TextureMaterial | null;
    /** 线段几何体（update 中重算 segments） */
    _segmentGeometry: SegmentGeometry | null;
    /** 点几何体（update 中重算 points） */
    _pointGeometry: PointGeometry | null;
}

/** PointLightIconLogic 的共享原型：继承 EditorScript 基类实现，覆写 init / update / dispose */
const pointLightIconLogicProto = createLogicProto<PointLightIconLogic>(editorScriptLogicProto, {
    init: {
        value: function (this: PointLightIconLogic & PointLightIconLogicState, object3D?: Object3D): void
        {
            editorScriptLogicProto.init.call(this, object3D);

            effect(() =>
            {
                reactive(this._data).editorCamera; // 建立依赖

                if (this._data.editorCamera) initIcon(this);
            });

            effect(() =>
            {
                const r_data = reactive(this._data);
                r_data.light; // 建立依赖

                const light = this._data.light;
                if (!light) return;

                const lightObject3D = getLogic(light).entity;
                const host = this.entity;
                if (!lightObject3D || !host) return;

                setWorldMatrix(host, getLogic(lightObject3D).local2world);
            });
        },
    },
    update: {
        value: function (this: PointLightIconLogic & PointLightIconLogicState): void
        {
            const light = this._data.light;
            const editorCamera = this._data.editorCamera;
            const host = this.entity;
            if (!light || !editorCamera || !host) return;

            const lines = this._lightLines;
            const points = this._lightpoints;
            if (!lines || !points) return;

            const material = this._textureMaterial;
            if (material)
            {
                const color = light.color!;
                reactive(material.uniforms).u_color = {
                    __type__: 'Color4',
                    r: color.r ?? 1, g: color.g ?? 1, b: color.b ?? 1, a: 1,
                };
            }

            // 圆环与轴点随 range 缩放（替代旧 reactive(this._lightLines.transform.scale) 子字段赋值）
            const range = light.range;
            reactive(lines).scale = { x: range, y: range, z: range };
            reactive(points).scale = { x: range, y: range, z: range };

            const lightObject3D = getLogic(light).entity;
            if (!lightObject3D || useEditorStore().selectedObject3Ds.indexOf(lightObject3D) === -1)
            {
                reactive(lines).activeSelf = false;
                reactive(points).activeSelf = false;

                return;
            }

            // 相机在图标本地空间的位置（用于判断线段/轴点处于正面还是背面）
            const editorCameraObject3D = cameraObject3D(editorCamera);
            if (!editorCameraObject3D) return;
            // 缺省 out 是纯字面量（没有 Vector3 的方法），而 `ringAlpha` 收 `Vector3`（阶段 C-e 不改它的签名）
            const camerapos = { x: 0, y: 0, z: 0 };
            mat4TransformPoint3(getLogic(host).world2local, getLogic(editorCameraObject3D).worldPosition, camerapos);

            const segments: Segment[] = [];
            const pointInfos: PointInfo[] = [];
            let alpha = 1;
            const backalpha = 0.5;
            const num = 36;
            for (let i = 0; i < num; i++)
            {
                const angle = i * Math.PI * 2 / num;
                const x = Math.sin(angle);
                const y = Math.cos(angle);
                const angle1 = (i + 1) * Math.PI * 2 / num;
                const x1 = Math.sin(angle1);
                const y1 = Math.cos(angle1);
                // 三个正交平面上的圆环（背面线段半透明）
                alpha = ringAlpha({ x: 0, y: x, z: y }, { x: 0, y: x1, z: y1 }, camerapos, backalpha);
                segments.push({
                    start: { x: 0, y: x, z: y }, end: { x: 0, y: x1, z: y1 },
                    startColor: { __type__: 'Color4', r: 1, g: 0, b: 0, a: alpha }, endColor: { __type__: 'Color4', r: 1, g: 0, b: 0, a: alpha },
                });
                alpha = ringAlpha({ x: x, y: 0, z: y }, { x: x1, y: 0, z: y1 }, camerapos, backalpha);
                segments.push({
                    start: { x: x, y: 0, z: y }, end: { x: x1, y: 0, z: y1 },
                    startColor: { __type__: 'Color4', r: 0, g: 1, b: 0, a: alpha }, endColor: { __type__: 'Color4', r: 0, g: 1, b: 0, a: alpha },
                });
                alpha = ringAlpha({ x: x, y: y, z: 0 }, { x: x1, y: y1, z: 0 }, camerapos, backalpha);
                segments.push({
                    start: { x: x, y: y, z: 0 }, end: { x: x1, y: y1, z: 0 },
                    startColor: { __type__: 'Color4', r: 0, g: 0, b: 1, a: alpha }, endColor: { __type__: 'Color4', r: 0, g: 0, b: 1, a: alpha },
                });
            }

            // 六个轴向点（正/负轴点同色）
            const axisInfos: { position: Vector3Like; color: Color4 }[] = [
                { position: { x: 1, y: 0, z: 0 }, color: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 } },
                { position: { x: -1, y: 0, z: 0 }, color: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 } },
                { position: { x: 0, y: 1, z: 0 }, color: { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 } },
                { position: { x: 0, y: -1, z: 0 }, color: { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 } },
                { position: { x: 0, y: 0, z: 1 }, color: { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 } },
                { position: { x: 0, y: 0, z: -1 }, color: { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 } },
            ];
            for (const axisInfo of axisInfos)
            {
                const axisAlpha = vec3Dot(axisInfo.position, camerapos) < 0 ? backalpha : 1;
                pointInfos.push({
                    position: axisInfo.position,
                    color: { __type__: 'Color4', r: axisInfo.color.r, g: axisInfo.color.g, b: axisInfo.color.b, a: axisAlpha },
                });
            }

            if (this._segmentGeometry) reactive(this._segmentGeometry).segments = segments;
            if (this._pointGeometry) reactive(this._pointGeometry).points = pointInfos;

            reactive(lines).activeSelf = true;
            reactive(points).activeSelf = true;
        },
    },
    selectLight: {
        value: function (this: PointLightIconLogic & PointLightIconLogicState): void
        {
            const light = this._data.light;
            if (!light) return;

            const lightObject3D = getLogic(light).entity;
            if (!lightObject3D) return;

            useEditorStore().selectObject(lightObject3D);
            // 防止再次调用鼠标拾取
            shortcut.activityState('selectInvalid');
            ticker.once(100, () =>
            {
                shortcut.deactivityState('selectInvalid');
            });
        },
    },
    dispose: {
        value: function (this: PointLightIconLogic & PointLightIconLogicState): void
        {
            const icon = this._lightIcon;
            const lines = this._lightLines;
            const points = this._lightpoints;
            this._lightIcon = null;
            this._lightLines = null;
            this._lightpoints = null;
            this._textureMaterial = null;
            this._segmentGeometry = null;
            this._pointGeometry = null;

            if (icon) getLogic(icon).dispose();
            if (lines) getLogic(lines).dispose();
            if (points) getLogic(points).dispose();

            editorScriptLogicProto.dispose.call(this);
        },
    },
});

/**
 * 工厂函数：PointLightIconLogic 的唯一创建入口。
 *
 * @param data 点光源图标数据（raw）
 */
export function pointLightIconLogic(data: PointLightIcon): PointLightIconLogic
{
    const logic = setupEditorScriptLogicState(Object.create(pointLightIconLogicProto) as PointLightIconLogic & PointLightIconLogicState, data);

    // 原构造体内的字段初始化
    logic._lightIcon = null;
    logic._lightLines = null;
    logic._lightpoints = null;
    logic._textureMaterial = null;
    logic._segmentGeometry = null;
    logic._pointGeometry = null;

    return logic;
}

/**
 * 构建图标子对象（幂等）。
 *
 * `hideFlags = HideFlags.Hide` 无替代（主仓 Object3D 无该字段）。
 *
 * 原 `PointLightIconLogic.#initIcon`：工厂范式下改为模块级函数并显式接收实例。
 */
function initIcon(logic: PointLightIconLogic & PointLightIconLogicState): void
{
    if (logic._lightIcon) return;

    const host = logic.entity;
    const editorCamera = logic._data.editorCamera;
    if (!host || !editorCamera) return;

    const textureMaterial: TextureMaterial = {
        __type__: 'TextureMaterial',
        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
        s_texture: { __type__: 'Texture', url: useEditorStore().getEditorAssetPath('assets/3d/icons/light.png') },
        blend: ALPHA_BLEND,
    };
    const iconObject3D: Object3D = {
        __type__: 'Object3D',
        name: 'PointLightIcon',
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

    // 用 `appendChildren`：本方法在组件 init 内同步执行，此时宿主 children 可能尚未
    // 被 ContainerLogic pre-fill（详见 iconUtils.appendChildren 注释）。
    appendChildren(host, iconObject3D, linesObject3D, pointsObject3D);

    logic._lightIcon = iconObject3D;
    logic._lightLines = linesObject3D;
    logic._lightpoints = pointsObject3D;
    logic._textureMaterial = textureMaterial;
    logic._segmentGeometry = segmentGeometry;
    logic._pointGeometry = pointGeometry;
}

/**
 * 计算线段透明度：两端点均在相机背面时使用背面透明度，否则完全不透明。
 */
function ringAlpha(start: Vector3Like, end: Vector3Like, camerapos: Vector3Like, backalpha: number): number
{
    return (vec3Dot(start, camerapos) < 0 || vec3Dot(end, camerapos) < 0) ? backalpha : 1;
}
