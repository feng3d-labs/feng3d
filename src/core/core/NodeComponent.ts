import { Component } from "../../ecs/Component";
import { Constructor } from "../../polyfill/Types";
import { Node, NodeEventMap } from "./Node";

/**
 * 結點組件
 * 
 * 附加在結點上的組件，處理結點相關的邏輯。
 */
export class NodeComponent<T extends NodeEventMap = NodeEventMap> extends Component<T>
{
    /**
     * 2D节点。
     */
    get node()
    {
        return this._entity as Node;
    }

    /**
     * 使用深度优先搜索返回 Entity 或其任何子项中的 Type 组件。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 是否包含不活跃组件。
     * @returns 匹配类型的组件（如果找到）。
     */
    getComponentInChildren<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        return this.node.getComponentInChildren(type, includeInactive);
    }

    /**
     * 检索 Entity 或其任何父项type中的 Type 组件。
     *
     * 此方法向上递归，直到找到具有匹配组件的 Entity。仅匹配活动游戏对象上的组件。
     *
     * @param type 要查找的组件类型。
     * @param includeInactive 是否包含不活跃组件。
     * @returns 如果找到与类型匹配的组件，则返回一个组件。否则返回 null。
     */
    getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive = false): T
    {
        return this.node.getComponentInParent(type, includeInactive);
    }
    /**
     * 使用深度优先搜索返回 当前实体 或其任何子子项中 Type 的所有组件。递归工作。
     *
     * 在子游戏对象上递归搜索组件。这意味着它还包括目标实体的所有子实体，以及所有后续子实体。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 非活动游戏对象上的组件是否应该包含在搜索结果中？
     * @param results 列出接收找到的组件。
     * @returns 所有找到的组件。
     */
    getComponentsInChildren<T extends Component>(type: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        return this.node.getComponentsInChildren(type, includeInactive, results);
    }

    /**
     * 返回当前实体或其任何父级中指定的所有组件。
     *
     * @param type 要检索的组件类型。
     * @param includeInactive 非活动组件是否应该包含在搜索结果中？
     * @param results 列出找到的组件。
     * @returns 实体或其任何父级中指定的所有组件。
     */
    getComponentsInParent<T extends Component>(type: Constructor<T>, includeInactive = false, results: T[] = []): T[]
    {
        return this.node.getComponentsInParent(type, includeInactive, results);
    }

}