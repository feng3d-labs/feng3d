import { objectview, type BlockViewInfo } from 'feng3d';
import { onMounted, onUnmounted, ref } from 'vue';

/**
 * ObjectBlockView 组件的 Props 类型
 */
export interface ObjectBlockViewProps
{
    /** 块视图信息 */
    blockInfo: BlockViewInfo;
}

/**
 * ObjectBlockView 组合式函数
 *
 * 使用 objectview 库获取块视图并挂载到 DOM
 */
export function useObjectBlockView(props: ObjectBlockViewProps)
{
    const containerRef = ref<HTMLElement | null>(null);
    let view: { dom?: HTMLElement; destroy?: () => void } | null = null;

    onMounted(() =>
    {
        if (!containerRef.value || !props.blockInfo) return;

        // 使用 objectview.getBlockView 获取块视图
        view = objectview.getBlockView(props.blockInfo) as { dom?: HTMLElement; destroy?: () => void };

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

