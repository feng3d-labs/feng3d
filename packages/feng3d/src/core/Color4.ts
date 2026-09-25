/**
 * 颜色（含透明度），纯数据接口。
 *
 * 不含任何 class：场景里出现的颜色（Scene.background、材质 uniforms 等）一律以
 * `{ __type__: 'Color4', r, g, b, a }` 字面量声明，由 `reactive` 驱动 r/g/b/a
 * 响应式更新。渲染端（WebGPU）按字段名读取，转为 vec4 上传到 GPU。
 *
 * 与 `rotation: { x, y, z }` 同构——永远是纯对象，不实例化为 Vector3/Color4。
 */
export interface Color4
{
    readonly __type__: 'Color4';

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

    /**
     * 透明度[0,1]（缺失时由消费方默认值补齐）
     */
    readonly a?: number;
}
