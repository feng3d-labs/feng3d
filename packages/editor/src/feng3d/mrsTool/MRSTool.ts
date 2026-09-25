import { ComponentLogicBase, globalEmitter, HideFlags, ticker } from 'feng3d';
import type { Camera, Component3D, Object3D, Renderable } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { EditorData, MRSToolType } from '../../global/EditorData';
import { MRSToolBase, MRSToolBaseLogic } from './MRSToolBase';
import { MRSToolTarget } from './MRSToolTarget';
import { MTool, MToolLogic } from './MTool';
import { RTool, RToolLogic } from './RTool';
import { STool, SToolLogic } from './STool';

/**
 * 设置永久可见。
 *
 * TODO(P1 API 迁移)：旧实现用 `component.getComponentsInChildren(Renderable)` 遍历子对象，
 * 主仓已改为 `logic(entity).getComponentsInChildren('Renderable')`（传 `__type__` 字符串），
 * 且 `Renderable` 已不在 `ComponentMap` 中。待 P1 改写后恢复接线。
 */
function setAwaysVisible(_component: Component3D): void
{
    // TODO(P1 API 迁移)：恢复写法
    //   const renderables = logic(logic(component).entity).getComponentsInChildren<Renderable>('Renderable');
    //   renderables.forEach((element) => { if (element.material) setDepthTest(element.material, false); });
}

/**
 * 位移旋转缩放工具（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class MRSTool extends Component`：
 * 新范式中组件是纯数据接口，行为由 {@link MRSToolLogic} 提供。
 */
export interface MRSTool extends MRSToolBase
{
    /** 组件类型名 */
    readonly __type__: 'MRSTool';
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        MRSTool: MRSTool;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        MRSTool: MRSToolLogic;
    }
}

/**
 * MRSToolLogic 逻辑类。
 *
 * **P0 阶段（编辑器启动解阻塞）说明**：
 * 原 class 的 `extends Component` 在新范式下会导致**模块加载期崩溃**——`Component`
 * 已是纯 interface，运行时为 `undefined`。本类只做「结构迁移」，依赖旧 API
 * （`serialization.setValue` / `addComponent` / `addChild` / `object3D`）的部分
 * 标注 `TODO(P1 API 迁移)`，避免运行时崩溃。
 */
export class MRSToolLogic extends ComponentLogicBase
{
    #data: MRSTool;

    /** 工具根对象（懒创建） */
    #mrsToolObject: Object3D | null = null;

    /** 当前激活的工具（Logic 实例） */
    #currentTool: MRSToolBaseLogic | null = null;

    #mTool: MToolLogic | null = null;
    #rTool: RToolLogic | null = null;
    #sTool: SToolLogic | null = null;

    protected constructor(data: MRSTool)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<MRSTool>;
        if (data.mrsToolTarget === undefined) writable.mrsToolTarget = new MRSToolTarget();

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: MRSTool): MRSToolLogic
    {
        return new MRSToolLogic(data);
    }

    get editorCamera(): Camera
    {
        return this.#data.editorCamera;
    }

    set editorCamera(v: Camera)
    {
        const current = this.#data.editorCamera;
        if (current === v) return;
        (this.#data as UnReadonly<MRSTool>).editorCamera = v;
        this.invalidate();
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此用旧 API 构建工具层级：
        //   this.mrsToolObject = serialization.setValue(new Object3D(), { name: 'MRSTool' });
        //   this.mTool = serialization.setValue(new Object3D(), { name: 'MTool' }).addComponent(MTool);
        //   this.rTool = ... / this.sTool = ...
        //   this.mTool.mrsToolTarget = this.mrsToolTarget;（三个工具共享同一目标）
        //   setAwaysVisible(this.mTool / this.rTool / this.sTool);
        //   this.currentTool = this.mTool;
        // 新范式改写方向（API_MIGRATION.md §3.6）：
        //   Object3D 用字面量 `{ __type__: 'Object3D', name: 'MTool', components: [{ __type__: 'MTool', ... }] }`
        //   挂载用 `reactive(host).children.push(...)`，取 Logic 用 `logic(component)`。
        // 同时旧的字符串事件注册需改为 `effect` / 编辑器事件对象：
        //   globalEmitter.on('editor.selectedObjectsChanged', ...) / ('editor.toolTypeChanged', ...)
        void this.#mrsToolObject;
    }

    override dispose(): void
    {
        //
        this.currentTool = null;
        //
        this.#mrsToolObject = null;
        this.#mTool = null;
        this.#rTool = null;
        this.#sTool = null;
        //
        globalEmitter.off('editor.selectedObjectsChanged', this.onSelectedObject3DChange, this);
        globalEmitter.off('editor.toolTypeChanged', this.onToolTypeChange, this);

        super.dispose();
    }

    private invalidate(): void
    {
        ticker.nextframe(this.update, this);
    }

    private update(): void
    {
        // TODO(P1 API 迁移)：原实现在此把 editorCamera 分发给三个工具（`this.mTool.editorCamera = ...`）。
        // 新范式经 Logic 写入入口：`this.#mTool.editorCamera = this.#data.editorCamera;`
    }

    private onSelectedObject3DChange(): void
    {
        // TODO(P1 API 迁移)：主仓 `Object3D` 已无 `hideFlags` 字段（`HideFlags` 枚举成为孤儿导出），
        // 原过滤条件 `!(v.hideFlags & HideFlags.DontTransform)` 无法表达，暂直接取全部选中对象：
        //   const objects = EditorData.editorData.selectedObject3Ds.filter((v) => !(v.hideFlags & HideFlags.DontTransform));
        const objects = EditorData.editorData.selectedObject3Ds;
        void HideFlags;

        // 筛选出 工具控制的对象
        if (objects.length > 0)
        {
            // TODO(P1 API 迁移)：旧实现 `this.object3D.addChild(this.mrsToolObject)`；
            // 新范式 `logic(entity).children` 响应式 push（或 setParent）。
        }
        else
        {
            // TODO(P1 API 迁移)：旧实现 `this.mrsToolObject.remove()`；
            // 新范式 `logic(this.#mrsToolObject).dispose()`。
        }
    }

    private onToolTypeChange(): void
    {
        switch (EditorData.editorData.toolType)
        {
            case MRSToolType.MOVE:
                this.currentTool = this.#mTool;
                break;
            case MRSToolType.ROTATION:
                this.currentTool = this.#rTool;
                break;
            case MRSToolType.SCALE:
                this.currentTool = this.#sTool;
                break;
        }
    }

    private get currentTool(): MRSToolBaseLogic | null
    {
        return this.#currentTool;
    }

    private set currentTool(value: MRSToolBaseLogic | null)
    {
        if (this.#currentTool === value)
        {
            return;
        }
        if (this.#currentTool)
        {
            // TODO(P1 API 迁移)：旧实现 `this._currentTool.object3D.remove()`；
            // 新范式 `logic(logic(this.#currentTool).entity).dispose()`。
        }
        this.#currentTool = value;
        if (this.#currentTool)
        {
            // TODO(P1 API 迁移)：旧实现 `this.mrsToolObject.addChild(this._currentTool.object3D)`；
            // 新范式 `logic(this.#mrsToolObject).children` 响应式 push。
        }
    }
}

// 注册到 logic 分发表
registerLogic('MRSTool', MRSToolLogic as unknown as new (data: MRSTool) => MRSToolLogic);
