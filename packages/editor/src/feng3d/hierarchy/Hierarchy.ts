import { globalEmitter, watcher, logic as getLogic } from 'feng3d';
import type { Object3D, Object3DAsset } from 'feng3d';
import { EditorData } from '../../global/EditorData';
import { HierarchyNode } from './HierarchyNode';

// 全局事件声明合并：`MixinsGlobalEvents` 是主仓开放的空接口（`packages/feng3d/src/MixinsGlobalEvents.ts`），
// 旧的 `'editor.selectedObjectsChanged'` 事件名在迁移中丢失，此处按主仓既有机制显式补回，
// 避免在类型检查中退化为「未声明的事件名」。
declare global
{
    export interface MixinsGlobalEvents
    {
        /** 编辑器选中对象发生变化 */
        'editor.selectedObjectsChanged': unknown;
    }
}

/**
 * 层级树。
 *
 * **P0 阶段（编辑器启动解阻塞）说明**：
 * 本类不继承组件基类，模块加载不会崩，但旧实现依赖两项已变更的能力，P0 先摘除其副作用：
 * - `rootObject3D` 变化时用 `Object3D.on/off('addChild' | 'removeChild')` 监听层级变化
 *   —— 主仓纯数据 `Object3D` **无字符串事件系统**，必须改为 `effect()` 响应式（P1，见下方 TODO）；
 * - `addUI` 依赖已删除的 `Transform2D` / `Canvas` 与 `Object3D.createPrimitive`，整体暂缓；
 * - `object3D.hideFlags & HideFlags.HideInHierarchy` 的隐藏机制无替代（主仓 `Object3D` 无该字段）。
 *
 * 注意：本文件在模块末尾以单例形式实例化（`export const hierarchy = new Hierarchy()`），
 * 因此构造函数内**不允许**再出现任何依赖已删除 API 的调用——否则模块加载即崩。
 */
export class Hierarchy
{
    /** 根节点（由 `rootObject3D` 变化时构建） */
    rootnode: HierarchyNode | null = null;

    /** 根对象（由编辑器注入 gameScene.object3D） */
    rootObject3D: Object3D | null = null;

    /** 上一次的选中集合（用于取消旧结点选中态） */
    private readonly _selectedObject3Ds: Object3D[] = [];

    /** 结点映射（实例持有，避免模块级副作用，见根规范 R2） */
    private readonly nodeMap = new Map<Object3D, HierarchyNode>();

    constructor()
    {
        globalEmitter.on('editor.selectedObjectsChanged', this.onSelectedObject3DChanged, this);
        watcher.watch(this as Hierarchy, 'rootObject3D', this.rootObject3DChanged, this);
    }

    /**
     * 获取选中结点
     */
    getSelectedNode(): HierarchyNode | null
    {
        const node = EditorData.editorData.selectedObject3Ds.reduce<HierarchyNode | null>((pv, cv) =>
        {
            pv = pv || this.getNode(cv);

            return pv;
        }, null);

        return node;
    }

    /**
     * 获取结点
     *
     * @param object3D 游戏对象
     */
    getNode(object3D: Object3D): HierarchyNode | undefined
    {
        const node = this.nodeMap.get(object3D);

        return node;
    }

    /**
     * 删除结点
     *
     * @param object3D 游戏对象
     */
    delete(object3D: Object3D): void
    {
        const node = this.nodeMap.get(object3D);
        if (node)
        {
            node.destroy();
            this.nodeMap.delete(object3D);
        }
    }

    /**
     * 添加游戏对象到层级树。
     *
     * TODO(P1 API 迁移)：旧实现在此处把对象挂到选中结点（或根结点）之下，依赖已移除的
     * 命令式 API `selectedNode.object3D.addChild(object3D)`。新范式为纯数据父子关系：
     * `reactive(parentObject3D).children.push(object3D)`（父级关系由 `ContainerLogic` 的
     * effect 自动维护）。UI 对象分支依赖已删除的 `Transform2D`，需重建判别方式。
     *
     * @param _object3D 游戏对象
     */
    addObject3D(_object3D: Object3D): void
    {
        // TODO(P1 API 迁移)：
        // if (object3D.getComponent(Transform2D)) { this.addUI(object3D); return; }
        // const selectedNode = this.getSelectedNode();
        // if (selectedNode) reactive(selectedNode.object3D).children.push(object3D);
        // else reactive(this.rootnode.object3D).children.push(object3D);
        // EditorData.editorData.selectObject(object3D);
    }

    /**
     * 添加 UI 对象。
     *
     * TODO(P1 API 迁移)：整体依赖已移除的 `Transform2D` / `Canvas`（UI 子系统已从主仓删除）
     * 与 `Object3D.createPrimitive`，待 UI 对象体系重建后恢复。
     *
     * 旧实现（仅存档，勿直接恢复）：
     * addUI(object3D: Object3D)
     * {
     *     const selectedNode = this.getSelectedNode();
     *     if (selectedNode && selectedNode.object3D.getComponent(Transform2D))
     *     { selectedNode.object3D.addChild(object3D); }
     *     else
     *     {
     *         let canvas = this.rootnode.object3D.getComponentsInChildren(Canvas)[0];
     *         if (!canvas)
     *         {
     *             canvas = Object3D.createPrimitive('Canvas').getComponent(Canvas);
     *             this.rootnode.object3D.addChild(canvas.object3D);
     *         }
     *         canvas.object3D.addChild(object3D);
     *     }
     *     EditorData.editorData.selectObject(object3D);
     * }
     */
    addUI(): void
    {
        // TODO(P1 API 迁移)：见方法注释。
    }

    /**
     * 从资源添加游戏对象到层级树。
     *
     * TODO(P1 API 迁移)：旧实现用 `parent.addChild(object3D)` / `this.rootnode.object3D.addChild(object3D)`
     * 挂载，改为 `reactive(parent).children.push(object3D)`。
     *
     * @param object3DAsset 游戏对象资源
     */
    async addGameoObjectFromAsset(object3DAsset: Object3DAsset): Promise<Object3D>
    {
        const object3D = await object3DAsset.getAssetData();

        // TODO(P1 API 迁移)：旧实现用 `parent.addChild(object3D)` /
        // `this.rootnode.object3D.addChild(object3D)` 挂载，改为
        // `reactive(parent).children.push(object3D)`（父级关系由 ContainerLogic 的 effect 维护）；
        // 其后调用 `EditorData.editorData.selectObject(object3D)` 选中新对象。
        void object3D;

        return object3D;
    }

    /**
     * 根对象变化的回调（由 `watcher.watch` 触发）。
     *
     * TODO(P1 API 迁移)：`on/off('addChild' | 'removeChild')` 字符串事件已随纯数据 Object3D 移除。
     * 迁移方向：在 `effect` 中响应式遍历 `reactive(rootObject3D).children`（可追踪增删），
     * 对照 `packages/feng3d/src/scene/Scene.ts` 的 `collectComponentsInChildren` 写法。
     *
     * @param newValue 新根对象
     * @param oldValue 旧根对象
     */
    private rootObject3DChanged(newValue: Object3D | null, oldValue: Object3D | null): void
    {
        // TODO(P1 API 迁移)：解除旧根的层级监听
        // if (oldValue) { oldValue.off('addChild', this.onobject3Dadded, this); oldValue.off('removeChild', this.onobject3Dremoved, this); }
        void oldValue;

        if (newValue)
        {
            this.init(newValue);
            // TODO(P1 API 迁移)：注册新根的层级监听（改为 effect）
            // newValue.on('addChild', this.onobject3Dadded, this);
            // newValue.on('removeChild', this.onobject3Dremoved, this);
        }
    }

    /**
     * 选中对象变化回调（监听全局 `'editor.selectedObjectsChanged'`）。
     */
    private onSelectedObject3DChanged(): void
    {
        this._selectedObject3Ds.forEach((element) =>
        {
            const node = this.getNode(element);
            if (node)
            {
                node.selected = false;
            }
            else
            {
                console.warn(`为什么为空，是否被允许？`);
            }
        });
        const selectedObject3Ds = EditorData.editorData.selectedObject3Ds;
        this._selectedObject3Ds.length = 0;
        this._selectedObject3Ds.push(...selectedObject3Ds);
        this._selectedObject3Ds.forEach((element) =>
        {
            const node = this.getNode(element);
            if (node) node.selected = true;
        });
    }

    // ---------------------------------------------------------------------
    // 旧实现存档（P1 按新范式重写）：字符串事件回调。
    //
    // private onobject3Dadded(event: IEvent<{ parent: Object3D; child: Object3D; }>)
    // { this.add(event.data.child); }
    //
    // private onobject3Dremoved(event: IEvent<{ parent: Object3D; child: Object3D; }>)
    // { const node = this.nodeMap.get(event.data.child); this.remove(node); }
    // ---------------------------------------------------------------------

    /**
     * 构建层级树（从根对象递归建立结点）。
     *
     * @param object3D 根对象
     */
    private init(object3D: Object3D): void
    {
        if (this.rootnode)
        { this.rootnode.destroy(); }

        this.nodeMap.clear();

        const node = new HierarchyNode({ object3D });
        this.nodeMap.set(object3D, node);
        node.isOpen = true;

        this.rootnode = node;
        for (const child of object3D.children ?? [])
        {
            this.add(child);
        }
    }

    /**
     * 添加单个对象及其子树到结点映射。
     *
     * TODO(P1 API 迁移)：`object3D.hideFlags & HideFlags.HideInHierarchy` 的隐藏机制无替代
     * （主仓 `Object3D` 无 `hideFlags` 字段，`HideFlags` 枚举成为孤儿导出），先移除该判断。
     *
     * @param object3D 游戏对象
     */
    private add(object3D: Object3D): HierarchyNode | undefined
    {
        let node = this.nodeMap.get(object3D);
        if (node)
        {
            node.remove();
        }
        // 父级经 Object3DLogic 获取（纯数据接口无 `parent` 字段，只读 getter 在 logic 上）
        const parent = getLogic(object3D).parent;
        const parentnode = parent ? this.nodeMap.get(parent) : undefined;
        if (parentnode)
        {
            if (!node)
            {
                node = new HierarchyNode({ object3D });
                this.nodeMap.set(object3D, node);
            }
            parentnode.addChild(node);
        }
        for (const child of object3D.children ?? [])
        {
            this.add(child);
        }

        return node;
    }

    /**
     * 递归移除结点。
     *
     * @param node 结点
     */
    private remove(node: HierarchyNode | undefined): void
    {
        if (!node) return;
        node.children.forEach((element) =>
        {
            this.remove(element as HierarchyNode);
        });
        node.remove();
    }
}

// TODO(P1 API 迁移)：构造期副作用需按 R2 收敛——`globalEmitter.on` 与 `watcher.watch`
// 建议改为首个消费点触发的 lazy-init（`let hierarchy = null; export function getHierarchy()`），
// 当前保留单例导出以兼容全部既有消费点（Drag / CommonConfig / HierarchyNode / Vue 层）。
export const hierarchy: Hierarchy = new Hierarchy();
