import { Vector3, logic as getLogic, reactive, effect, shortcut, ticker } from 'feng3d';
import type { Billboard, Camera, Color4, DirectionalLight, HoldSize, MeshRenderer, Object3D, PlaneGeometry, Segment, SegmentGeometry, SegmentMaterial, TextureMaterial } from 'feng3d';
import { EditorData } from '../global/EditorData';
import { EditorScript, EditorScriptLogic } from './EditorScript';
import { ALPHA_BLEND, appendChildren, setWorldMatrix } from './iconUtils';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        DirectionLightIcon: DirectionLightIcon;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        DirectionLightIcon: DirectionLightIconLogic;
    }
}

/**
 * 方向光图标（纯数据接口）。
 *
 * 在方向光所属 Object3D 上挂载本组件后，组件 logic 会为宿主构建图标子对象
 * （billboard 贴图 + 线段指示器），并让宿主跟随被跟随灯光的世界变换。
 *
 * 迁移自旧写法 `@RegisterComponent() class DirectionLightIcon extends EditorScript`：
 * - 旧范式用 class 继承 + `watcher.watch` + 字符串事件（`'scenetransformChanged'`）
 * - 新范式用「纯数据接口 + Logic 类」+ `effect()` 响应式
 */
export interface DirectionLightIcon extends EditorScript
{
    /** 组件类型名 */
    readonly __type__: 'DirectionLightIcon';
    /** 被跟随的方向光组件（缺失时不显示图标） */
    readonly light?: DirectionalLight;
    /** 编辑器相机（缺失时不构建图标） */
    readonly editorCamera?: Camera;
}

/**
 * DirectionLightIcon 逻辑类。
 *
 * 图标子对象在 `editorCamera` 就绪后懒构建（一次），构建时把纯数据字面量
 * push 进宿主的 children（经响应式代理写入，父级关系与组件初始化由主仓
 * ContainerLogic / EntityLogic 的 effect 自动维护）。
 */
export class DirectionLightIconLogic extends EditorScriptLogic
{
    /** 组件数据（raw） */
    #data: DirectionLightIcon;

    /** 图标根对象（懒创建） */
    #lightIcon: Object3D | null = null;
    /** 指示线对象（懒创建） */
    #lightLines: Object3D | null = null;
    /** 图标贴图材质（用于按灯光颜色更新 u_color） */
    #textureMaterial: TextureMaterial | null = null;

    protected constructor(data: DirectionLightIcon)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: DirectionLightIcon): DirectionLightIconLogic
    {
        return new DirectionLightIconLogic(data);
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

        // @边界 effect：跟随灯光世界变换
        // （替代旧 watcher.watch(this, 'light', ...) + 'scenetransformChanged' 字符串事件）
        effect(() =>
        {
            const r_data = reactive(this.#data);
            r_data.light; // 建立对 light 字段的依赖

            const light = this.#data.light; // 原始值
            if (!light) return;

            const lightObject3D = getLogic(light).entity;
            const host = this.entity;
            if (!lightObject3D || !host) return;

            // 读取灯光世界矩阵（Computed）建立依赖：灯光变换变化 → 本 effect 重跑
            setWorldMatrix(host, getLogic(lightObject3D).local2world);
        });
    }

    override update(): void
    {
        const light = this.#data.light;
        if (!light) return;

        // 图标颜色跟随灯光颜色（Color3 纯数据 → Color4 字面量）
        const material = this.#textureMaterial;
        if (material)
        {
            const color = light.color;
            reactive(material.uniforms).u_color = {
                __type__: 'Color4',
                r: color.r ?? 1, g: color.g ?? 1, b: color.b ?? 1, a: 1,
            };
        }

        const lines = this.#lightLines;
        const lightObject3D = getLogic(light).entity;
        if (lines && lightObject3D)
        {
            reactive(lines).activeSelf = EditorData.editorData.selectedObject3Ds.indexOf(lightObject3D) !== -1;
        }
    }

    /**
     * 选中被跟随的灯光对象。
     *
     * 旧写法在 `init()` 中注册 `this.on('mousedown', this.onMousedown, this)`；
     * 主仓已移除纯数据 Object3D 的字符串事件（`Mouse3DManager` 中 per-object
     * `emit` 被注释、改为 `pickClick` 回调），故本方法保留为点击选择入口，
     * 待 scene 侧 `Mouse3DManager.pickClick` 接线后调用（TODO）。
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
        this.#lightIcon = null;
        this.#lightLines = null;
        this.#textureMaterial = null;

        if (icon) getLogic(icon).dispose();
        if (lines) getLogic(lines).dispose();

        // 基类 dispose 写入 enabled = false
        super.dispose();
    }

    /**
     * 构建图标子对象（幂等，仅在 editorCamera 就绪后执行一次）。
     *
     * 全部为纯数据字面量（`__type__` 声明式），不再使用 `new Object3D()` /
     * `addComponent()` / `addChild()` 命令式 API：
     * - 图标：Billboard（始终面向相机）+ MeshRenderer（PlaneGeometry + TextureMaterial）
     * - 指示线：HoldSize（屏幕尺寸恒定）+ MeshRenderer（SegmentGeometry + SegmentMaterial）
     *
     * 旧写法设置的 `hideFlags = HideFlags.Hide` 无替代：主仓 `Object3D` 数据接口
     * 已无 `hideFlags` 字段（`HideFlags` 枚举仍导出但无消费方）。
     */
    #initIcon(): void
    {
        if (this.#lightIcon) return;

        const host = this.entity;
        const editorCamera = this.#data.editorCamera;
        if (!host || !editorCamera) return;

        const linesize = 20;

        // 指示线：10 条放射线 + 36 条圆周线
        const white: Color4 = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };
        const segments: Segment[] = [];
        let num = 10;
        for (let i = 0; i < num; i++)
        {
            const angle = i * Math.PI * 2 / num;
            const x = Math.sin(angle) * linesize;
            const y = Math.cos(angle) * linesize;
            segments.push({ start: new Vector3(x, y, 0), end: new Vector3(x, y, linesize * 5), startColor: white, endColor: white });
        }
        num = 36;
        for (let i = 0; i < num; i++)
        {
            const angle = i * Math.PI * 2 / num;
            const x = Math.sin(angle) * linesize;
            const y = Math.cos(angle) * linesize;
            const angle1 = (i + 1) * Math.PI * 2 / num;
            const x1 = Math.sin(angle1) * linesize;
            const y1 = Math.cos(angle1) * linesize;
            segments.push({ start: new Vector3(x, y, 0), end: new Vector3(x1, y1, 0), startColor: white, endColor: white });
        }

        const textureMaterial: TextureMaterial = {
            __type__: 'TextureMaterial',
            uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
            s_texture: { __type__: 'Texture', url: EditorData.editorData.getEditorAssetPath('assets/3d/icons/sun.png') },
            blend: ALPHA_BLEND,
        };
        const iconObject3D: Object3D = {
            __type__: 'Object3D',
            name: 'DirectionLightIcon',
            components: [
                { __type__: 'Billboard' },
                {
                    __type__: 'MeshRenderer',
                    material: textureMaterial,
                    geometry: { __type__: 'PlaneGeometry', width: 1, height: 1, segmentsH: 1, segmentsW: 1, yUp: false },
                },
            ],
        };

        const linesObject3D: Object3D = {
            __type__: 'Object3D',
            name: 'Lines',
            mouseEnabled: false,
            components: [
                { __type__: 'HoldSize', holdSize: 0.005 },
                {
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments },
                    material: {
                        __type__: 'SegmentMaterial',
                        uniforms: { u_segmentColor: { __type__: 'Color4', r: 163 / 255, g: 162 / 255, b: 107 / 255, a: 1 } },
                    },
                },
            ],
        };

        // 经响应式代理写入宿主 children（父级关系 / 组件 init 由主仓 effect 自动维护）。
        // 用 `appendChildren` 而非直接 push：本方法在组件 init 内**同步**执行，此时宿主的
        // children 可能尚未被 ContainerLogic pre-fill（详见 iconUtils.appendChildren 注释）。
        appendChildren(host, iconObject3D, linesObject3D);

        this.#lightIcon = iconObject3D;
        this.#lightLines = linesObject3D;
        this.#textureMaterial = textureMaterial;
    }
}
