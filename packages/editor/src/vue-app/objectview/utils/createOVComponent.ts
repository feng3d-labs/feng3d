import { OVComponent, type ObjectViewInfo } from 'feng3d';
import { createVNode, render, type Component } from 'vue';

/**
 * Props 提取器类型
 */
type PropsExtractor = (info: ObjectViewInfo) => Record<string, unknown>;

/**
 * 默认的 Props 提取器
 */
const defaultPropsExtractor: PropsExtractor = (info) => ({
    objectBlockInfos: info.objectBlockInfos,
    owner: info.owner,
    objectViewInfo: info,
});

/**
 * OV 组件类接口
 */
export interface OVComponentClass
{
    new(objectViewInfo: ObjectViewInfo): {
        dom: HTMLElement;
        objectViewInfo: ObjectViewInfo;
        destroy(): void;
    };
}

/**
 * 创建 OV 组件包装类的工厂函数
 *
 * 使用 Vue 组件 + createVNode + render 方式渲染，
 * 避免 createApp 的开销，保持高性能
 *
 * @param componentName 组件名称，用于 objectview 注册
 * @param VueComponent Vue 组件
 * @param propsExtractor 可选的 Props 提取器，用于从 ObjectViewInfo 提取组件所需的 props
 */
export function createOVComponent(
    componentName: string,
    VueComponent: Component,
    propsExtractor: PropsExtractor = defaultPropsExtractor
): OVComponentClass
{
    // 创建类
    const ComponentClass = class
    {
        /** DOM 元素 */
        dom: HTMLElement;

        /** 视图信息 */
        objectViewInfo: ObjectViewInfo;

        constructor(objectViewInfo: ObjectViewInfo)
        {
            this.objectViewInfo = objectViewInfo;

            // 创建容器元素
            this.dom = document.createElement('div');
            this.dom.className = 'ov-default';

            // 提取 props 并渲染
            const props = propsExtractor(objectViewInfo);
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
    OVComponent()(ComponentClass);

    return ComponentClass;
}
