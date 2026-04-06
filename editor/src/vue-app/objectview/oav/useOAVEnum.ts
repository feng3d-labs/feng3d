import { computed, reactive } from 'vue';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';

/**
 * 枚举选项类型
 */
export interface EnumOption
{
    label: string;
    value: any;
}

/**
 * OAVEnum 组件的 Props 类型
 */
export interface OAVEnumProps
{
    /** 属性名称 */
    name: string;
    /** 属性所有者对象 */
    owner: Record<string, unknown>;
    /** 是否可编辑 */
    editable: boolean;
    /** 属性视图信息 */
    attributeViewInfo?: any;
    /** 枚举类对象（用于提取选项） */
    enumClass?: Record<string, any>;
    /** 选项列表（如果直接提供） */
    options?: EnumOption[] | string[];
}

/**
 * OAVEnum 组合式函数
 */
export function useOAVEnum(props: OAVEnumProps)
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

    // 生成选项列表
    const options = computed<EnumOption[]>(() => {
        // 如果直接提供了选项列表
        if (props.options) {
            if (props.options.length > 0 && typeof props.options[0] === 'string') {
                // 字符串数组，转换为选项对象
                return (props.options as string[]).map(opt => ({
                    label: opt,
                    value: opt,
                }));
            }
            return props.options as EnumOption[];
        }

        // 从枚举类提取选项
        if (props.enumClass) {
            const list: EnumOption[] = [];
            for (const key in props.enumClass) {
                if (props.enumClass.hasOwnProperty(key)) {
                    if (isNaN(Number(key))) {
                        list.push({
                            label: key,
                            value: props.enumClass[key],
                        });
                    }
                }
            }
            return list;
        }

        // 从 componentParam 获取选项
        if (props.attributeViewInfo?.componentParam?.options) {
            const opts = props.attributeViewInfo.componentParam.options;
            if (Array.isArray(opts) && opts.length > 0) {
                if (typeof opts[0] === 'string') {
                    return (opts as string[]).map(opt => ({
                        label: opt,
                        value: opt,
                    }));
                }
                return opts as EnumOption[];
            }
        }

        return [];
    });

    // 当前选中值（通过响应式对象监听）
    const value = computed(() => {
        const val = r_owner[props.name];
        // 查找匹配的选项
        const matched = options.value.find(opt => opt.value === val);
        return matched ? matched.value : val;
    });

    // 变更事件处理（通过响应式对象修改）
    function onChange(newValue: any)
    {
        r_owner[props.name] = newValue;

        // 触发值变化事件
        if (props.attributeViewInfo) {
            const event = new ObjectViewEvent();
            event.type = ObjectViewEvent.VALUE_CHANGE;
            (event as any).space = r_owner;
            (event as any).attributeName = props.name;
            (event as any).attributeValue = newValue;
        }
    }

    return {
        label,
        value,
        onChange,
        options,
    };
}
