import { ComponentLogicBase, matchType, logic as getLogic, reactive, effect } from 'feng3d';
import type { Camera, Component3D, Components, DirectionalLight, Object3D, PointLight, Scene, SpotLight } from 'feng3d';
import { toRaw } from '@feng3d/reactivity';
import { CameraIcon } from '../scripts/CameraIcon';
import { DirectionLightIcon } from '../scripts/DirectionLightIcon';
import { PointLightIcon } from '../scripts/PointLightIcon';
import { SpotLightIcon } from '../scripts/SpotLightIcon';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        EditorComponent: EditorComponent;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        EditorComponent: EditorComponentLogic;
    }
}

/** 需要被图标跟随的组件类型名（经 `matchType` 判定，含派生类型） */
const ICON_TARGET_TYPES = ['DirectionalLight', 'PointLight', 'SpotLight', 'Camera'];

/** 图标组件的纯数据联合（用于经响应式代理写入 editorCamera / 断开反向引用） */
type IconComponentData = CameraIcon | DirectionLightIcon | PointLightIcon | SpotLightIcon;

/**
 * 编辑器组件（纯数据接口）。
 *
 * 监视场景树，为其中的相机与各类光源创建可视化图标对象（挂在自身宿主之下），
 * 并在被跟随组件从场景中移除时销毁对应图标。
 *
 * 迁移自旧写法 `@RegisterComponent() class EditorComponent extends Component`：
 * - 旧范式由 `scene.on/off('addComponent' | 'removeComponent' | 'addChild' | 'removeChild')`
 *   字符串事件驱动；主仓已移除全局事件系统，改为 `effect()` 响应式遍历（见下方 init）
 * - 旧范式用 `component instanceof DirectionalLight` 判别类型；改为 `matchType`（`__type__` 判定）
 * - 旧范式用 `new Object3D()` + `addComponent()` + `addChild()` 创建图标；改为纯数据字面量
 * - 旧范式用字段级 setter（`set scene` / `set editorCamera`）触发副作用；
 *   新范式是只读数据字段 + `effect` 监听（由 `EditorView` 经响应式代理写入）
 */
export interface EditorComponent extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'EditorComponent';
    /** 被监视的场景（由 EditorView 注入，缺失时不工作） */
    readonly scene?: Scene;
    /** 编辑器相机（由 EditorView 注入，图标据此定位与决定投影） */
    readonly editorCamera?: Camera;
}

/**
 * EditorComponent 逻辑类。
 *
 * 两个 effect 分别负责「场景树结构同步」与「编辑器相机广播」，
 * 替代旧范式的一整套字符串事件与 setter 副作用。
 */
export class EditorComponentLogic extends ComponentLogicBase
{
    /** 组件数据（raw） */
    #data: EditorComponent;

    /** 被跟随组件（raw 对象引用） → 图标宿主对象 */
    readonly #iconMap = new Map<Components, Object3D>();

    protected constructor(data: EditorComponent)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: EditorComponent): EditorComponentLogic
    {
        return new EditorComponentLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // @边界 effect：场景树结构变化 → 同步图标
        //
        // 替代旧 `scene.on/off('addComponent' | 'removeComponent' | 'addChild' | 'removeChild')`。
        // 遍历时经 reactive 代理读取 children / components，组件与子对象的增删均可追踪；
        // 不能用 `ContainerLogic.getComponentsInChildren`——它迭代原始数组、不建立依赖
        //（见主仓 `packages/feng3d/src/scene/Scene.ts` 中 `collectComponentsInChildren` 的说明）。
        effect(() =>
        {
            reactive(this.#data).scene; // 建立对 scene 字段的依赖
            const scene = this.#data.scene; // 原始值

            if (!scene) return;

            const root = getLogic(scene).entity as Object3D | null;
            if (!root) return;

            this.#syncIcons(this.#collectIconTargets(root));
        });

        // @边界 effect：编辑器相机变化 → 广播给全部图标
        // 替代旧 `set editorCamera` 内 `update()` 的遍历赋值。
        effect(() =>
        {
            reactive(this.#data).editorCamera; // 建立对 editorCamera 字段的依赖
            const editorCamera = this.#data.editorCamera; // 原始值

            for (const iconObject3D of this.#iconMap.values())
            {
                const iconData = iconObject3D.components?.[0] as IconComponentData | undefined;
                if (iconData) reactive(iconData).editorCamera = editorCamera;
            }
        });
    }

    override dispose(): void
    {
        // 销毁全部图标：`Object3DLogic.dispose` 会从父级 children 中移除自身，
        // 并递归释放图标对象上的组件（等价旧写法逐个 `object3D.remove()`）。
        for (const iconObject3D of this.#iconMap.values())
        {
            getLogic(iconObject3D).dispose();
        }
        this.#iconMap.clear();

        super.dispose();
    }

    /**
     * 响应式遍历场景树，收集需要图标的组件。
     *
     * 读取 `reactive(object3D).components` / `.children` 以建立响应式依赖，
     * 使场景树的增删能触发调用方 effect 重跑（这是与 `getComponentsInChildren` 的关键区别）。
     *
     * @param root 场景根对象
     */
    #collectIconTargets(root: Object3D): Components[]
    {
        const results: Components[] = [];
        const stack: Object3D[] = [root];

        while (stack.length > 0)
        {
            const object3D = stack.pop()!;
            const r_object3D = reactive(object3D);

            for (const component of r_object3D.components ?? [])
            {
                if (ICON_TARGET_TYPES.some((typeName) => matchType(component, typeName)))
                {
                    // 收集 raw 对象作为 Map 键，保证与后续遍历取到的键一致
                    results.push(toRaw(component) as Components);
                }
            }

            for (const child of r_object3D.children ?? [])
            {
                stack.push(toRaw(child) as Object3D);
            }
        }

        return results;
    }

    /** 按目标集合同步图标：已消失的销毁、新出现的创建 */
    #syncIcons(targets: Components[]): void
    {
        const host = this.entity as Object3D | null;
        if (!host) return;

        for (const target of Array.from(this.#iconMap.keys()))
        {
            if (targets.indexOf(target) === -1) this.#removeIcon(target);
        }

        for (const target of targets)
        {
            if (!this.#iconMap.has(target)) this.#addIcon(target, host);
        }
    }

    /**
     * 创建被跟随组件的图标对象。
     *
     * 纯数据字面量（`__type__` 声明式），不再使用 `new Object3D()` / `addComponent()` /
     * `addChild()`；图标宿主经响应式代理 push 进宿主 children——父级关系与组件初始化
     * 由主仓 `ContainerLogic` / `EntityLogic` 的 effect 自动维护。
     *
     * @param target 被跟随的相机 / 光源组件（raw）
     * @param host 图标挂载的父对象（本组件宿主）
     */
    #addIcon(target: Components, host: Object3D): void
    {
        const editorCamera = this.#data.editorCamera;
        let iconObject3D: Object3D;

        if (matchType(target, 'DirectionalLight'))
        {
            iconObject3D = {
                __type__: 'Object3D',
                name: 'DirectionLightIcon',
                components: [{ __type__: 'DirectionLightIcon', light: target as DirectionalLight, editorCamera }],
            };
        }
        else if (matchType(target, 'PointLight'))
        {
            iconObject3D = {
                __type__: 'Object3D',
                name: 'PointLightIcon',
                components: [{ __type__: 'PointLightIcon', light: target as PointLight, editorCamera }],
            };
        }
        else if (matchType(target, 'SpotLight'))
        {
            iconObject3D = {
                __type__: 'Object3D',
                name: 'SpotLightIcon',
                components: [{ __type__: 'SpotLightIcon', light: target as SpotLight, editorCamera }],
            };
        }
        else if (matchType(target, 'Camera'))
        {
            iconObject3D = {
                __type__: 'Object3D',
                name: 'CameraIcon',
                components: [{ __type__: 'CameraIcon', camera: target as Camera, editorCamera }],
            };
        }
        else
        {
            return;
        }

        const r_children = reactive(host).children as unknown as Object3D[];
        r_children.push(iconObject3D);
        this.#iconMap.set(target, iconObject3D);
    }

    /**
     * 销毁被跟随组件的图标对象。
     *
     * 旧写法 `serialization.setValue(icon, { light: null }).object3D.remove()` 的两步语义：
     * 先断开图标对目标组件的反向引用，再把对象从场景移除。新范式分别对应
     * 「响应式置空字段」与「`dispose()`（内含从父级 children 移除）」。
     *
     * @param target 被跟随组件（raw）
     */
    #removeIcon(target: Components): void
    {
        const iconObject3D = this.#iconMap.get(target);
        if (!iconObject3D) return;

        this.#iconMap.delete(target);

        const iconData = iconObject3D.components?.[0];
        if (iconData)
        {
            if (matchType(iconData, 'Camera')) reactive(iconData as CameraIcon).camera = undefined;
            else reactive(iconData as DirectionLightIcon | PointLightIcon | SpotLightIcon).light = undefined;
        }

        getLogic(iconObject3D).dispose();
    }
}
