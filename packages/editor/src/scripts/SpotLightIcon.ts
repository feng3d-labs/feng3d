import {
    Billboard, Camera, Color4, MeshRenderer, Object3D, PlaneGeometry, PointGeometry, PointInfo,
    PointMaterial, Segment, SegmentGeometry, SegmentMaterial, SpotLight, TextureMaterial, Vector3, mathUtil,
    logic as getLogic, reactive, effect, shortcut, ticker,
} from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
import { EditorData } from '../global/EditorData';
import { EditorScript, EditorScriptLogic } from './EditorScript';
import { ALPHA_BLEND, setWorldMatrix } from './iconUtils';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        SpotLightIcon: SpotLightIcon;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SpotLightIcon: SpotLightIconLogic;
    }
}

/**
 * 聚光灯图标（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class SpotLightIcon extends EditorScript`：
 * 图标 = billboard 贴图（spot.png，颜色跟随灯光）+ 锥体线段 + 锥底轴向点。
 */
export interface SpotLightIcon extends EditorScript
{
    /** 组件类型名 */
    readonly __type__: 'SpotLightIcon';
    /** 被跟随的聚光灯组件 */
    readonly light?: SpotLight;
    /** 编辑器相机 */
    readonly editorCamera?: Camera;
}

/**
 * SpotLightIcon 逻辑类。
 */
export class SpotLightIconLogic extends EditorScriptLogic
{
    /** 组件数据（raw） */
    #data: SpotLightIcon;

    /** 图标根对象（懒创建） */
    #lightIcon: Object3D | null = null;
    /** 锥体线段对象（懒创建） */
    #lightLines: Object3D | null = null;
    /** 锥底轴向点对象（懒创建） */
    #lightpoints: Object3D | null = null;
    /** 图标贴图材质（用于按灯光颜色更新 u_color） */
    #textureMaterial: TextureMaterial | null = null;
    /** 线段几何体（update 中重算 segments） */
    #segmentGeometry: SegmentGeometry | null = null;
    /** 点几何体（update 中重算 points） */
    #pointGeometry: PointGeometry | null = null;

    protected constructor(data: SpotLightIcon)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: SpotLightIcon): SpotLightIconLogic
    {
        return new SpotLightIconLogic(data);
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
        if (!light) return;

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

        const lightObject3D = getLogic(light).entity;
        if (!lightObject3D || EditorData.editorData.selectedObject3Ds.indexOf(lightObject3D) === -1)
        {
            reactive(lines).activeSelf = false;
            reactive(points).activeSelf = false;

            return;
        }

        // 锥体：range 处的圆环（半径由半角与 range 决定）+ 4 条母线
        const yellow: Color4 = { __type__: 'Color4', r: 1, g: 1, b: 0, a: 1 };
        const segments: Segment[] = [];
        const pointInfos: PointInfo[] = [];
        const num = 36;
        const radius = light.range * Math.tan(light.angle * mathUtil.DEG2RAD * 0.5);
        const distance = light.range;
        for (let i = 0; i < num; i++)
        {
            const angle = i * Math.PI * 2 / num;
            const x = Math.sin(angle);
            const y = Math.cos(angle);
            const angle1 = (i + 1) * Math.PI * 2 / num;
            const x1 = Math.sin(angle1);
            const y1 = Math.cos(angle1);
            segments.push({
                start: new Vector3(x * radius, y * radius, distance), end: new Vector3(x1 * radius, y1 * radius, distance),
                startColor: yellow, endColor: yellow,
            });
        }

        // 锥底四个轴向点与从原点到它们的母线
        const origin = new Vector3();
        const axisPoints: Vector3[] = [
            new Vector3(0, -radius, distance),
            new Vector3(-radius, 0, distance),
            new Vector3(0, radius, distance),
            new Vector3(radius, 0, distance),
        ];
        for (const axisPoint of axisPoints)
        {
            pointInfos.push({ position: axisPoint, color: yellow });
            segments.push({ start: origin, end: axisPoint, startColor: yellow, endColor: yellow });
        }
        // 锥尖
        pointInfos.unshift({ position: new Vector3(0, 0, distance), color: yellow });

        if (this.#pointGeometry) reactive(this.#pointGeometry).points = pointInfos;
        if (this.#segmentGeometry) reactive(this.#segmentGeometry).segments = segments;

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
            s_texture: { __type__: 'Texture', url: EditorData.editorData.getEditorAssetPath('assets/3d/icons/spot.png') },
            blend: ALPHA_BLEND,
        };
        const iconObject3D: Object3D = {
            __type__: 'Object3D',
            name: 'SpotLightIcon',
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

// 注册到分发表
registerLogic('SpotLightIcon', SpotLightIconLogic as unknown as new (data: SpotLightIcon) => SpotLightIconLogic);
