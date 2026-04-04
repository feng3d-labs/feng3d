import type { AttributeViewInfo } from '@feng3d/objectview';
import { ref, computed } from 'vue';

/**
 * OBVDefault 组件的 Props 类型
 */
export interface OBVDefaultProps
{
    /** 块名称 */
    name: string;
    /** 属性列表 */
    itemList: AttributeViewInfo[];
}

/**
 * OBVDefault 组合式函数
 */
export function useOBVDefault(props: OBVDefaultProps)
{
    const r_collapsed = ref(false);

    // 是否显示块头部
    const showHeader = computed(() => props.name && props.name.length > 0);

    // 折叠图标
    const collapseIcon = computed(() => r_collapsed.value ? 'chevron_right' : 'expand_more');

    // 块图标
    const blockIcon = computed(() => getBlockIcon(props.name));

    // 头部点击处理
    function onHeaderClick(e: MouseEvent)
    {
        if ((e.target as HTMLElement).closest('.block-menu')) return;
        r_collapsed.value = !r_collapsed.value;
    }

    return {
        r_collapsed,
        showHeader,
        collapseIcon,
        blockIcon,
        onHeaderClick,
    };
}

/**
 * 根据块名称获取图标
 */
function getBlockIcon(name: string): string
{
    const n = (name || '').toLowerCase();
    if (n.includes('transform')) return 'transform';
    if (n.includes('material')) return 'texture';
    if (n.includes('mesh') || n.includes('geometry')) return 'deployed_code';
    if (n.includes('light')) return 'light_mode';
    if (n.includes('camera')) return 'videocam';
    if (n.includes('water')) return 'water_drop';
    return 'settings';
}

