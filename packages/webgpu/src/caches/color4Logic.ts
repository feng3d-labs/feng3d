import { computed, type Computed, reactive, registerLogic } from '@feng3d/reactivity';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Color4: Color4Logic;
    }
}

/**
 * 纯数据 Color4 的 logic。
 *
 * 输入：`{ __type__: 'Color4', r, g, b, a }` 字面量（无 class、无 toArray）。
 * 输出：`{ value: Computed<number[]> }` —— 一个响应式扁平数组 `[r, g, b, a]`。
 *
 * 关键：`computed` 内部通过 `reactive(color4)` 读取 r/g/b/a，建立响应式依赖。
 * 任一分量被修改（如 `reactive(color4).r = 0.5`）都会让 `value` 失效，从而触发
 * 上游 `WGPUBufferBinding` 的 effect 重新上传 vec4 到 GPU。
 *
 * 这样 webgpu 渲染端无需依赖 core，只通过 `@feng3d/reactivity` 的 logic 机制
 * 就能消费纯数据 Color4，并天然具备响应式更新能力。
 */

/** Color4 logic：暴露响应式扁平数据。 */
export class Color4Logic
{
    /** [r, g, b, a] 响应式扁平数组（修改 r/g/b/a 会自动失效）。 */
    readonly value: Computed<number[]>;

    constructor(color4: Color4Data)
    {
        this.value = computed(() =>
        {
            const c = reactive(color4);

            return [c.r ?? 1, c.g ?? 1, c.b ?? 1, c.a ?? 1];
        });
    }
}

/** 纯数据 Color4 形状（webgpu 端的最小契约，不依赖 core）。 */
export interface Color4Data
{
    readonly __type__: 'Color4';
    readonly r?: number;
    readonly g?: number;
    readonly b?: number;
    readonly a?: number;
}

/** 是否为纯数据 Color4（带 __type__: 'Color4' 标记）。 */
export function isColor4Data(value: unknown): value is Color4Data
{
    return typeof value === 'object'
        && value !== null
        && (value as { __type__?: unknown }).__type__ === 'Color4';
}

// 注册 Color4 logic：把 {__type__:'Color4', r,g,b,a} 转为响应式 number[]
registerLogic('Color4', Color4Logic);
