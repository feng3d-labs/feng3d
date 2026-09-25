import { watcher } from 'feng3d';
import type { Object3D } from 'feng3d';
import { TreeNode } from '../../ui/components/TreeNode';
import { DragData } from '../../ui/drag/Drag';
import { hierarchy } from './Hierarchy';

/**
 * 层级树结点初始化数据。
 *
 * 旧写法用 `gPartial<HierarchyNode>`（深层递归映射类型）承载入参，在 `TreeNode`
 * 自引用（`parent` / `children`）下会触发 TS2589「类型实例化过深」；这里改为显式列出
 * 实际需要的字段（`object3D` 与可选 `label`），语义等价且类型可判定。
 */
export interface HierarchyNodeInit
{
    /** 游戏对象 */
    object3D: Object3D;
    /** 结点显示标签 */
    label?: string;
}

/**
 * 层级树结点。
 *
 * `TreeNode` 是编辑器自有的传统 UI 类（非主仓组件），因此本文件不涉及组件范式迁移；
 * P0 只做两件事：
 * 1. 摘除依赖已删除 API 的副作用（`logic(object3D.transform)` / `Object3D.addChild` /
 *    `Object3D.addScript` / 拖拽挂载），整体注释并标注 TODO(P1 API 迁移)；
 * 2. 消除旧写法里的 `as any` 断言（约束禁止 `any`），改用 `TreeNode` 基类的
 *    `Object.assign` 赋值路径承接 `gPartial<HierarchyNode>` 的 `object3D` 字段。
 */
export class HierarchyNode extends TreeNode
{
    isOpen = false;

    /**
     * 游戏对象（销毁后置空）
     */
    object3D: Object3D | null = null;
    /**
     * 父结点
     */
    parent: HierarchyNode = null;
    /**
     * 子结点列表
     */
    children: HierarchyNode[] = [];

    /**
     * @param obj 结点初始化数据（至少包含 `object3D`）
     */
    constructor(obj: HierarchyNodeInit)
    {
        // `TreeNode` 基类构造内含 `Object.assign(this, obj)`，`object3D` 字段由该路径写入
        super(obj);

        const object3D = this.object3D;
        if (object3D)
        {
            watcher.watch(object3D, 'name', this.update, this);
        }

        this.update();
    }

    /**
     * 提供拖拽数据
     *
     * @param dragSource 拖拽数据
     */
    setdargSource(dragSource: DragData): void
    {
        if (this.object3D) dragSource.addDragData('object3D', this.object3D);
    }

    /**
     * 接受拖拽数据。
     *
     * TODO(P1 API 迁移)：旧实现用 `logic(v.transform).local2world.value.clone()` 保持世界变换、
     * `this.object3D.addChild(v)` 挂载、`logic(v.transform).setLocal2world(...)` 回写。
     * 主仓已无独立 `Transform` 对象（`transform` 字段移除），且命令式 `addChild` / `setLocal2world`
     * 均不存在，替代路径为：
     * - 取矩阵：`logic(v).local2world`
     * - 挂载：`reactive(this.object3D).children.push(v)`
     * - 回写：`Matrix4x4.transformVector3` 组合（原 `Transform.setLocal2world` 无替代，
     *   见 docs/API_MIGRATION.md §3.8 与 `src/scripts/iconUtils.ts` 的 `setWorldMatrix`）
     * - `this.object3D.addScript(scriptName)` 无替代（脚本挂载方式变更）
     *
     * @param dragdata 拖拽数据
     */
    acceptDragDrop(dragdata: DragData): void
    {
        // TODO(P1 API 迁移)：恢复如下语义（新范式写法见方法注释）——
        // dragdata.getDragData('object3D').forEach((v) =>
        // {
        //     if (!v.contains(this.object3D))
        //     {
        //         const localToWorldMatrix = getLogic(v).local2world.clone();
        //         reactive(this.object3D).children.push(v);
        //         /* 回写世界矩阵：Matrix4x4.transformVector3 组合（TODO） */
        //         hierarchy.getNode(v)?.openParents();
        //     }
        // });
        // dragdata.getDragData('file_object3D').forEach(async (v) =>
        // {
        //     const object3D = await hierarchy.addGameoObjectFromAsset(v);
        //     hierarchy.getNode(object3D)?.openParents();
        // });
        // dragdata.getDragData('file_script').forEach((v) => { /* this.object3D.addScript(v.scriptName) 已移除 */ });
        void dragdata;
    }

    /**
     * 销毁
     */
    destroy(): void
    {
        if (this.object3D)
        {
            watcher.unwatch(this.object3D, 'name', this.update, this);
        }

        this.object3D = null;
        super.destroy();
    }

    /**
     * 刷新结点显示（跟随对象名变化）。
     */
    private update(): void
    {
        this.label = this.object3D?.name ?? 'Object3D';
    }
}
