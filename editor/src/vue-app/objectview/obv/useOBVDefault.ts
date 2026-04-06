import { computed, ref } from 'vue';

/**
 * OBVDefault 组件的 Props 类型
 */
export interface OBVDefaultProps
{
    /** 块名称 */
    name: string;
    /** 属性列表 */
    itemList: any[];
    /** 所有者对象 */
    owner?: any;
    /** 块视图信息 */
    blockViewInfo?: any;
}

/**
 * OBVDefault 组合式函数
 */
export function useOBVDefault(props: OBVDefaultProps)
{
    // 是否展开（默认展开）
    const isExpanded = ref(true);

    // 是否显示标题（有名称时显示）
    const showTitle = computed(() => {
        return props.name && props.name.length > 0;
    });

    // 切换展开/折叠
    function toggleExpanded()
    {
        isExpanded.value = !isExpanded.value;
    }

    return {
        isExpanded,
        toggleExpanded,
        showTitle,
    };
}
