import { RunEnvironment, behaviourLogicProto, setupBehaviourLogicState } from 'feng3d';
import type { Behaviour, BehaviourLogic, BehaviourLogicState } from 'feng3d';
import { createLogicProto, UnReadonly } from '@feng3d/reactivity';

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

/** EditorScriptLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
export interface EditorScriptLogicState extends BehaviourLogicState
{
}

/** EditorScriptLogic 的共享原型：继承 Behaviour 基类实现（本层无覆写） */
export const editorScriptLogicProto = createLogicProto<EditorScriptLogic>(behaviourLogicProto, {
});

/**
 * 装配 EditorScript 系 Logic 的**基类状态**（供子类工厂组合调用）。
 *
 * 工厂版本（issue #674）下子类工厂不再 `extends`，而是「接口继承 + 组合调用基类工厂」：
 * 子类先 `Object.create(xxxLogicProto)`，再用本函数装配基类状态，最后装配自身状态。
 * 默认值填充在基类状态装配之前完成，等价于旧写法在 `super(data)` 之前的赋值。
 *
 * @param logic 已 `Object.create` 出、原型已是目标 proto 的实例
 * @param data 编辑器脚本数据（raw）
 * @returns 同一实例（便于链式装配）
 */
export function setupEditorScriptLogicState<T extends EditorScriptLogic & EditorScriptLogicState>(logic: T, data: EditorScript): T
{
    // 默认值填充（须在 super 之前完成，构造完成即已填充）
    const writable = data as UnReadonly<EditorScript>;
    if (data.runEnvironment === undefined) writable.runEnvironment = RunEnvironment.editor;

    return setupBehaviourLogicState(logic, data);
}

/**
 * 工厂函数：EditorScriptLogic 的唯一创建入口。
 *
 * @param data 编辑器脚本数据（raw）
 */
export function editorScriptLogic(data: EditorScript): EditorScriptLogic
{
    return setupEditorScriptLogicState(Object.create(editorScriptLogicProto) as EditorScriptLogic & EditorScriptLogicState, data);
}
