import { computed, reactive } from 'vue';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';

/**
 * OAVNumber 组件的 Props 类型
 */
export interface OAVNumberProps
{
    /** 属性名称 */
    name: string;
    /** 属性所有者对象 */
    owner: Record<string, unknown>;
    /** 是否可编辑 */
    editable: boolean;
    /** 属性视图信息 */
    attributeViewInfo?: any;
    /** 步长 */
    step?: number;
    /** 键盘上下方向键步长 */
    stepDownup?: number;
    /** 最小值 */
    minValue?: number;
    /** 最大值 */
    maxValue?: number;
}

/**
 * OAVNumber 组合式函数
 *
 * 在组件内部创建响应式对象，避免外部传递响应式对象
 */
export function useOAVNumber(props: OAVNumberProps)
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

    // 数字值（通过响应式对象监听）
    const value = computed(() => {
        const val = r_owner[props.name];
        return typeof val === 'number' ? val : 0;
    });

    // 计算精度（根据步长）
    const precision = computed(() => {
        const step = props.step || 0.001;
        const stepStr = step.toString();
        if (stepStr.includes('.')) {
            return stepStr.split('.')[1].length;
        }
        return 0;
    });

    // 变更事件处理（通过响应式对象修改）
    function onChange(value: number | undefined)
    {
        if (value !== undefined) {
            // 应用最小值和最大值限制
            let finalValue = value;
            if (props.minValue !== undefined && finalValue < props.minValue) {
                finalValue = props.minValue;
            }
            if (props.maxValue !== undefined && finalValue > props.maxValue) {
                finalValue = props.maxValue;
            }

            r_owner[props.name] = finalValue;

            // 触发值变化事件
            if (props.attributeViewInfo) {
                const event = new ObjectViewEvent();
                event.type = ObjectViewEvent.VALUE_CHANGE;
                (event as any).space = r_owner;
                (event as any).attributeName = props.name;
                (event as any).attributeValue = finalValue;
            }
        }
    }

    // 键盘事件处理（上下方向键调整值）
    function onKeyDown(e: KeyboardEvent)
    {
        if (!props.editable) return;

        const stepDownup = props.stepDownup || 0.001;
        let delta = 0;

        if (e.key === 'ArrowUp') {
            delta = stepDownup;
        } else if (e.key === 'ArrowDown') {
            delta = -stepDownup;
        }

        if (delta !== 0) {
            e.preventDefault();
            const currentValue = value.value;
            onChange(currentValue + delta);
        }
    }

    return {
        label,
        value,
        onChange,
        onKeyDown,
        step: props.step || 0.001,
        minValue: props.minValue,
        maxValue: props.maxValue,
        precision,
    };
}
