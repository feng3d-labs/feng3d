import { EventEmitter, IEvent } from 'feng3d';

/**
 * 树节点事件映射
 */
export interface TreeNodeMap
{
    /**
     * 添加子节点
     */
    added: { node: TreeNode };
    /**
     * 移除子节点
     */
    removed: { node: TreeNode };
    /**
     * 打开状态改变
     */
    openChanged: { isOpen: boolean };
}

/**
 * 树节点基类
 * 提供基础的树节点功能
 */
export class TreeNode<T extends TreeNodeMap = TreeNodeMap>
{
    /**
     * 显示标签
     */
    label: string = '';

    /**
     * 是否打开
     */
    isOpen: boolean = false;

    /**
     * 父节点
     */
    parent: TreeNode = null;

    /**
     * 子节点列表
     */
    children: TreeNode[] = [];

    /**
     * 是否选中
     */
    selected: boolean = false;

    /**
     * 事件发射器
     */
    private _eventEmitter: EventEmitter<T>;

    constructor(obj?: any)
    {
        this._eventEmitter = EventEmitter.getOrCreateEventEmitter(this);
        if (obj)
        {
            Object.assign(this, obj);
        }
    }

    /**
     * 监听事件
     */
    on<K extends keyof T & string>(type: K, listener: (event: IEvent<T[K]>) => void, thisObject?: any, priority?: number): this
    {
        this._eventEmitter.on(type, listener, thisObject, priority);
        return this;
    }

    /**
     * 取消监听事件
     */
    off<K extends keyof T & string>(type: K, listener: (event: IEvent<T[K]>) => void, thisObject?: any): this
    {
        this._eventEmitter.off(type, listener, thisObject);
        return this;
    }

    /**
     * 发射事件
     */
    emit<K extends keyof T & string>(type: K, data?: T[K], bubbles?: boolean, broadcast?: boolean, share?: boolean): IEvent<T[K]>
    {
        return this._eventEmitter.emit(type, data, bubbles, broadcast, share);
    }

    /**
     * 添加子节点
     */
    addChild(node: TreeNode)
    {
        if (node.parent)
        {
            node.parent.removeChild(node);
        }
        this.children.push(node);
        node.parent = this;
        this.emit('added', { node } as any);
    }

    /**
     * 移除子节点
     */
    removeChild(node: TreeNode)
    {
        const index = this.children.indexOf(node);
        if (index !== -1)
        {
            this.children.splice(index, 1);
            node.parent = null;
            this.emit('removed', { node } as any);
        }
    }

    /**
     * 移除自身
     */
    remove()
    {
        if (this.parent)
        {
            this.parent.removeChild(this);
        }
    }

    /**
     * 打开所有父节点
     */
    openParents()
    {
        let node: TreeNode = this.parent;
        while (node)
        {
            node.isOpen = true;
            node.emit('openChanged', { isOpen: true } as any);
            node = node.parent;
        }
    }

    /**
     * 检查是否包含指定节点
     */
    contain(node: TreeNode): boolean
    {
        let current: TreeNode = node;
        while (current)
        {
            if (current === this)
            {
                return true;
            }
            current = current.parent;
        }

        return false;
    }

    /**
     * 销毁
     */
    destroy()
    {
        // 移除所有子节点
        const children = this.children.concat();
        children.forEach((child) => child.destroy());

        // 从父节点移除
        if (this.parent)
        {
            this.parent.removeChild(this);
        }

        // 清理引用
        this.children = [];
        this.parent = null;
    }
}
