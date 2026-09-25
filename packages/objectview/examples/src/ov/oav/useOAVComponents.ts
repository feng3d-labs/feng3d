import { ref, onMounted, reactive } from 'vue';

/**
 * OAVComponents 组件的 Props 类型
 */
export interface OAVComponentsProps
{
    /** 属性名称 */
    name: string;
    /** 属性所有者对象 */
    owner: Record<string, unknown>;
    /** 是否可编辑 */
    editable: boolean;
}

/**
 * 组件项信息
 */
export interface ComponentItem
{
    /** 组件名称 */
    name: string;
    /** 组件图标 */
    icon: string;
    /** 是否折叠 */
    collapsed: boolean;
    /** 原始组件对象 */
    component: object;
}

/**
 * OAVComponents 组合式函数
 *
 * 显示组件数组，每个组件使用 ObjectView 渲染
 */
export function useOAVComponents(props: OAVComponentsProps)
{
    const r_owner = reactive(props.owner);
    const r_componentItems = ref<ComponentItem[]>([]);

    onMounted(() =>
    {
        // 获取组件数组
        const components = r_owner[props.name] as object[];
        if (!Array.isArray(components)) return;

        // 初始化组件项信息
        r_componentItems.value = components.map((component) => ({
            name: component.constructor.name,
            icon: getBlockIcon(component.constructor.name),
            collapsed: false,
            component,
        }));
    });

    /**
     * 切换折叠状态
     */
    function toggleCollapse(index: number)
    {
        r_componentItems.value[index].collapsed = !r_componentItems.value[index].collapsed;
    }

    return {
        r_componentItems,
        toggleCollapse,
    };
}

/**
 * 根据块名称获取图标
 */
function getBlockIcon(name: string): string
{
    const iconMap: Record<string, string> = {
        Transform: 'transform',
        Water: 'water_drop',
    };
    return iconMap[name] || 'settings';
}
