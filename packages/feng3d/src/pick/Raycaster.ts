import { logic } from '@feng3d/reactivity';
import { isRayCastable } from "../component/Component";
import { Box3, Ray3, Vector2, Vector3 } from '@feng3d/math';
import { CullFace } from '../render/data/enums';
import { Object3D } from '../core/Object3D';
import { RayCastable } from '../core/RayCastable';
import { RenderableLogic } from '../core/Renderable';
import { Geometrys } from '../geometry/Geometry';
/**
 * 射线投射拾取器
 */
export class Raycaster
{
    /**
     * 获取射线穿过的实体
     * @param ray3D 射线
     * @param object3Ds 实体列表
     * @return
     */
    pick(ray3D: Ray3, object3Ds: Object3D[])
    {
        if (object3Ds.length === 0) return null;

        const pickingCollisionVOs = object3Ds.reduce((pv: PickingCollisionVO[], object3D) =>
        {
            const model = object3D.components?.find(c => isRayCastable(c)) as RayCastable;
            const pickingCollisionVO = model && (logic(model) as unknown as RenderableLogic).worldRayIntersection(ray3D);
            if (pickingCollisionVO) pv.push(pickingCollisionVO);

            return pv;
        }, []);

        if (pickingCollisionVOs.length === 0) return null;

        // 根据与包围盒距离进行排序
        pickingCollisionVOs.sort((a, b) => a.rayEntryDistance - b.rayEntryDistance);

        let shortestCollisionDistance = Number.MAX_VALUE;
        let bestCollisionVO: PickingCollisionVO | null = null;
        const collisionVOs: PickingCollisionVO[] = [];

        for (let i = 0; i < pickingCollisionVOs.length; ++i)
        {
            const pickingCollisionVO = pickingCollisionVOs[i];
            if (!bestCollisionVO || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance)
            {
                const result = logic(pickingCollisionVO.geometry).raycast(pickingCollisionVO.localRay, shortestCollisionDistance, pickingCollisionVO.cullFace);
                if (result)
                {
                    pickingCollisionVO.rayEntryDistance = result.rayEntryDistance;
                    pickingCollisionVO.index = result.index;
                    pickingCollisionVO.localNormal = result.localNormal;
                    pickingCollisionVO.localPosition = result.localPosition;
                    pickingCollisionVO.uv = result.uv;
                    //
                    shortestCollisionDistance = pickingCollisionVO.rayEntryDistance;
                    collisionVOs.push(pickingCollisionVO);
                    bestCollisionVO = pickingCollisionVO;
                }
            }
        }

        return bestCollisionVO;
    }

    /**
     * 用**层级世界包围盒**剔除不可能被射线命中的对象（可选优化，issue #124）。
     *
     * ## 为什么剔除是安全的（结果与不剔除完全一致）
     *
     * 射线命中某个对象 ⇒ 命中点必在该对象的**世界包围盒**内；而对象的世界包围盒又包含在
     * **它所有祖先**的世界包围盒里。所以"任一祖先的包围盒与射线不相交 ⇒ 该对象不可能被命中"，
     * 剔除它不会改变 `pick` / `pickAll` 的结果。
     *
     * ## 为什么值得
     *
     * `pick` 会对**每个候选对象**做一次精确求交（三角形级）；而这里每个候选只沿父链做
     * O(深度) 次包围盒求交（包围盒按需更新、此后有缓存），便宜几个数量级。
     * 场景越深、对象越多、射线越"偏"，收益越大（射线不穿过任何盒子时直接全部剔除）。
     *
     * 用法（调用方自行决定用不用，属于可选方案）：
     * ```ts
     * const hit = raycaster.pick(ray, raycaster.cullByHierarchy(ray, candidates));
     * ```
     *
     * @param ray3D 世界空间射线
     * @param object3Ds 候选对象（通常是已摊平的拾取列表）
     * @returns 可能被命中的子集（**顺序与输入一致**，便于对照）
     */
    cullByHierarchy(ray3D: Ray3, object3Ds: Object3D[]): Object3D[]
    {
        if (object3Ds.length === 0) return object3Ds;

        const result: Object3D[] = [];
        for (const object3D of object3Ds)
        {
            if (this.#intersectsAncestorBounds(ray3D, object3D)) result.push(object3D);
        }

        return result;
    }

    /** 对象自身与**全部祖先**的世界包围盒是否都与射线相交 */
    #intersectsAncestorBounds(ray3D: Ray3, object3D: Object3D): boolean
    {
        let current: Object3D | null = object3D;
        while (current)
        {
            if (!this.#intersectsBounds(ray3D, current)) return false;
            current = (logic(current) as { parent?: Object3D | null })?.parent ?? null;
        }

        return true;
    }

    /**
     * 对象的世界包围盒是否与射线相交。
     *
     * 取不到包围盒时返回 `true`（**不做剔除**）：宁可多算一个对象，也不能因为"拿不到包围盒"
     * 就把可能命中的对象丢掉。
     */
    #intersectsBounds(ray3D: Ray3, object3D: Object3D): boolean
    {
        const bounds = (logic(object3D) as { boundingBox?: { worldBounds?: Box3 } })?.boundingBox?.worldBounds;
        if (!bounds) return true;

        return bounds.rayIntersection(ray3D.origin, ray3D.direction, this.#cullNormal) !== Number.MAX_VALUE;
    }

    /** 复用的法线容器（包围盒求交只需要"相交与否"，法线结果丢弃——避免每次分配） */
    readonly #cullNormal = new Vector3();

    /**
     * 获取射线穿过的实体
     * @param ray3D 射线
     * @param object3Ds 实体列表
     * @return
     */
    pickAll(ray3D: Ray3, object3Ds: Object3D[])
    {
        if (object3Ds.length === 0) return [];

        const pickingCollisionVOs = object3Ds.reduce((pv: PickingCollisionVO[], object3D) =>
        {
            const model = object3D.components?.find(c => isRayCastable(c)) as RayCastable;
            const pickingCollisionVO = model && (logic(model) as unknown as RenderableLogic).worldRayIntersection(ray3D);
            if (pickingCollisionVO) pv.push(pickingCollisionVO);

            return pv;
        }, []);

        if (pickingCollisionVOs.length === 0) return [];

        const collisionVOs = pickingCollisionVOs.filter((v) =>
        {
            const result = logic(v.geometry).raycast(v.localRay, Number.MAX_VALUE, v.cullFace);
            if (result)
            {
                v.rayEntryDistance = result.rayEntryDistance;
                v.index = result.index;
                v.localNormal = result.localNormal;
                v.localPosition = result.localPosition;
                v.uv = result.uv;

                return true;
            }

            return false;
        });

        return collisionVOs;
    }
}

/**
 * 射线投射拾取器
 */
export const raycaster = new Raycaster();

/**
 * 拾取的碰撞数据
 */
export interface PickingCollisionVO
{
    /**
     * 第一个穿过的物体
     */
    object3D: Object3D;

    /**
     * 碰撞的uv坐标
     */
    uv?: Vector2;

    /**
     * 实体上碰撞本地坐标
     */
    localPosition?: Vector3;

    /**
     * 射线顶点到实体的距离
     */
    rayEntryDistance: number;

    /**
     * 本地坐标系射线
     */
    localRay: Ray3;

    /**
     * 本地坐标碰撞法线
     */
    localNormal: Vector3;

    /**
     * 射线坐标是否在边界内
     */
    rayOriginIsInsideBounds: boolean;

    /**
     * 碰撞三角形索引
     */
    index?: number;

    /**
     * 碰撞关联的渲染对象
     */
    geometry: Geometrys;

    /**
     * 剔除面
     */
    cullFace: CullFace;
}

