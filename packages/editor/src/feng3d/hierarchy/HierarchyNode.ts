import { GameObject, gPartial, watcher } from 'feng3d';
import { TreeNode } from '../../ui/components/TreeNode';
import { DragData } from '../../ui/drag/Drag';
import { hierarchy } from './Hierarchy';

export class HierarchyNode extends TreeNode
{
    isOpen = false;

    /**
     * 游戏对象
     */
    gameobject: GameObject;
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

        watcher.watch(this.gameobject, 'name', this.update, this);

        this.update();
    }

    /**
     * 提供拖拽数据
     *
     * @param dragSource
     */
    setdargSource(dragSource: DragData)
    {
        dragSource.addDragData('gameobject', this.gameobject);
    }

    /**
     * 接受拖拽数据
     *
     * @param dragdata
     */
    acceptDragDrop(dragdata: DragData)
    {
        dragdata.getDragData('gameobject').forEach((v) =>
        {
            if (!v.contains(this.gameobject))
            {
                const localToWorldMatrix = v.transform.localToWorldMatrix;
                this.gameobject.addChild(v);
                v.transform.localToWorldMatrix = localToWorldMatrix;
                //
                hierarchy.getNode(v).openParents();
            }
        });
        dragdata.getDragData('file_gameobject').forEach(async (v) =>
        {
            const gameobject = await hierarchy.addGameoObjectFromAsset(v, this.gameobject);
            hierarchy.getNode(gameobject).openParents();
        });
        dragdata.getDragData('file_script').forEach((v) =>
        {
            this.gameobject.addScript(v.scriptName);
        });
    }

    /**
     * 销毁
     */
    destroy()
    {
        watcher.unwatch(this.gameobject, 'name', this.update, this);

        this.gameobject = null;
        super.destroy();
    }

    private update()
    {
        this.label = this.gameobject.name;
    }
}
