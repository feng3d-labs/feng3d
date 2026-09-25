/**
 * 颜色（不含透明度），纯数据接口。
 *
 * 不含任何 class：场景里出现的颜色（Light.color 等）一律以
 * `{ __type__: 'Color3', r, g, b }` 字面量声明，由 `reactive` 驱动 r/g/b
 * 响应式更新。
 *
 * 与 {@link Color4} 同构——永远是纯对象，不实例化为 Color3 类。
 */
export interface Color3
{
    readonly __type__: 'Color3';

    /**
     * 红[0,1]（缺失时由消费方默认值补齐）
     */
    readonly r?: number;

    /**
     * 绿[0,1]（缺失时由消费方默认值补齐）
     */
    readonly g?: number;

    /**
     * 蓝[0,1]（缺失时由消费方默认值补齐）
     */
    readonly b?: number;
}
