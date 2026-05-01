import { computed, reactive, watch } from 'vue';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';
import { useEditorStore } from '../../stores/editorStore';

/**
 * OAVDefault 组件的 Props 类型
 */
export interface OAVDefaultProps
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
 * OAVDefault 组合式函数
 *
 * 在组件内部创建响应式对象，避免外部传递响应式对象
 */
export function useOAVDefault(props: OAVDefaultProps)
{
    const editorStore = useEditorStore();
    
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

    // 获取属性值
    const getValue = () => {
        const value = r_owner[props.name];
        if (value === undefined || value === null) {
            return String(value);
        }
        if (typeof value === 'object') {
            const valuename = (value as any)['name'] || '';
            return `${valuename} (${value.constructor.name})`;
        }
        return String(value);
    };

    // 文本值（通过响应式对象监听）
    const value = computed(() => getValue());

    // 变更事件处理（通过响应式对象修改）
    function onChange(e: Event)
    {
        const inputValue = (e.target as HTMLInputElement).value;
        const attributeType = props.attributeViewInfo?.type || typeof r_owner[props.name];
        
        switch (attributeType)
        {
            case 'String':
                r_owner[props.name] = inputValue;
                break;
            case 'number':
                let num = Number(inputValue);
                num = isNaN(num) ? 0 : num;
                r_owner[props.name] = num;
                break;
            case 'Boolean':
                r_owner[props.name] = Boolean(inputValue);
                break;
            default:
                // 尝试保持原类型
                if (typeof r_owner[props.name] === 'number') {
                    const num = Number(inputValue);
                    if (!isNaN(num)) {
                        r_owner[props.name] = num;
                    }
                } else {
                    r_owner[props.name] = inputValue;
                }
        }

        // 触发值变化事件
        if (props.attributeViewInfo) {
            const event = new ObjectViewEvent();
            event.type = ObjectViewEvent.VALUE_CHANGE;
            (event as any).space = r_owner;
            (event as any).attributeName = props.name;
            (event as any).attributeValue = r_owner[props.name];
            // 可以通过全局事件系统分发
        }
    }

    // 双击事件处理（选择对象）
    function onDoubleClick()
    {
        const value = r_owner[props.name];
        if (value && typeof value === 'object') {
            editorStore.selectObject(value as any);
        }
    }

    // 监听属性变化（如果可编辑）
    if (props.editable) {
        watch(() => r_owner[props.name], () => {
            // 值变化时自动更新显示
        });
    }

    return {
        label,
        value,
        onChange,
        onDoubleClick,
    };
}
