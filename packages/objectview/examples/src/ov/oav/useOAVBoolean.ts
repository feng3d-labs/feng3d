import { computed, reactive } from 'vue';

/**
 * OAVBoolean 组件的 Props 类型
 */
export interface OAVBooleanProps
{
    /** 属性名称 */
    name: string;
    /** 属性所有者对象 */
    owner: Record<string, unknown>;
    /** 是否可编辑 */
    editable: boolean;
}

/**
 * OAVBoolean 组合式函数
 *
 * 在组件内部创建响应式对象，避免外部传递响应式对象
 */
export function useOAVBoolean(props: OAVBooleanProps)
{
    // 在组件内部创建响应式对象，仅用于监听和修改
    const r_owner = reactive(props.owner);

    // 格式化标签名
    const label = computed(() =>
        props.name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim()
    );

    // 复选框选中状态（通过响应式对象监听）
    const checked = computed(() => !!r_owner[props.name]);

    // 变更事件处理（通过响应式对象修改）
    function onChange(e: Event)
    {
        r_owner[props.name] = (e.target as HTMLInputElement).checked;
    }

    return {
        label,
        checked,
        onChange,
    };
}
