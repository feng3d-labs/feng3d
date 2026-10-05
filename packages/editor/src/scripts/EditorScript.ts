import { createBehaviourLogicBase, RunEnvironment } from 'feng3d';
import type { Behaviour, BehaviourLogic, BehaviourLogicState } from 'feng3d';
import type { UnReadonly } from '@feng3d/reactivity';

/**
 * 编辑器脚本（纯数据接口）。
 *
 * 在 {@link Behaviour} 基础上把 `runEnvironment` 默认限定为编辑器环境。
 * 编辑器自身的脚本组件（CameraIcon / DirectionLightIcon / PointLightIcon /
 * SpotLightIcon 等）继承本接口，各自声明 `readonly __type__: '<字面量>'`
 * 并注册到 `ComponentMap` 与 `LogicMap`。
 *
 * 迁移自旧写法 `class EditorScript extends Behaviour { flag = RunEnvironment.editor; }`：
 * 旧范式用 class 继承 + 实例字段表达，新范式用「纯数据接口 + Logic 工厂」表达。
 */
export interface EditorScript extends Behaviour
{
    /** 组件类型名（由具体子接口收窄为字面量类型） */
    readonly __type__: string;
}

/**
 * EditorScriptLogic 逻辑接口。
 *
 * 继承 {@link BehaviourLogic}（共享 enabled / isVisibleAndEnabled / update / dispose）。
 * 按根规范 §11.5，默认值由工厂在装配基类状态之前统一填充——
 * `registerLogic` 不再承担默认值填充职责（见 `@feng3d/reactivity` logic.ts）。
 */
export interface EditorScriptLogic extends BehaviourLogic
{
}

/**
 * 创建 EditorScript 系 Logic 的**基类状态与成员**（供子类工厂组合调用）。
 *
 * 形态：工厂闭包直接返回对象字面量（无共享 proto、无 this）。子类工厂的用法：
 * ```ts
 * const { members } = createEditorScriptLogicBase(data);
 * const logic: XxxLogic = {
 *     get component() { return members.component; },
 *     get entity() { return members.entity; },
 *     get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
 *     init(object3D) { members.init(object3D); },
 *     // ...其余基类成员 + 自身成员
 * };
 * ```
 *
 * 默认值填充在基类状态装配之前完成，等价于旧写法在 `super(data)` 之前的赋值。
 *
 * @param data 编辑器脚本数据（raw）
 * @returns EditorScript 系 Logic 的基类状态与成员（state 与 Behaviour 基座共享）
 */
export function createEditorScriptLogicBase(data: EditorScript): { state: BehaviourLogicState; members: EditorScriptLogic }
{
    // 默认值填充（须在 super 之前完成，构造完成即已填充）
    const writable = data as UnReadonly<EditorScript>;
    if (data.runEnvironment === undefined) writable.runEnvironment = RunEnvironment.editor;

    return createBehaviourLogicBase(data);
}

/**
 * 工厂函数：EditorScriptLogic 的唯一创建入口。
 *
 * @param data 编辑器脚本数据（raw）
 */
export function editorScriptLogic(data: EditorScript): EditorScriptLogic
{
    const { members } = createEditorScriptLogicBase(data);

    const logic: EditorScriptLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        init(object3D) { members.init(object3D); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        update(interval) { members.update(interval); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
    };

    return logic;
}
