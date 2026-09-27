import { computed, reactive, toRaw, watch } from 'vue';
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
 * 字段值在文本框里显示成什么。
 *
 * 对象值只给**摘要**：`${name} (${构造器名})`——普通对象没有 `name`，于是就是 `" (Object)"`。
 * 这是给人看的文本，**不是可以写回数据的值**（issue #184）。
 */
export function displayTextOf(value: unknown): string
{
    if (value === undefined || value === null) return String(value);
    if (typeof value === 'object')
    {
        const valuename = (value as { name?: string })['name'] || '';

        return `${valuename} (${value.constructor.name})`;
    }

    return String(value);
}

/** 一次写入的决定：写什么，或者为什么不写 */
export type DefaultWriteDecision = { readonly write: true, readonly value: unknown } | { readonly write: false, readonly reason: string };

/**
 * 由「输入框文本 + 当前值」决定要不要写、写什么。
 *
 * ## 为什么需要它（issue #184）
 *
 * `OAVDefault` 的输入框同时绑了 `@change` 与 `@blur`，而文本框里显示的可能是**展示文本**
 * （对象值的 `" (Object)"`）。原实现无条件 `r_owner[name] = inputValue`，于是
 * **"点一下输入框再点别处"（一个字都没改）就把摘要写进了数据**：
 * `geometry` / `material` 变成字符串 `" (Object)"`，引擎读不到 `__type__`，
 * 变换工具的 `position` 变成字符串后拖动时抛 `Cannot create property 'x' on string`。
 *
 * 实测（`tmp/oav-blur-write-probe.mjs`）：仅 click + blur 就让
 * `{"__type__":"SphereGeometry"}` 与 `{"__type__":"StandardMaterial",…}` 都变成了 `" (Object)"`。
 *
 * 因此写入前两道判断：**对象值不可用文本框编辑**（文本是摘要）、
 * **文本与当前值一致就不写**（blur 的常态，顺带不污染撤销栈）。
 *
 * @param current 字段当前值
 * @param inputValue 输入框里的文本
 * @param attributeType 属性视图声明的类型（`'String'` / `'number'` / `'Boolean'` / 其它）
 */
export function resolveDefaultWrite(current: unknown, inputValue: string, attributeType: string): DefaultWriteDecision
{
    // 1. 对象/数组：文本框里是摘要，写回等于把数据毁成字符串
    if (current !== null && typeof current === 'object')
    {
        return { write: false, reason: '值是对象，文本框只承载摘要（要改它请用专门的控件）' };
    }
    // 2. 文本没变（blur 的常态）：不做任何写入
    if (inputValue === displayTextOf(current)) return { write: false, reason: '文本与当前值一致（没有编辑）' };

    switch (attributeType)
    {
        case 'String':
            return { write: true, value: inputValue };
        case 'number':
        {
            const num = Number(inputValue);

            return { write: true, value: Number.isNaN(num) ? 0 : num };
        }
        case 'Boolean':
            return { write: true, value: Boolean(inputValue) };
        default:
            // 尝试保持原类型
            if (typeof current === 'number')
            {
                const num = Number(inputValue);
                if (Number.isNaN(num)) return { write: false, reason: '文本不是数字，保持原值' };

                return { write: true, value: num };
            }

            return { write: true, value: inputValue };
    }
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

    // 获取属性值（展示文本：对象只给摘要）
    // `toRaw`：传给别的函数的一律是原始值，不把响应式代理递出去（根规范 §8.6）
    const getValue = () => displayTextOf(toRaw(r_owner[props.name]));

    // 文本值（通过响应式对象监听）
    const value = computed(() => getValue());

    // 变更事件处理（通过响应式对象修改）
    function onChange(e: Event)
    {
        const inputValue = (e.target as HTMLInputElement).value;
        const current = toRaw(r_owner[props.name]);
        const attributeType = props.attributeViewInfo?.type || typeof current;
        const decision = resolveDefaultWrite(current, inputValue, String(attributeType));

        // 不该写就不写：对象值的摘要、以及"没编辑过"的失焦，都不该落一次写
        if (!decision.write) return;

        r_owner[props.name] = decision.value;

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
