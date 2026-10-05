import { Behaviour, BehaviourLogic, createBehaviourLogicBase, type Object3D, registerComponentType } from 'feng3d';
import { effect, reactive, registerLogic, UnReadonly } from '@feng3d/reactivity';
import { serialization, type Serializable } from '@feng3d/serialization';
import type { gPartial } from '@feng3d/polyfill';
// 副作用导入：`createButtonObject3D()` 返回的纯数据字面量要在运行时分发到 Transform2DLogic；
// 只用作类型标注的 import 会被转译器整条擦除，那样它的 registerLogic 就不会执行
// （`logic({ __type__: 'Transform2D' })` 返回 null）。
import './core/Transform2D';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Button: Button;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Button: ButtonLogic;
    }
}

/**
 * 按钮状态
 */
export enum ButtonState
{
    /**
     * 弹起状态，默认状态。
     */
    up = 'up',
    /**
     * 鼠标在按钮上状态。
     */
    over = 'over',
    /**
     * 鼠标按下状态。
     */
    down = 'down',
    /**
     * 选中时弹起状态。
     */
    selected_up = 'selected_up',
    /**
     * 选中时鼠标在按钮上状态。
     */
    selected_over = 'selected_over',
    /**
     * 选中时鼠标按下状态。
     */
    selected_down = 'selected_down',
    /**
     * 禁用状态。
     */
    disabled = 'disabled',
}

/**
 * 一个状态下保存的子对象数据（键为子对象名，值为该子对象序列化后的纯数据）。
 *
 * 值类型刻意用 `unknown`，而不是 `Serializable` / `gPartial<Object3D>`：`Object3D.components` 的类型是
 * `ComponentMap[keyof ComponentMap]` 联合，Button 一旦加入该联合，任何**递归**类型（`Serializable` 的
 * index signature 指向自身、`gPartial<Object3D>` 经 children/components 回到 Object3D）都会在
 * `@feng3d/reactivity` 的 `Reactive<T>`（`UnwrapRefSimpleNoRef` 递归映射）里被无限展开，实测触发
 * `TS2589: Type instantiation is excessively deep`（报在 feng3d 的 Container.ts:74 的 `reactive(state)` 上）。
 * 读写边界各自显式收窄（见 {@link ButtonLogic.saveState} / `#updateState`）。
 */
type ButtonStateData = { readonly [name: string]: unknown };

/**
 * 所有状态数据（键为状态名，如 `up` / `over`）。
 */
type ButtonAllStateData = { readonly [state: string]: ButtonStateData };

/**
 * 按钮（纯数据接口）。
 *
 * 按钮自身不渲染：画面由子对象提供，`state` 变化时把对应状态下保存的子对象数据写回子对象
 * （见 {@link ButtonLogic}）。字段一律 `readonly`，修改经 `reactive(button).field = value` 写入。
 *
 * 迁移前 `Button` 是 `Behaviour` 的 class 子类，带 `@AddComponentMenu` / `@RegisterComponent` /
 * `@decoratorRegisterClass` / `@oav` / `@serialize` 装饰器与 `saveState()` 方法；装饰器在新范式下
 * 无对象（字段描述改由 `__type__` + 类型驱动），方法按 §11.2 收进 Logic。
 */
export interface Button extends Behaviour
{
    readonly __type__: 'Button';

    /**
     * 按钮所处状态（缺失时按 {@link ButtonState.up} 处理，见 {@link ButtonLogic} 构造）。
     */
    readonly state?: ButtonState;

    /**
     * 所有状态数据，每一个状态数据中记录了子对象的当前数据（缺失时按空对象处理）。
     *
     * 迁移前该字段带 `@serialize`；装饰器随新范式一并删除，故本字段不再进入序列化输出
     * （与 `TextStyle` 的处理一致，见本批迁移报告）。
     */
    readonly allStateData?: ButtonAllStateData;
}

/**
 * Button 逻辑接口。
 *
 * 迁移前 `Button` 组件构造时 `watcher.watch` 状态变化、每帧 `update` 里按需把保存的状态数据
 * 写回子对象。本逻辑保留同一流程，差异见方法内注释。
 */
export interface ButtonLogic extends BehaviourLogic
{
    /**
     * 保存当前状态，例如在编辑器中编辑完按钮某一状态后调用该方法进行保存当前状态数据。
     *
     * 迁移前是 `Button` 组件上的 `@oav()` 公开方法；纯数据接口不能挂方法（§11.2），
     * 编辑器属性面板上的按钮入口需改为 `logic(button).saveState()`。
     */
    saveState(): void;
}

/**
 * 工厂函数：ButtonLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * 原构造函数体：`state` / `allStateData` 字段默认值由工厂补（写在 raw 数据上）。
 *
 * @param data 按钮组件数据（raw）
 */
export function buttonLogic(data: Button): ButtonLogic
{
    // §11.5：构造参数字段可选，默认值由 Logic 工厂补（写在 raw 数据上）。
    // 两个默认值逐字对应迁移前的字段初始值（`state = ButtonState.up` / `allStateData = {}`）。
    const writable = data as UnReadonly<Button>;
    if (writable.state === undefined) writable.state = ButtonState.up;
    if (writable.allStateData === undefined) writable.allStateData = {};

    const { members } = createBehaviourLogicBase(data);

    /** 状态数据是否需要重建（迁移前是组件上的私有字段 `_stateInvalid`） */
    let stateInvalid = true;

    /**
     * 本组件自己的 init 去重标志。
     *
     * 不能复用基类 Behaviour 的 `state.inited`：子类 init 先调 `members.init`，
     * 基类会把 `state.inited` 置 true，随后再判它就会直接 return、监听永远装不上。
     */
    let ownInited = false;

    const logic: ButtonLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        init(object3D)
        {
            members.init(object3D);
            if (ownInited) return;
            ownInited = true;

            // @过渡 effect：数据 → 运行时失效标志。迁移前是构造里的
            // `watcher.watch(this, 'state', this._onStateChanged, this)`（`_onStateChanged` 只置 `_stateInvalid`）。
            // effect 在 init 时才装（与 Transform2DLogic / TextLogic 同批约定）：未挂载的裸组件不留无人回收的监听。
            effect(() =>
            {
                reactive(data).state;
                stateInvalid = true;
            });
        },
        saveState()
        {
            const currentState = state();
            const stateData: { [name: string]: unknown } = {};

            const childMap = collectChildren();
            for (const childname in childMap)
            {
                // `serialize()` 的返回类型是 `gPartial<Object3D>`，而 `deleteClassKey` 要求 `Serializable`
                // （可 JSON 化的纯数据）：两者结构上一致，但 `gPartial<Object3D>` 这个带方法字段的映射类型
                // 不被 TS 认为与其重叠（原代码在此处报 TS2345），故在边界处显式收窄一次。
                const jsonObj = serialization.serialize(childMap[childname]) as unknown as Serializable;
                serialization.deleteClassKey(jsonObj);
                stateData[childname] = jsonObj;
            }

            // 经响应式代理写入（§8.4：从 raw 读当前值、向代理赋新值；§11.3：修改走纯数据接口）。
            // 迁移前是就地插入键 `this.allStateData[this.state] = stateData`——容器对象身份会变，
            // 但该容器不参与其它地方的比较，变更驱动下整体替换更明确。
            reactive(data).allStateData = { ...data.allStateData, [currentState]: stateData };
        },
        update(_interval)
        {
            if (stateInvalid)
            {
                updateState();
                stateInvalid = false;
            }
        },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
    };

    /** 当前状态（构造已补默认，此处收窄可选类型） */
    function state(): ButtonState
    {
        return data.state ?? ButtonState.up;
    }

    /**
     * 收集子对象（按名去重，同名只保留第一个——迁移前语义）。
     *
     * 迁移前用 `this.object3D.children`；新架构下组件经 `init()` 拿到所属实体（§11.2 只读 getter）。
     */
    function collectChildren(): { [name: string]: Object3D }
    {
        const childMap: { [name: string]: Object3D } = {};
        const children = logic.entity?.children;
        if (!children) return childMap;

        children.forEach((child) =>
        {
            const c = child as Object3D;
            const name = c.name;
            // strictNullChecks：`Object3D.name` 可选。无名子对象直接跳过——迁移前用 undefined 作键，
            // 会全部挤进 `childMap['undefined']` 这一格（同名去重下只有第一个留下），语义上并无意义。
            if (!name || childMap[name]) return;
            childMap[name] = c;
        });

        return childMap;
    }

    /**
     * 更新状态：把当前状态下保存的子对象数据写回子对象。
     */
    function updateState(): void
    {
        const statedata = data.allStateData?.[state()];
        if (!statedata) return;

        const childMap = collectChildren();
        for (const childname in childMap)
        {
            const childStateData = statedata[childname];
            if (childStateData === undefined) continue;

            // 经响应式代理写入（§8.4 / §11.3）：变更驱动渲染下裸写不会触发子对象自身的失效逻辑
            // （例如子 Text 的文本变化经 effect 触发重绘）。
            // 迁移前是 `childMap[childname] = serialization.setValue(childMap[childname], statedata[childname])`；
            // `setValue` 的返回值就是传入的 target，故不再赋回局部 map。
            // 状态数据存的是序列化后的纯数据，此处按 `setValue` 的入参类型还原。
            const child = reactive(childMap[childname]) as Object3D;
            serialization.setValue(child, childStateData as gPartial<Object3D>);
        }
    }

    return logic;
}

// 注册到统一 logic 分发表
registerLogic('Button', buttonLogic);

// 登记组件类型（理由见 core/CanvasRenderer.ts）：Button 是 Behaviour 的子类型，不登记则
// `Scene.activeBehaviours` 扫不到它 → `ButtonLogic.update`（按钮状态机）永远不被驱动。
registerComponentType('Button', { baseTypes: ['Behaviour'] });

/**
 * 创建按钮对象（带 2D 变换与按钮组件的 Object3D 字面量）。
 *
 * 迁移前这里是 `registerPrimitive('Button', handler)`：把「如何拼装一个 Button 对象」注册进原语注册表，
 * 供 `Object3D.createPrimitive('Button')` / 层级面板右键菜单（`createNodeMenu`）取用。主仓已整体移除
 * primitive 体系（`registerPrimitive` / `createPrimitive` / `createNodeMenu` / `MixinsPrimitiveObject3D`
 * 都不存在），故与 `core/Canvas.ts` 的 `createCanvasObject3D()` 同形态，改为直接返回纯数据字面量；
 * 编辑器侧若要恢复「新建 UI 对象」菜单，需要另行接线（见本批迁移报告）。
 *
 * **与原 primitive 一致，这里只有 Transform2D + Button、没有 CanvasRenderer**（按钮自身不渲染）。
 *
 * @returns 含 Transform2D（160×30）与 Button 组件的 Object3D 数据
 */
export function createButtonObject3D(): Object3D
{
    return {
        __type__: 'Object3D',
        components: [
            { __type__: 'Transform2D', size: { x: 160, y: 30 } },
            { __type__: 'Button' },
        ],
    };
}
