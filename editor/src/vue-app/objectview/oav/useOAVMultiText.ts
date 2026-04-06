import { computed, reactive } from 'vue';

/**
 * OAVMultiText 组件的 Props 类型
 */
export interface OAVMultiTextProps
{
    /** 属性名称 */
    name: string;
    /** 属性所有者对象 */
    owner: Record<string, unknown>;
    /** 是否可编辑 */
    editable: boolean;
    /** 属性视图信息 */
    attributeViewInfo?: any;
}

/**
 * OAVMultiText 组合式函数
 */
export function useOAVMultiText(props: OAVMultiTextProps)
{
    // 在组件内部创建响应式对象，仅用于监听和修改
    const r_owner = reactive(props.owner);

    // 格式化标签名
    const label = computed(() => {
        const name = props.attributeViewInfo?.label || props.name;
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    });

    // 文本值（通过响应式对象监听）
    const value = computed(() => String(r_owner[props.name] ?? ''));

    return {
        label,
        value,
    };
}
