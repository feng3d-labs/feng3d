/**
 * 判断粒子渲染是否采用公告牌模式（四边形几何体且未对齐发射方向）。
 *
 * 以 `__type__` 字面量判别；不可用对象引用比较——字面量每次构造都是新对象，
 * `geometry === { __type__: 'QuadGeometry' }` 恒为 false，公告牌分支永不生效。
 * 独立成无依赖模块，便于在 node 环境下直接单测。
 *
 * @param geometry 粒子几何体数据
 * @param alignToDirection 是否对齐发射方向（shape 模块）
 */
export function isParticleBillboard(geometry: { __type__?: string }, alignToDirection: boolean): boolean
{
    return !alignToDirection && geometry.__type__ === 'QuadGeometry';
}
