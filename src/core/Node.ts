namespace feng3d
{
    export interface ComponentEventMap extends NodeEventMap { }

    export interface NodeEventMap
    {
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        addChild: { parent: Node, child: Node }

        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        removeChild: { parent: Node, child: Node };

        /**
         * 自身被添加到父对象中事件
         */
        added: { parent: Node };

        /**
         * 自身从父对象中移除事件
         */
        removed: { parent: Node };

        /**
         * 当GameObject的scene属性被设置是由Scene派发
         */
        addedToScene: Node;

        /**
         * 当GameObject的scene属性被清空时由Scene派发
         */
        removedFromScene: Node;
    }

    export class Node<T extends ComponentEventMap = ComponentEventMap> extends Component<T>
    {

    }
}