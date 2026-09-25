import { computed, reactive } from 'vue';

/**
 * Vector3 数据类型
 */
export interface Vector3
{
    x: number;
    y: number;
    z: number;
}

/**
 * OAVVector3 组件的 Props 类型
 */
export interface OAVVector3Props
{
    /** 属性名称 */
    name: string;
    /** 属性所有者对象 */
    owner: Record<string, unknown>;
    /** 是否可编辑 */
    editable: boolean;
}

/**
 * OAVVector3 组合式函数
 *
 * 在组件内部创建响应式对象，避免外部传递响应式对象
 */
export function useOAVVector3(props: OAVVector3Props)
{
    // 在组件内部创建响应式对象，仅用于监听和修改
    const r_owner = reactive(props.owner);
    const r_value = reactive(r_owner[props.name] as Vector3);

    // 格式化标签名
    const label = computed(() =>
        props.name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim()
    );

    // 各轴的值（通过响应式对象监听）
    const x = computed(() => String(r_value.x ?? 0));
    const y = computed(() => String(r_value.y ?? 0));
    const z = computed(() => String(r_value.z ?? 0));

    // 变更事件处理（通过响应式对象修改）
    function onChangeX(e: Event)
    {
        r_value.x = parseFloat((e.target as HTMLInputElement).value) || 0;
    }

    function onChangeY(e: Event)
    {
        r_value.y = parseFloat((e.target as HTMLInputElement).value) || 0;
    }

    function onChangeZ(e: Event)
    {
        r_value.z = parseFloat((e.target as HTMLInputElement).value) || 0;
    }

    return {
        label,
        x,
        y,
        z,
        onChangeX,
        onChangeY,
        onChangeZ,
    };
}

