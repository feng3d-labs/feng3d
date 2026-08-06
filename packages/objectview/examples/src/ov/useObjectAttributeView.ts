import { objectview, type AttributeViewInfo } from '@feng3d/objectview';
import { onMounted, onUnmounted, ref } from 'vue';

/**
 * ObjectAttributeView 组件的 Props 类型
 */
export interface ObjectAttributeViewProps
{
    /** 属性视图信息 */
    attrInfo: AttributeViewInfo;
}

/**
 * ObjectAttributeView 组合式函数
 *
 * 使用 objectview 库获取属性视图并挂载到 DOM
 */
export function useObjectAttributeView(props: ObjectAttributeViewProps)
{
    const containerRef = ref<HTMLElement | null>(null);
    let view: { dom?: HTMLElement; destroy?: () => void } | null = null;

    onMounted(() =>
    {
        if (!containerRef.value || !props.attrInfo) return;

        // 使用 objectview.getAttributeView 获取属性视图
        view = objectview.getAttributeView(props.attrInfo) as { dom?: HTMLElement; destroy?: () => void };

        // 将视图的 DOM 添加到容器
        if (view.dom)
        {
            containerRef.value.appendChild(view.dom);
        }
    });

    onUnmounted(() =>
    {
        // 清理视图
        if (view?.destroy)
        {
            view.destroy();
        }
        view = null;
    });

    return {
        containerRef,
    };
}

