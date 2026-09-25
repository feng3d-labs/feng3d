import { Behaviour, BehaviourLogic, RunEnvironment } from 'feng3d';
import { UnReadonly } from '@feng3d/reactivity';

/**
 * 编辑器脚本（纯数据接口）。
 *
 * 在 {@link Behaviour} 基础上把 `runEnvironment` 默认限定为编辑器环境。
 * 编辑器自身的脚本组件（CameraIcon / DirectionLightIcon / PointLightIcon /
 * SpotLightIcon 等）继承本接口，各自声明 `readonly __type__: '<字面量>'`
 * 并注册到 `ComponentMap` 与 `LogicMap`。
 *
 * 迁移自旧写法 `class EditorScript extends Behaviour { flag = RunEnvironment.editor; }`：
 * 旧范式用 class 继承 + 实例字段表达，新范式用「纯数据接口 + Logic 类」表达。
 */
export interface EditorScript extends Behaviour
{
    /** 组件类型名（由具体子接口收窄为字面量类型） */
    readonly __type__: string;
}

/**
 * EditorScriptLogic 逻辑类。
 *
 * 继承 {@link BehaviourLogic}（共享 enabled / isVisibleAndEnabled / update / dispose）。
 * 按根规范 §11.5，默认值由 Logic 构造时在 `super` 之前统一填充——
 * `registerLogic` 不再承担默认值填充职责（见 `@feng3d/reactivity` logic.ts）。
 */
export class EditorScriptLogic extends BehaviourLogic
{
    protected constructor(data: EditorScript)
    {
        // 默认值填充（须在 super 之前完成，构造完成即已填充）
        const writable = data as UnReadonly<EditorScript>;
        if (data.runEnvironment === undefined) writable.runEnvironment = RunEnvironment.editor;

        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口，供子类使用） */
    static create(data: EditorScript): EditorScriptLogic
    {
        return new EditorScriptLogic(data);
    }
}
