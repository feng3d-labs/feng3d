import { EventEmitter } from 'feng3d';
// IEvent / IEventTarget 是纯类型（interface），运行时不存在，必须用 import type 以免 ESM 链接期报错
import type { IEvent, IEventTarget } from 'feng3d';

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
 *
 * 实现 `IEventTarget`：事件系统的 `EventEmitter.getOrCreateEventEmitter(target)`
 * 要求入参满足该契约。此接口的成员全部可选，但 `TreeNode` 原本与之**没有任何共同属性**，
 * 会触发 TS 的弱类型检查报错（Type 'TreeNode' has no properties in common with 'IEventTarget'）。
 * 因此显式实现冒泡/广播目标，同时这也正是树形事件分发应有的语义。
 */
export class TreeNode<T extends TreeNodeMap = TreeNodeMap> implements IEventTarget
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
     * 事件冒泡目标：父节点（没有父节点则不冒泡）。
     */
    getBubbleTargets(): IEventTarget[]
    {
        return this.parent ? [this.parent] : [];
    }

    /**
     * 事件广播目标：全部子节点。
     */
    getBroadcastTargets(): IEventTarget[]
    {
        return this.children;
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
