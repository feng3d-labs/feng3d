import { globalEmitter, reactive, ticker } from 'feng3d';
import type { Camera, Object3D } from 'feng3d';
import { createLogicProto, UnReadonly } from '@feng3d/reactivity';
import { MRSToolType } from '../../global/EditorData';
import { useEditorStore } from '../../vue-app/stores/editorStore';
import { mrsToolBaseLogicProto, setupMRSToolBaseLogicState } from './MRSToolBase';
import type { MRSToolBase, MRSToolBaseLogic, MRSToolBaseLogicState } from './MRSToolBase';
import { MRSToolTarget } from './MRSToolTarget';
import type { MTool } from './MTool';
import type { RTool } from './RTool';
import type { STool } from './STool';

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
 * MRSToolLogic 逻辑接口。
 *
 * 职责：构建「工具根对象 → 三个工具对象（位移/旋转/缩放）」层级，按 `EditorData.toolType`
 * 切换当前工具，并把编辑器相机分发给三个工具。选中对象为空时隐藏 gizmo。
 *
 * 说明：旧实现用 `serialization.setValue(new Object3D(), ...)` + `addComponent` 命令式构建，
 * 并以数据对象的字符串事件监听选中/工具类型变化；新范式改为纯数据字面量 + 编辑器事件总线
 * （`globalEmitter`）。旧实现的「gizmo 永远显示在最前」（`setDepthTest(material, false)`）
 * 依赖当前 API 未暴露的材质渲染状态，暂缺（见 docs/API_MIGRATION.md §8）。
 */
export interface MRSToolLogic extends MRSToolBaseLogic
{
    /** 编辑器相机 */
    editorCamera: Camera;
}

/** MRSToolLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface MRSToolLogicState extends MRSToolBaseLogicState
{
    /** 关联的组件数据（raw，子类可读） */
    _data: MRSTool;

    /** 工具根对象（选中对象非空时挂到宿主下） */
    _mrsToolObject: Object3D | null;

    /** 三个工具的对象与组件数据 */
    _mToolObject: Object3D | null;
    _rToolObject: Object3D | null;
    _sToolObject: Object3D | null;
    _mTool: MTool | null;
    _rTool: RTool | null;
    _sTool: STool | null;

    /** 当前激活的工具对象 */
    _currentTool: Object3D | null;

    /** 相机变化时把新相机分发给三个工具（下一帧写入） */
    invalidate(): void;

    update(): void;

    /** 选中对象变化：有选中则显示 gizmo，否则隐藏 */
    onSelectedObject3DChange(): void;

    onToolTypeChange(): void;

    /** 当前激活的工具对象 */
    currentTool: Object3D | null;
}

/** MRSToolLogic 的共享原型：继承 MRSToolBase 基类实现，覆写 editorCamera / init / dispose */
const mrsToolLogicProto = createLogicProto<MRSToolLogic>(mrsToolBaseLogicProto, {
    editorCamera: {
        get: function (this: MRSToolLogic & MRSToolLogicState): Camera
        {
            // editorCamera 在数据接口里是可选的（初始化阶段可能还没设），未设置时读它会与原来一样崩
            return this._data.editorCamera!;
        },
        set: function (this: MRSToolLogic & MRSToolLogicState, v: Camera): void
        {
            const current = this._data.editorCamera;
            if (current === v) return;
            (this._data as UnReadonly<MRSTool>).editorCamera = v;
            this.invalidate();
        },
    },
    init: {
        value: function (this: MRSToolLogic & MRSToolLogicState, entity?: Object3D): void
        {
            mrsToolBaseLogicProto.init.call(this, entity);

            // 三个工具共享同一操作目标
            const mrsToolTarget = this._data.mrsToolTarget;
            const editorCamera = this._data.editorCamera;

            this._mTool = { __type__: 'MTool', mrsToolTarget, editorCamera };
            this._rTool = { __type__: 'RTool', mrsToolTarget, editorCamera };
            this._sTool = { __type__: 'STool', mrsToolTarget, editorCamera };

            this._mrsToolObject = { __type__: 'Object3D', name: 'MRSTool' };
            this._mToolObject = createToolObject('MTool', this._mTool);
            this._rToolObject = createToolObject('RTool', this._rTool);
            this._sToolObject = createToolObject('STool', this._sTool);

            // 工具根对象只挂**当前**工具：未激活的工具不参与渲染，也不会注册全局鼠标事件
            // （旧实现同样只在 `currentTool` setter 里 `addChild` 当前工具）
            const r_mrsToolObject = reactive(this._mrsToolObject);
            if (!r_mrsToolObject.children) (this._mrsToolObject as { children: Object3D[] }).children = [];

            // 默认激活位移工具
            this.currentTool = this._mToolObject;

            globalEmitter.on('editor.selectedObjectsChanged', this.onSelectedObject3DChange, this);
            globalEmitter.on('editor.toolTypeChanged', this.onToolTypeChange, this);

            // 构造末尾按**当前**选中补一次（issue #173 的同一类问题）：订阅式同步收不到
            // "订阅之前发生的选中"，表现是工具不跟随已有的选中对象，直到用户重新点一次。
            // 本类不是 Vue 组件、用不了 `useSelectionSync`，所以手写同一条纪律
            this.onSelectedObject3DChange();
        },
    },
    dispose: {
        value: function (this: MRSToolLogic & MRSToolLogicState): void
        {
            this.currentTool = null;
            this._mrsToolObject = null;
            this._mToolObject = null;
            this._rToolObject = null;
            this._sToolObject = null;
            this._mTool = null;
            this._rTool = null;
            this._sTool = null;

            globalEmitter.off('editor.selectedObjectsChanged', this.onSelectedObject3DChange, this);
            globalEmitter.off('editor.toolTypeChanged', this.onToolTypeChange, this);

            mrsToolBaseLogicProto.dispose.call(this);
        },
    },
    /** 相机变化时把新相机分发给三个工具（下一帧写入） */
    invalidate: {
        value: function (this: MRSToolLogic & MRSToolLogicState): void
        {
            ticker.nextframe(this.update, this);
        },
    },
    update: {
        value: function (this: MRSToolLogic & MRSToolLogicState): void
        {
            const editorCamera = this._data.editorCamera;
            for (const tool of [this._mTool, this._rTool, this._sTool])
            {
                if (tool) reactive(tool).editorCamera = editorCamera;
            }
        },
    },
    /** 选中对象变化：有选中则显示 gizmo，否则隐藏 */
    onSelectedObject3DChange: {
        value: function (this: MRSToolLogic & MRSToolLogicState): void
        {
            // 主仓 `Object3D` 已无 `hideFlags` 字段，旧过滤条件 `!(v.hideFlags & HideFlags.DontTransform)`
            // 无法表达，这里直接取全部选中对象
            const objects = useEditorStore().selectedObject3Ds;
            const host = this.entity as Object3D | null;
            const mrsToolObject = this._mrsToolObject;
            if (!host || !mrsToolObject) return;

            const r_host = reactive(host);
            if (!r_host.children) (host as { children: Object3D[] }).children = [];
            // children 的补齐写在 raw 上，TS 无法据此收窄代理的读取，故取一次到局部变量（读代理建立依赖，行为不变）
            const children = r_host.children!;
            const index = children.indexOf(mrsToolObject);

            if (objects.length > 0)
            {
                if (index < 0) children.push(mrsToolObject);
            }
            else if (index >= 0)
            {
                children.splice(index, 1);
            }
        },
    },
    onToolTypeChange: {
        value: function (this: MRSToolLogic & MRSToolLogicState): void
        {
            switch (useEditorStore().toolType)
            {
                case MRSToolType.MOVE:
                    this.currentTool = this._mToolObject;
                    break;
                case MRSToolType.ROTATION:
                    this.currentTool = this._rToolObject;
                    break;
                case MRSToolType.SCALE:
                    this.currentTool = this._sToolObject;
                    break;
            }
        },
    },
    currentTool: {
        get: function (this: MRSToolLogic & MRSToolLogicState): Object3D | null
        {
            return this._currentTool;
        },
        /**
         * 切换当前工具：未激活的工具对象从工具根对象上摘除，当前工具挂上去。
         *
         * 摘除后其 Logic 的「离开场景」逻辑会反注册全局鼠标事件，因此只有当前工具参与渲染
         * 与响应拖拽（等效旧实现 `this._currentTool.object3D.remove()` / `addChild(...)`）。
         */
        set: function (this: MRSToolLogic & MRSToolLogicState, value: Object3D | null): void
        {
            if (this._currentTool === value) return;

            const mrsToolObject = this._mrsToolObject;
            if (!mrsToolObject) return;

            const r_mrsToolObject = reactive(mrsToolObject);
            if (!r_mrsToolObject.children) (mrsToolObject as { children: Object3D[] }).children = [];
            // 同 onToolTargetsChange：补齐写在 raw 上，TS 无法收窄代理读取，取一次到局部变量
            const children = r_mrsToolObject.children!;

            // 摘除旧工具
            const previous = this._currentTool;
            const previousIndex = previous ? children.indexOf(previous) : -1;
            if (previousIndex >= 0) children.splice(previousIndex, 1);

            this._currentTool = value;

            // 挂载新工具
            if (value && children.indexOf(value) < 0) children.push(value);
        },
    },
});

/**
 * 工厂函数：MRSToolLogic 的唯一创建入口。
 *
 * @param data 组件数据（raw）
 */
export function mrsToolLogic(data: MRSTool): MRSToolLogic
{
    // 默认值填充（须在 super 之前完成）
    const writable = data as UnReadonly<MRSTool>;
    if (data.mrsToolTarget === undefined) writable.mrsToolTarget = new MRSToolTarget();

    const logic = setupMRSToolBaseLogicState(Object.create(mrsToolLogicProto) as MRSToolLogic & MRSToolLogicState, data);
    logic._mrsToolObject = null;
    logic._mToolObject = null;
    logic._rToolObject = null;
    logic._sToolObject = null;
    logic._mTool = null;
    logic._rTool = null;
    logic._sTool = null;
    logic._currentTool = null;

    return logic;
}

/** 用组件数据创建工具对象（旧实现 `new Object3D().addComponent(XxxTool)`） */
function createToolObject(name: string, component: MTool | RTool | STool): Object3D
{
    return { __type__: 'Object3D', name, components: [component] };
}
