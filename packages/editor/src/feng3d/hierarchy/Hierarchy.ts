import { Canvas, Object3D, Object3DAsset, globalEmitter, HideFlags, IEvent, Transform2D, watcher } from 'feng3d';
import { EditorData } from '../../global/EditorData';
import { HierarchyNode } from './HierarchyNode';

export class Hierarchy
{
    rootnode: HierarchyNode;

    rootObject3D: Object3D;

    constructor()
    {
        globalEmitter.on('editor.selectedObjectsChanged', this.onSelectedObject3DChanged, this);
        watcher.watch(this as Hierarchy, 'rootObject3D', this.rootObject3DChanged, this);
    }

    /**
     * 获取选中结点
     */
    getSelectedNode()
    {
        const node = EditorData.editorData.selectedObject3Ds.reduce((pv: HierarchyNode, cv) =>
        {
            pv = pv || this.getNode(cv);

            return pv;
        }, null);

        return node;
    }

    /**
     * 获取结点
     */
    getNode(object3D: Object3D)
    {
        const node = nodeMap.get(object3D);

        return node;
    }

    delete(object3D: Object3D)
    {
        const node = nodeMap.get(object3D);
        if (node)
        {
            node.destroy();
            nodeMap.delete(object3D);
        }
    }

    /**
     * 添加游戏对象到层级树
     *
     * @param object3D 游戏对象
     */
    addObject3D(object3D: Object3D)
    {
        if (object3D.getComponent(Transform2D))
        {
            this.addUI(object3D);

            return;
        }

        const selectedNode = this.getSelectedNode();
        if (selectedNode)
        { selectedNode.object3D.addChild(object3D); }
        else
        { this.rootnode.object3D.addChild(object3D); }
        EditorData.editorData.selectObject(object3D);
    }

    /**
     * 添加UI
     *
     * @param object3D
     */
    addUI(object3D: Object3D)
    {
        const selectedNode = this.getSelectedNode();
        if (selectedNode && selectedNode.object3D.getComponent(Transform2D))
        {
            selectedNode.object3D.addChild(object3D);
        }
        else
        {
            let canvas = this.rootnode.object3D.getComponentsInChildren(Canvas)[0];
            if (!canvas)
            {
                canvas = Object3D.createPrimitive('Canvas').getComponent(Canvas);
                this.rootnode.object3D.addChild(canvas.object3D);
            }
            canvas.object3D.addChild(object3D);
        }
        EditorData.editorData.selectObject(object3D);
    }

    async addGameoObjectFromAsset(object3DAsset: Object3DAsset, parent?: Object3D)
    {
        const object3D = await object3DAsset.getAssetData();

        console.assert(!object3D.parent);

        if (parent)
        {
            parent.addChild(object3D);
        }
        else
        {
            this.rootnode.object3D.addChild(object3D);
        }
        EditorData.editorData.selectObject(object3D);

        return object3D;
    }

    private _selectedObject3Ds: Object3D[] = [];

    private rootObject3DChanged(newValue: Object3D, oldValue: Object3D)
    {
        if (oldValue)
        {
            oldValue.off('addChild', this.onobject3Dadded, this);
            oldValue.off('removeChild', this.onobject3Dremoved, this);
        }
        if (newValue)
        {
            this.init(newValue);
            newValue.on('addChild', this.onobject3Dadded, this);
            newValue.on('removeChild', this.onobject3Dremoved, this);
        }
    }

    private onSelectedObject3DChanged()
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
        this._selectedObject3Ds = EditorData.editorData.selectedObject3Ds.concat();
        this._selectedObject3Ds.forEach((element) =>
        {
            const node = this.getNode(element);
            node.selected = true;
        });
    }

    private onobject3Dadded(event: IEvent<{ parent: Object3D; child: Object3D; }>)
    {
        this.add(event.data.child);
    }

    private onobject3Dremoved(event: IEvent<{ parent: Object3D; child: Object3D; }>)
    {
        const node = nodeMap.get(event.data.child);
        this.remove(node);
    }

    private init(object3D: Object3D)
    {
        if (this.rootnode)
        { this.rootnode.destroy(); }

        nodeMap.clear();

        const node = new HierarchyNode({ object3D: <any>object3D });
        nodeMap.set(object3D, node);
        node.isOpen = true;

        this.rootnode = node;
        object3D.children.forEach((element) =>
        {
            this.add(element);
        });
    }

    private add(object3D: Object3D)
    {
        if (object3D.hideFlags & HideFlags.HideInHierarchy)
        { return; }
        let node = nodeMap.get(object3D);
        if (node)
        {
            node.remove();
        }
        const parentnode = nodeMap.get(object3D.parent);
        if (parentnode)
        {
            if (!node)
            {
                node = new HierarchyNode({ object3D: <any>object3D });
                nodeMap.set(object3D, node);
            }
            parentnode.addChild(node);
        }
        object3D.children.forEach((element) =>
        {
            this.add(element);
        });

        return node;
    }

    private remove(node: HierarchyNode)
    {
        if (!node) return;
        node.children.forEach((element) =>
        {
            this.remove(element);
        });
        node.remove();
    }
}
const nodeMap = new Map<Object3D, HierarchyNode>();

export const hierarchy: Hierarchy = new Hierarchy();
