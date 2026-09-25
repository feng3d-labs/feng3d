import { Object3D, gPartial, logic, watcher } from 'feng3d';
import { TreeNode } from '../../ui/components/TreeNode';
import { DragData } from '../../ui/drag/Drag';
import { hierarchy } from './Hierarchy';

export class HierarchyNode extends TreeNode
{
    isOpen = false;

    /**
     * 游戏对象
     */
    object3D: Object3D;
    /**
     * 父结点
     */
    parent: HierarchyNode = null;
    /**
     * 子结点列表
     */
    children: HierarchyNode[] = [];

    constructor(obj: gPartial<HierarchyNode>)
    {
        super(obj);
        this.object3D = obj.object3D as any as Object3D;

        watcher.watch(this.object3D, 'name', this.update, this);

        this.update();
    }

    /**
     * 提供拖拽数据
     *
     * @param dragSource
     */
    setdargSource(dragSource: DragData)
    {
        dragSource.addDragData('object3D', this.object3D);
    }

    /**
     * 接受拖拽数据
     *
     * @param dragdata
     */
    acceptDragDrop(dragdata: DragData)
    {
        dragdata.getDragData('object3D').forEach((v) =>
        {
            if (!v.contains(this.object3D))
            {
                const localToWorldMatrix = logic(v.transform).local2world.value.clone();
                this.object3D.addChild(v);
                logic(v.transform).setLocal2world(localToWorldMatrix);
                //
                hierarchy.getNode(v).openParents();
            }
        });
        dragdata.getDragData('file_object3D').forEach(async (v) =>
        {
            const object3D = await hierarchy.addGameoObjectFromAsset(v, this.object3D);
            hierarchy.getNode(object3D).openParents();
        });
        dragdata.getDragData('file_script').forEach((v) =>
        {
            this.object3D.addScript(v.scriptName);
        });
    }

    /**
     * 销毁
     */
    destroy()
    {
        watcher.unwatch(this.object3D, 'name', this.update, this);

        this.object3D = null;
        super.destroy();
    }

    private update()
    {
        this.label = this.object3D.name;
    }
}
