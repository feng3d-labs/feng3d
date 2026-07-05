/**
 * 组件（纯数据接口）。
 *
 * 所有行为逻辑（init/beforeRender/update/dispose 及各类 computed）由
 * `logic(component)` 返回的 logic 对象提供。
 *
 * `__type__` 标识组件类型，logic 通过它分发到对应 logic 工厂。
 *
 * 组件查询与增删使用 {@link componentQuery} 中的工具函数。
 */
export interface Component
{
    /**
     * 组件类型名（与类名相同），用于 logic 分发
     */
    readonly __type__: string;
}
