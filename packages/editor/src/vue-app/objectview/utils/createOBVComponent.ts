import { OBVComponent } from 'feng3d';
import type { BlockViewInfo } from 'feng3d';
import { createVNode, render, type Component } from 'vue';

/**
 * Props 提取器类型
 */
type PropsExtractor = (info: BlockViewInfo) => Record<string, unknown>;

/**
 * 默认的 Props 提取器
 */
const defaultPropsExtractor: PropsExtractor = (info) => ({
    name: info.name,
    itemList: info.itemList,
    owner: info.owner,
    blockViewInfo: info,
});

/**
 * OBV 组件类接口
 */
export interface OBVComponentClass
{
    new(blockViewInfo: BlockViewInfo): {
        dom: HTMLElement;
        blockViewInfo: BlockViewInfo;
        destroy(): void;
    };
}

/**
 * 创建 OBV 组件包装类的工厂函数
 *
 * 使用 Vue 组件 + createVNode + render 方式渲染，
 * 避免 createApp 的开销，保持高性能
 *
 * @param componentName 组件名称，用于 objectview 注册
 * @param VueComponent Vue 组件
 * @param propsExtractor 可选的 Props 提取器，用于从 BlockViewInfo 提取组件所需的 props
 */
export function createOBVComponent(
    componentName: string,
    VueComponent: Component,
    propsExtractor: PropsExtractor = defaultPropsExtractor
): OBVComponentClass
{
    // 创建类
    const ComponentClass = class
    {
        /** DOM 元素 */
        dom: HTMLElement;

        /** 块信息 */
        blockViewInfo: BlockViewInfo;

        constructor(blockViewInfo: BlockViewInfo)
        {
            this.blockViewInfo = blockViewInfo;

            // 创建容器元素
            this.dom = document.createElement('div');
            // 每个块视图的包装层带**自己的**类名。原先硬编码成 `obv-default`：
            // 那会让 OBVInline 之类新块视图的包装层也叫 obv-default，既误导又可能被
            // 针对该名字的选择器误伤（实测：探针按 .obv-default 抓块时多抓出一层）
            this.dom.className = `obv-block obv-block-${componentName.toLowerCase()}`;

            // 提取 props 并渲染
            const props = propsExtractor(blockViewInfo);
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
    OBVComponent()(ComponentClass);

    return ComponentClass;
}
