import { ComponentLogicBase, globalEmitter, reactive, ticker } from 'feng3d';
import type { Camera, Component3D, Object3D } from 'feng3d';
import { UnReadonly } from '@feng3d/reactivity';
import { EditorData, MRSToolType } from '../../global/EditorData';
import { MRSToolBase } from './MRSToolBase';
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
 * MRSToolLogic 逻辑类。
 *
 * 职责：构建「工具根对象 → 三个工具对象（位移/旋转/缩放）」层级，按 `EditorData.toolType`
 * 切换当前工具，并把编辑器相机分发给三个工具。选中对象为空时隐藏 gizmo。
 *
 * 说明：旧实现用 `serialization.setValue(new Object3D(), ...)` + `addComponent` 命令式构建，
 * 并以数据对象的字符串事件监听选中/工具类型变化；新范式改为纯数据字面量 + 编辑器事件总线
 * （`globalEmitter`）。旧实现的「gizmo 永远显示在最前」（`setDepthTest(material, false)`）
 * 依赖当前 API 未暴露的材质渲染状态，暂缺（见 docs/API_MIGRATION.md §8）。
 */
export class MRSToolLogic extends ComponentLogicBase
{
    #data: MRSTool;

    /** 工具根对象（选中对象非空时挂到宿主下） */
    #mrsToolObject: Object3D | null = null;

    /** 三个工具的对象与组件数据 */
    #mToolObject: Object3D | null = null;
    #rToolObject: Object3D | null = null;
    #sToolObject: Object3D | null = null;
    #mTool: MTool | null = null;
    #rTool: RTool | null = null;
    #sTool: STool | null = null;

    /** 当前激活的工具对象 */
    #currentTool: Object3D | null = null;

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

        // 三个工具共享同一操作目标
        const mrsToolTarget = this.#data.mrsToolTarget;
        const editorCamera = this.#data.editorCamera;

        this.#mTool = { __type__: 'MTool', mrsToolTarget, editorCamera };
        this.#rTool = { __type__: 'RTool', mrsToolTarget, editorCamera };
        this.#sTool = { __type__: 'STool', mrsToolTarget, editorCamera };

        this.#mrsToolObject = { __type__: 'Object3D', name: 'MRSTool' };
        this.#mToolObject = createToolObject('MTool', this.#mTool);
        this.#rToolObject = createToolObject('RTool', this.#rTool);
        this.#sToolObject = createToolObject('STool', this.#sTool);

        // 工具根对象只挂**当前**工具：未激活的工具不参与渲染，也不会注册全局鼠标事件
        // （旧实现同样只在 `currentTool` setter 里 `addChild` 当前工具）
        const r_mrsToolObject = reactive(this.#mrsToolObject);
        if (!r_mrsToolObject.children) (this.#mrsToolObject as { children: Object3D[] }).children = [];

        // 默认激活位移工具
        this.currentTool = this.#mToolObject;

        globalEmitter.on('editor.selectedObjectsChanged', this.onSelectedObject3DChange, this);
        globalEmitter.on('editor.toolTypeChanged', this.onToolTypeChange, this);
    }

    override dispose(): void
    {
        this.currentTool = null;
        this.#mrsToolObject = null;
        this.#mToolObject = null;
        this.#rToolObject = null;
        this.#sToolObject = null;
        this.#mTool = null;
        this.#rTool = null;
        this.#sTool = null;

        globalEmitter.off('editor.selectedObjectsChanged', this.onSelectedObject3DChange, this);
        globalEmitter.off('editor.toolTypeChanged', this.onToolTypeChange, this);

        super.dispose();
    }

    /** 相机变化时把新相机分发给三个工具（下一帧写入） */
    private invalidate(): void
    {
        ticker.nextframe(this.update, this);
    }

    private update(): void
    {
        const editorCamera = this.#data.editorCamera;
        for (const tool of [this.#mTool, this.#rTool, this.#sTool])
        {
            if (tool) reactive(tool).editorCamera = editorCamera;
        }
    }

    /** 选中对象变化：有选中则显示 gizmo，否则隐藏 */
    private onSelectedObject3DChange(): void
    {
        // 主仓 `Object3D` 已无 `hideFlags` 字段，旧过滤条件 `!(v.hideFlags & HideFlags.DontTransform)`
        // 无法表达，这里直接取全部选中对象
        const objects = EditorData.editorData.selectedObject3Ds;
        const host = this.entity as Object3D | null;
        const mrsToolObject = this.#mrsToolObject;
        if (!host || !mrsToolObject) return;

        const r_host = reactive(host);
        if (!r_host.children) (host as { children: Object3D[] }).children = [];
        const index = r_host.children.indexOf(mrsToolObject);

        if (objects.length > 0)
        {
            if (index < 0) r_host.children.push(mrsToolObject);
        }
        else if (index >= 0)
        {
            r_host.children.splice(index, 1);
        }
    }

    private onToolTypeChange(): void
    {
        switch (EditorData.editorData.toolType)
        {
            case MRSToolType.MOVE:
                this.currentTool = this.#mToolObject;
                break;
            case MRSToolType.ROTATION:
                this.currentTool = this.#rToolObject;
                break;
            case MRSToolType.SCALE:
                this.currentTool = this.#sToolObject;
                break;
        }
    }

    private get currentTool(): Object3D | null
    {
        return this.#currentTool;
    }

    /**
     * 切换当前工具：未激活的工具对象从工具根对象上摘除，当前工具挂上去。
     *
     * 摘除后其 Logic 的「离开场景」逻辑会反注册全局鼠标事件，因此只有当前工具参与渲染
     * 与响应拖拽（等效旧实现 `this._currentTool.object3D.remove()` / `addChild(...)`）。
     */
    private set currentTool(value: Object3D | null)
    {
        if (this.#currentTool === value) return;

        const mrsToolObject = this.#mrsToolObject;
        if (!mrsToolObject) return;

        const r_mrsToolObject = reactive(mrsToolObject);
        if (!r_mrsToolObject.children) (mrsToolObject as { children: Object3D[] }).children = [];

        // 摘除旧工具
        const previous = this.#currentTool;
        const previousIndex = previous ? r_mrsToolObject.children.indexOf(previous) : -1;
        if (previousIndex >= 0) r_mrsToolObject.children.splice(previousIndex, 1);

        this.#currentTool = value;

        // 挂载新工具
        if (value && r_mrsToolObject.children.indexOf(value) < 0) r_mrsToolObject.children.push(value);
    }
}

/** 用组件数据创建工具对象（旧实现 `new Object3D().addComponent(XxxTool)`） */
function createToolObject(name: string, component: MTool | RTool | STool): Object3D
{
    return { __type__: 'Object3D', name, components: [component] };
}
