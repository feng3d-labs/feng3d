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

// Renderable 系所有子类型的 __type__ 集合
const _renderableTypes = new Set(['Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water']);
const _rayCastableTypes = new Set(['RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water']);

export function isRenderable(component: Component): boolean
{
    return _renderableTypes.has(component.__type__);
}

export function isRayCastable(component: Component): boolean
{
    return _rayCastableTypes.has(component.__type__);
}
