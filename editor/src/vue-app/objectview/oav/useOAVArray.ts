import { computed, reactive, ref, watch } from 'vue';
import { objectview, type AttributeViewInfo, lazy } from 'feng3d';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';

/**
 * OAVArray 组件的 Props 类型
 */
export interface OAVArrayProps
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
 * OAVArray 组合式函数
 */
export function useOAVArray(props: OAVArrayProps)
{
    // 在组件内部创建响应式对象，仅用于监听和修改
    const r_owner = reactive(props.owner);
    const isExpanded = ref(false);

    // 获取数组值
    const arrayValue = computed(() => {
        const value = r_owner[props.name];
        return Array.isArray(value) ? value : [];
    });

    // 数组大小
    const arraySize = computed(() => arrayValue.value.length);

    // 默认项（从 componentParam 获取）
    const defaultItem = computed(() => {
        return props.attributeViewInfo?.componentParam?.defaultItem;
    });

    // 生成数组项的 AttributeViewInfo
    const arrayItems = computed(() => {
        const items: AttributeViewInfo[] = [];
        const arr = arrayValue.value;
        const componentParam = props.attributeViewInfo?.componentParam;

        for (let i = 0; i < arr.length; i++) {
            items.push({
                name: `${i}`,
                owner: arr,
                editable: props.editable,
                componentParam,
                type: typeof arr[i] === 'number' ? 'number' : 'String',
            } as AttributeViewInfo);
        }

        return items;
    });

    // 切换展开/折叠
    function toggleExpanded()
    {
        isExpanded.value = !isExpanded.value;
    }

    // 数组大小变化处理
    function onSizeChange(newSize: number | undefined)
    {
        if (newSize === undefined) return;

        const arr = arrayValue.value;
        const oldSize = arr.length;

        if (newSize === oldSize) return;

        // 调整数组大小
        if (newSize > oldSize) {
            // 增加项
            for (let i = oldSize; i < newSize; i++) {
                if (!arr[i] && defaultItem.value) {
                    arr[i] = lazy.getvalue(defaultItem.value);
                } else if (!arr[i]) {
                    // 根据类型设置默认值
                    const type = props.attributeViewInfo?.componentParam?.type || 'number';
                    if (type === 'number') {
                        arr[i] = 0;
                    } else {
                        arr[i] = '';
                    }
                }
            }
        } else {
            // 减少项
            arr.length = newSize;
        }

        // 触发值变化事件
        if (props.attributeViewInfo) {
            const event = new ObjectViewEvent();
            event.type = ObjectViewEvent.VALUE_CHANGE;
            (event as any).space = r_owner;
            (event as any).attributeName = props.name;
            (event as any).attributeValue = arr;
        }
    }

    return {
        isExpanded,
        toggleExpanded,
        arraySize,
        arrayItems,
        onSizeChange,
        defaultItem,
    };
}
