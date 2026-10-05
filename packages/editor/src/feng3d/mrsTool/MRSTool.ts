import { globalEmitter, reactive, ticker } from 'feng3d';
import type { Camera, Object3D } from 'feng3d';
import { UnReadonly } from '@feng3d/reactivity';
import { MRSToolType } from '../../global/EditorData';
import { useEditorStore } from '../../vue-app/stores/editorStore';
import { createMRSToolBaseLogicBase } from './MRSToolBase';
import type { MRSToolBase, MRSToolBaseLogic } from './MRSToolBase';
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

    const { state, members: baseMembers } = createMRSToolBaseLogicBase(data);

    /** 工具根对象（选中对象非空时挂到宿主下） */
    let mrsToolObject: Object3D | null = null;

    /** 三个工具的对象与组件数据 */
    let mToolObject: Object3D | null = null;
    let rToolObject: Object3D | null = null;
    let sToolObject: Object3D | null = null;
    let mTool: MTool | null = null;
    let rTool: RTool | null = null;
    let sTool: STool | null = null;

    /** 当前激活的工具对象 */
    let currentTool: Object3D | null = null;

    /** 相机变化时把新相机分发给三个工具（下一帧写入） */
    function update(): void
    {
        const editorCamera = data.editorCamera;
        for (const tool of [mTool, rTool, sTool])
        {
            if (tool) reactive(tool).editorCamera = editorCamera;
        }
    }

    /** 相机变化时把新相机分发给三个工具（下一帧写入） */
    function invalidate(): void
    {
        ticker.nextframe(update, state);
    }

    /**
     * 切换当前工具：未激活的工具对象从工具根对象上摘除，当前工具挂上去。
     *
     * 摘除后其 Logic 的「离开场景」逻辑会反注册全局鼠标事件，因此只有当前工具参与渲染
     * 与响应拖拽（等效旧实现 `this._currentTool.object3D.remove()` / `addChild(...)`）。
     */
    function setCurrentTool(value: Object3D | null): void
    {
        if (currentTool === value) return;

        const toolObject = mrsToolObject;
        if (!toolObject) return;

        const r_mrsToolObject = reactive(toolObject);
        if (!r_mrsToolObject.children) (toolObject as { children: Object3D[] }).children = [];
        // 同 onToolTargetsChange：补齐写在 raw 上，TS 无法收窄代理读取，取一次到局部变量
        const children = r_mrsToolObject.children!;

        // 摘除旧工具
        const previous = currentTool;
        const previousIndex = previous ? children.indexOf(previous) : -1;
        if (previousIndex >= 0) children.splice(previousIndex, 1);

        currentTool = value;

        // 挂载新工具
        if (value && children.indexOf(value) < 0) children.push(value);
    }

    /** 选中对象变化：有选中则显示 gizmo，否则隐藏 */
    function onSelectedObject3DChange(): void
    {
        // 主仓 `Object3D` 已无 `hideFlags` 字段，旧过滤条件 `!(v.hideFlags & HideFlags.DontTransform)`
        // 无法表达，这里直接取全部选中对象
        const objects = useEditorStore().selectedObject3Ds;
        const host = state.entity as Object3D | null;
        const toolObject = mrsToolObject;
        if (!host || !toolObject) return;

        const r_host = reactive(host);
        if (!r_host.children) (host as { children: Object3D[] }).children = [];
        // children 的补齐写在 raw 上，TS 无法据此收窄代理的读取，故取一次到局部变量（读代理建立依赖，行为不变）
        const children = r_host.children!;
        const index = children.indexOf(toolObject);

        if (objects.length > 0)
        {
            if (index < 0) children.push(toolObject);
        }
        else if (index >= 0)
        {
            children.splice(index, 1);
        }
    }

    function onToolTypeChange(): void
    {
        switch (useEditorStore().toolType)
        {
            case MRSToolType.MOVE:
                setCurrentTool(mToolObject);
                break;
            case MRSToolType.ROTATION:
                setCurrentTool(rToolObject);
                break;
            case MRSToolType.SCALE:
                setCurrentTool(sToolObject);
                break;
        }
    }

    const logic: MRSToolLogic = {
        // ---- MRSToolBase 基类成员（显式委托） ----
        /** 关联的组件数据（raw） */
        get component() { return baseMembers.component; },
        /** 所属 Object3D */
        get entity() { return baseMembers.entity; },
        init(entity)
        {
            baseMembers.init(entity);

            // 三个工具共享同一操作目标
            const mrsToolTarget = data.mrsToolTarget;
            const editorCamera = data.editorCamera;

            const mToolData: MTool = { __type__: 'MTool', mrsToolTarget, editorCamera };
            const rToolData: RTool = { __type__: 'RTool', mrsToolTarget, editorCamera };
            const sToolData: STool = { __type__: 'STool', mrsToolTarget, editorCamera };

            mTool = mToolData;
            rTool = rToolData;
            sTool = sToolData;

            const toolObject: Object3D = { __type__: 'Object3D', name: 'MRSTool' };
            mrsToolObject = toolObject;
            mToolObject = createToolObject('MTool', mToolData);
            rToolObject = createToolObject('RTool', rToolData);
            sToolObject = createToolObject('STool', sToolData);

            // 工具根对象只挂**当前**工具：未激活的工具不参与渲染，也不会注册全局鼠标事件
            // （旧实现同样只在 `currentTool` setter 里 `addChild` 当前工具）
            const r_mrsToolObject = reactive(toolObject);
            if (!r_mrsToolObject.children) (toolObject as { children: Object3D[] }).children = [];

            // 默认激活位移工具
            setCurrentTool(mToolObject);

            globalEmitter.on('editor.selectedObjectsChanged', onSelectedObject3DChange, state);
            globalEmitter.on('editor.toolTypeChanged', onToolTypeChange, state);

            // 构造末尾按**当前**选中补一次（issue #173 的同一类问题）：订阅式同步收不到
            // "订阅之前发生的选中"，表现是工具不跟随已有的选中对象，直到用户重新点一次。
            // 本类不是 Vue 组件、用不了 `useSelectionSync`，所以手写同一条纪律
            onSelectedObject3DChange();
        },
        beforeRender(renderObject) { baseMembers.beforeRender(renderObject); },
        get isLoaded() { return baseMembers.isLoaded; },
        dispose()
        {
            setCurrentTool(null);
            mrsToolObject = null;
            mToolObject = null;
            rToolObject = null;
            sToolObject = null;
            mTool = null;
            rTool = null;
            sTool = null;

            globalEmitter.off('editor.selectedObjectsChanged', onSelectedObject3DChange, state);
            globalEmitter.off('editor.toolTypeChanged', onToolTypeChange, state);

            baseMembers.dispose();
        },
        /** 编辑器相机 */
        get editorCamera() { return data.editorCamera!; },
        set editorCamera(v)
        {
            const current = data.editorCamera;
            if (current === v) return;
            (data as UnReadonly<MRSTool>).editorCamera = v;
            invalidate();
        },
        get host() { return baseMembers.host; },
        get editorCameraObject() { return baseMembers.editorCameraObject; },
        get toolModel() { return baseMembers.toolModel; },
        setToolModel(object3D) { baseMembers.setToolModel(object3D); },
        get toolModelEntity() { return baseMembers.toolModelEntity; },
        get selectedItem() { return baseMembers.selectedItem; },
        set selectedItem(value) { baseMembers.selectedItem = value; },
        onAddedToScene() { baseMembers.onAddedToScene(); },
        onRemovedFromScene() { baseMembers.onRemovedFromScene(); },
        onItemMouseDown(item) { baseMembers.onItemMouseDown(item); },
        updateToolModel() { baseMembers.updateToolModel(); },
        pickItem() { return baseMembers.pickItem(); },
        onMouseDown() { baseMembers.onMouseDown(); },
        onMouseUp() { baseMembers.onMouseUp(); },
        getLocalMousePlaneCross() { return baseMembers.getLocalMousePlaneCross(); },
        getMousePlaneCross() { return baseMembers.getMousePlaneCross(); },
        getMouseRay3D() { return baseMembers.getMouseRay3D(); },
    };

    // 基座内部按子类覆写分派（闭包形态下没有原型链）
    state.self = logic;

    return logic;
}

/** 用组件数据创建工具对象（旧实现 `new Object3D().addComponent(XxxTool)`） */
function createToolObject(name: string, component: MTool | RTool | STool): Object3D
{
    return { __type__: 'Object3D', name, components: [component] };
}
