import { OAVComponent } from 'feng3d';
import type { AttributeViewInfo } from 'feng3d';
import { createVNode, render, type Component } from 'vue';
import { createWriteBridge } from './createWriteBridge';

/**
 * Props 提取器类型
 */
type PropsExtractor = (info: AttributeViewInfo) => Record<string, unknown>;

/**
 * 默认的 Props 提取器
 */
const defaultPropsExtractor: PropsExtractor = (info) => ({
    name: info.name,
    owner: info.owner,
    editable: info.editable,
    attributeViewInfo: info,
});

/**
 * OAV 组件类接口
 */
export interface OAVComponentClass
{
    new(attributeViewInfo: AttributeViewInfo): {
        dom: HTMLElement;
        attributeViewInfo: AttributeViewInfo;
        destroy(): void;
    };
}

/**
 * 创建 OAV 组件包装类的工厂函数
 *
 * 使用 Vue 组件 + createVNode + render 方式渲染，
 * 避免 createApp 的开销，保持高性能
 *
 * @param componentName 组件名称，用于 objectview 注册
 * @param VueComponent Vue 组件
 * @param propsExtractor 可选的 Props 提取器，用于从 AttributeViewInfo 提取组件所需的 props
 */
export function createOAVComponent(
    componentName: string,
    VueComponent: Component,
    propsExtractor: PropsExtractor = defaultPropsExtractor
): OAVComponentClass
{
    // 创建类
    const ComponentClass = class
    {
        /** DOM 元素 */
        dom: HTMLElement;

        /** 属性信息 */
        attributeViewInfo: AttributeViewInfo;

        constructor(attributeViewInfo: AttributeViewInfo)
        {
            this.attributeViewInfo = attributeViewInfo;

            // 创建容器元素
            this.dom = document.createElement('div');

            // 提取 props 并渲染
            const props = propsExtractor(attributeViewInfo);
            // 无论用哪个 props 提取器，owner 都换成写入桥：控件写的是 Vue 的响应式代理，
            // 而引擎用 @feng3d/reactivity，两套依赖表不互通——不换桥就是"数据变了、画面不动"。
            // 放在这里而不是各个提取器里，是为了让所有控件（含自定义提取器的）一并生效，见 §11.3
            if (props.owner !== null && typeof props.owner === 'object')
            {
                props.owner = createWriteBridge(props.owner as object);
            }
            render(createVNode(VueComponent, props), this.dom);
        }

        /**
         * 销毁组件
         */
        destroy()
        {
            render(null, this.dom);
        }
    };

    // 设置类名，用于 objectview 注册
    Object.defineProperty(ComponentClass, 'name', { value: componentName });

    // 应用装饰器注册组件
    OAVComponent()(ComponentClass);

    return ComponentClass;
}
