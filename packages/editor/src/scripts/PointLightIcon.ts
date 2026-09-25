import { Vector3, logic as getLogic, reactive, effect, shortcut, ticker } from 'feng3d';
import type { Billboard, Camera, Color4, MeshRenderer, Object3D, PlaneGeometry, PointGeometry, PointInfo, PointMaterial, PointLight, Segment, SegmentGeometry, SegmentMaterial, TextureMaterial } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
import { EditorData } from '../global/EditorData';
import { EditorScript, EditorScriptLogic } from './EditorScript';
import { ALPHA_BLEND, cameraObject3D, setWorldMatrix } from './iconUtils';

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
 * PointLightIcon 逻辑类。
 */
export class PointLightIconLogic extends EditorScriptLogic
{
    /** 组件数据（raw） */
    #data: PointLightIcon;

    /** 图标根对象（懒创建） */
    #lightIcon: Object3D | null = null;
    /** 圆环线段对象（懒创建） */
    #lightLines: Object3D | null = null;
    /** 轴向点对象（懒创建） */
    #lightpoints: Object3D | null = null;
    /** 图标贴图材质（用于按灯光颜色更新 u_color） */
    #textureMaterial: TextureMaterial | null = null;
    /** 线段几何体（update 中重算 segments） */
    #segmentGeometry: SegmentGeometry | null = null;
    /** 点几何体（update 中重算 points） */
    #pointGeometry: PointGeometry | null = null;

    protected constructor(data: PointLightIcon)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: PointLightIcon): PointLightIconLogic
    {
        return new PointLightIconLogic(data);
    }

    override init(object3D?: Object3D): void
    {
        super.init(object3D);

        effect(() =>
        {
            reactive(this.#data).editorCamera; // 建立依赖

            if (this.#data.editorCamera) this.#initIcon();
        });

        effect(() =>
        {
            const r_data = reactive(this.#data);
            r_data.light; // 建立依赖

            const light = this.#data.light;
            if (!light) return;

            const lightObject3D = getLogic(light).entity;
            const host = this.entity;
            if (!lightObject3D || !host) return;

            setWorldMatrix(host, getLogic(lightObject3D).local2world);
        });
    }

    override update(): void
    {
        const light = this.#data.light;
        const editorCamera = this.#data.editorCamera;
        const host = this.entity;
        if (!light || !editorCamera || !host) return;

        const lines = this.#lightLines;
        const points = this.#lightpoints;
        if (!lines || !points) return;

        const material = this.#textureMaterial;
        if (material)
        {
            const color = light.color;
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
        if (!lightObject3D || EditorData.editorData.selectedObject3Ds.indexOf(lightObject3D) === -1)
        {
            reactive(lines).activeSelf = false;
            reactive(points).activeSelf = false;

            return;
        }

        // 相机在图标本地空间的位置（用于判断线段/轴点处于正面还是背面）
        const editorCameraObject3D = cameraObject3D(editorCamera);
        if (!editorCameraObject3D) return;
        const camerapos = getLogic(host).world2local.transformPoint3(getLogic(editorCameraObject3D).worldPosition);

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
            alpha = ringAlpha(new Vector3(0, x, y), new Vector3(0, x1, y1), camerapos, backalpha);
            segments.push({
                start: new Vector3(0, x, y), end: new Vector3(0, x1, y1),
                startColor: { __type__: 'Color4', r: 1, g: 0, b: 0, a: alpha }, endColor: { __type__: 'Color4', r: 1, g: 0, b: 0, a: alpha },
            });
            alpha = ringAlpha(new Vector3(x, 0, y), new Vector3(x1, 0, y1), camerapos, backalpha);
            segments.push({
                start: new Vector3(x, 0, y), end: new Vector3(x1, 0, y1),
                startColor: { __type__: 'Color4', r: 0, g: 1, b: 0, a: alpha }, endColor: { __type__: 'Color4', r: 0, g: 1, b: 0, a: alpha },
            });
            alpha = ringAlpha(new Vector3(x, y, 0), new Vector3(x1, y1, 0), camerapos, backalpha);
            segments.push({
                start: new Vector3(x, y, 0), end: new Vector3(x1, y1, 0),
                startColor: { __type__: 'Color4', r: 0, g: 0, b: 1, a: alpha }, endColor: { __type__: 'Color4', r: 0, g: 0, b: 1, a: alpha },
            });
        }

        // 六个轴向点（正/负轴点同色）
        const axisInfos: { position: Vector3; color: Color4 }[] = [
            { position: new Vector3(1, 0, 0), color: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 } },
            { position: new Vector3(-1, 0, 0), color: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 } },
            { position: new Vector3(0, 1, 0), color: { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 } },
            { position: new Vector3(0, -1, 0), color: { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 } },
            { position: new Vector3(0, 0, 1), color: { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 } },
            { position: new Vector3(0, 0, -1), color: { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 } },
        ];
        for (const axisInfo of axisInfos)
        {
            const axisAlpha = axisInfo.position.dot(camerapos) < 0 ? backalpha : 1;
            pointInfos.push({
                position: axisInfo.position,
                color: { __type__: 'Color4', r: axisInfo.color.r, g: axisInfo.color.g, b: axisInfo.color.b, a: axisAlpha },
            });
        }

        if (this.#segmentGeometry) reactive(this.#segmentGeometry).segments = segments;
        if (this.#pointGeometry) reactive(this.#pointGeometry).points = pointInfos;

        reactive(lines).activeSelf = true;
        reactive(points).activeSelf = true;
    }

    /**
     * 选中被跟随的灯光对象。
     *
     * 旧写法在 `init()` 中注册 `this.on('mousedown', ...)`；主仓已移除纯数据
     * Object3D 的字符串事件，本方法保留为点击选择入口待接线（TODO）。
     */
    selectLight(): void
    {
        const light = this.#data.light;
        if (!light) return;

        const lightObject3D = getLogic(light).entity;
        if (!lightObject3D) return;

        EditorData.editorData.selectObject(lightObject3D);
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
        this.#textureMaterial = null;
        this.#segmentGeometry = null;
        this.#pointGeometry = null;

        if (icon) getLogic(icon).dispose();
        if (lines) getLogic(lines).dispose();
        if (points) getLogic(points).dispose();

        super.dispose();
    }

    /**
     * 构建图标子对象（幂等）。
     *
     * `hideFlags = HideFlags.Hide` 无替代（主仓 Object3D 无该字段）。
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
            s_texture: { __type__: 'Texture', url: EditorData.editorData.getEditorAssetPath('assets/3d/icons/light.png') },
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

        const r_children = reactive(host).children as unknown as Object3D[];
        r_children.push(iconObject3D, linesObject3D, pointsObject3D);

        this.#lightIcon = iconObject3D;
        this.#lightLines = linesObject3D;
        this.#lightpoints = pointsObject3D;
        this.#textureMaterial = textureMaterial;
        this.#segmentGeometry = segmentGeometry;
        this.#pointGeometry = pointGeometry;
    }
}

/**
 * 计算线段透明度：两端点均在相机背面时使用背面透明度，否则完全不透明。
 */
function ringAlpha(start: Vector3, end: Vector3, camerapos: Vector3, backalpha: number): number
{
    return (start.dot(camerapos) < 0 || end.dot(camerapos) < 0) ? backalpha : 1;
}

// 注册到分发表
registerLogic('PointLightIcon', PointLightIconLogic as unknown as new (data: PointLightIcon) => PointLightIconLogic);
