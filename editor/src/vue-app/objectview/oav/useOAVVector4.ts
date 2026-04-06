import { computed, reactive } from 'vue';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';

/**
 * Vector4 数据类型
 */
export interface Vector4
{
    x: number;
    y: number;
    z: number;
    w: number;
}

/**
 * OAVVector4 组件的 Props 类型
 */
export interface OAVVector4Props
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
 * OAVVector4 组合式函数
 */
export function useOAVVector4(props: OAVVector4Props)
{
    // 在组件内部创建响应式对象，仅用于监听和修改
    const r_owner = reactive(props.owner);
    const vectorValue = computed(() => r_owner[props.name] as Vector4);
    const r_value = reactive(vectorValue.value || { x: 0, y: 0, z: 0, w: 0 });

    // 同步值变化
    computed(() => {
        const val = vectorValue.value;
        if (val && (val.x !== r_value.x || val.y !== r_value.y || val.z !== r_value.z || val.w !== r_value.w)) {
            r_value.x = val.x ?? 0;
            r_value.y = val.y ?? 0;
            r_value.z = val.z ?? 0;
            r_value.w = val.w ?? 0;
        }
    });

    // 格式化标签名
    const label = computed(() => {
        const name = props.attributeViewInfo?.label || props.name;
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    });

    // 各轴的值（通过响应式对象监听）
    const x = computed(() => r_value.x ?? 0);
    const y = computed(() => r_value.y ?? 0);
    const z = computed(() => r_value.z ?? 0);
    const w = computed(() => r_value.w ?? 0);

    // 计算精度（根据步长）
    const precision = computed(() => {
        const step = props.step || 0.001;
        const stepStr = step.toString();
        if (stepStr.includes('.')) {
            return stepStr.split('.')[1].length;
        }
        return 0;
    });

    // 更新向量值
    function updateVectorValue()
    {
        if (vectorValue.value) {
            vectorValue.value.x = r_value.x;
            vectorValue.value.y = r_value.y;
            vectorValue.value.z = r_value.z;
            vectorValue.value.w = r_value.w;
        } else {
            r_owner[props.name] = { x: r_value.x, y: r_value.y, z: r_value.z, w: r_value.w };
        }

        // 触发值变化事件
        if (props.attributeViewInfo) {
            const event = new ObjectViewEvent();
            event.type = ObjectViewEvent.VALUE_CHANGE;
            (event as any).space = r_owner;
            (event as any).attributeName = props.name;
            (event as any).attributeValue = r_owner[props.name];
        }
    }

    // 变更事件处理
    function onChangeX(newValue: number | undefined)
    {
        if (newValue !== undefined) {
            let finalValue = newValue;
            if (props.minValue !== undefined && finalValue < props.minValue) {
                finalValue = props.minValue;
            }
            if (props.maxValue !== undefined && finalValue > props.maxValue) {
                finalValue = props.maxValue;
            }
            r_value.x = finalValue;
            updateVectorValue();
        }
    }

    function onChangeY(newValue: number | undefined)
    {
        if (newValue !== undefined) {
            let finalValue = newValue;
            if (props.minValue !== undefined && finalValue < props.minValue) {
                finalValue = props.minValue;
            }
            if (props.maxValue !== undefined && finalValue > props.maxValue) {
                finalValue = props.maxValue;
            }
            r_value.y = finalValue;
            updateVectorValue();
        }
    }

    function onChangeZ(newValue: number | undefined)
    {
        if (newValue !== undefined) {
            let finalValue = newValue;
            if (props.minValue !== undefined && finalValue < props.minValue) {
                finalValue = props.minValue;
            }
            if (props.maxValue !== undefined && finalValue > props.maxValue) {
                finalValue = props.maxValue;
            }
            r_value.z = finalValue;
            updateVectorValue();
        }
    }

    function onChangeW(newValue: number | undefined)
    {
        if (newValue !== undefined) {
            let finalValue = newValue;
            if (props.minValue !== undefined && finalValue < props.minValue) {
                finalValue = props.minValue;
            }
            if (props.maxValue !== undefined && finalValue > props.maxValue) {
                finalValue = props.maxValue;
            }
            r_value.w = finalValue;
            updateVectorValue();
        }
    }

    return {
        label,
        x,
        y,
        z,
        w,
        onChangeX,
        onChangeY,
        onChangeZ,
        onChangeW,
        step: props.step || 0.001,
        minValue: props.minValue,
        maxValue: props.maxValue,
        precision,
    };
}
