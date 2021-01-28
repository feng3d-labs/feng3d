namespace feng3d
{

	/**
	 * 射线投射拾取器
	 */
    export var raycaster: Raycaster;

    interface PickBoxResultItem
    {
        ray3: Ray3;
        /**
         * 测试的对象
         */
        gameObject: GameObject,
        /**
         * 射线到世界包围盒的距离
         */
        rayWorldBoxDistance: number,

        /**
         * 射线与世界包围盒交点处法线
         */
        rayWorldBoxNormal: Vector3

        /**
         * 射线到自身世界空间的包围盒的距离
         */
        raySelfWorldBoundsDistance: number,

        /**
         * 射线与自身世界空间的包围盒交点处法线
         */
        raySelfWorldBoundsNormal: Vector3
        /**
         * 
         */
        renderable: Renderable;

        geometry: GeometryLike;

        material: Material;
    }

    interface PickResultItem extends PickBoxResultItem
    {
        /**
         * 局部空间射线与几何体相交法线
         */
        localNormal?: Vector3;

        /**
         * 与射线局部空间交点的坐标
         */
        localPosition?: Vector3;

        /**
         * 与射线相交的多边形索引
         */
        index?: number;

        /**
         * 与射线交点的uv
         */
        uv?: Vector2;

        /**
         * 与射线世界空间交点的坐标
         */
        worldPosition?: Vector3;

        /**
         * 在世界空间射线起点到交点的距离
         */
        worldCollisionDistance?: number;
    }

	/**
	 * 射线投射拾取器
	 */
    export class Raycaster 
    {
        pickObject(ray3: Ray3, gameObject: GameObject, pickChildren = true, pickResult: {
            /**
             * 拾取检测的列表
             */
            list: PickBoxResultItem[],
            /**
             * 当前世界空间射线离碰撞点最短距离
             */
            worldShortestCollisionDistance?: Number,
            /**
             * 最近碰到元素
             */
            shortestCollisionItem?: PickResultItem,
        } = { list: [], worldShortestCollisionDistance: Number.MAX_VALUE })
        {
            // 检测世界包围盒与射线相交
            const rayWorldBoxNormal = new Vector3();
            const rayWorldBoxDistance = gameObject.boundingBox.worldBounds.rayIntersection(ray3.origin, ray3.direction, rayWorldBoxNormal);
            if (rayWorldBoxDistance < pickResult.worldShortestCollisionDistance)
            {
                // 检测自身世界空间的包围盒与射线相交
                const raySelfWorldBoundsNormal = new Vector3();
                const raySelfWorldBoundsDistance = gameObject.boundingBox.selfWorldBounds.rayIntersection(ray3.origin, ray3.direction, raySelfWorldBoundsNormal);
                if (raySelfWorldBoundsDistance < pickResult.worldShortestCollisionDistance)
                {
                    // 获取渲染数据
                    const renderable = gameObject.getComponent("Renderable");

                    pickResult.list.push({
                        ray3: ray3,
                        gameObject: gameObject,
                        rayWorldBoxNormal: rayWorldBoxNormal,
                        rayWorldBoxDistance: rayWorldBoxDistance,
                        raySelfWorldBoundsNormal: raySelfWorldBoundsNormal,
                        raySelfWorldBoundsDistance: raySelfWorldBoundsDistance,
                        renderable: renderable,
                        geometry: renderable.geometry,
                        material: renderable.material,
                    });
                }
                if (pickChildren)
                {
                    gameObject.children.forEach(child =>
                    {
                        this.pickObject(ray3, child, pickChildren, pickResult);
                    });
                }
            }
            return pickResult;
        }

        pickObject1(pickResult: {
            /**
             * 拾取检测的列表
             */
            list: PickResultItem[],
            /**
             * 当前世界空间射线离碰撞点最短距离
             */
            worldShortestCollisionDistance?: Number,
            /**
             * 最近碰到元素
             */
            shortestCollisionItem?: PickResultItem,
        })
        {
            const list = pickResult.list;
            list.sort((a, b) =>
            {
                return a.raySelfWorldBoundsDistance - b.raySelfWorldBoundsDistance;
            });

            for (let i = 0, n = list.length; i < n; i++)
            {
                const item = list[i];
                const ray3 = item.ray3;
                const gameObject = item.gameObject;
                const geometry = item.geometry;
                const material = item.material;
                if (item.raySelfWorldBoundsDistance < pickResult.worldShortestCollisionDistance)
                {
                    const localRay = gameObject.transform.rayWorldToLocal(ray3);
                    // 直接几何体射线拾取
                    var result = geometry.raycast(localRay, Number.MAX_VALUE, material.renderParams.cullFace);
                    if (result)
                    {
                        item.localNormal = result.localNormal;
                        item.localPosition = result.localPosition;
                        item.index = result.index;
                        item.uv = result.uv;
                        // 
                        item.worldPosition = new Vector3();
                        gameObject.transform.localToWorldMatrix.transformPoint3(result.localPosition, item.worldPosition);
                        // 
                        item.worldCollisionDistance = item.worldPosition.distance(ray3.origin);
                        if (item.worldCollisionDistance < pickResult.worldShortestCollisionDistance)
                        {
                            pickResult.worldShortestCollisionDistance = item.worldCollisionDistance;
                            pickResult.shortestCollisionItem = item;
                        }
                    }
                } else
                {
                    break;
                }
            }
        }

        /**
         * 获取射线穿过的实体
         * @param ray3D 射线
         * @param gameObjects 实体列表
         * @return
         */
        pick(ray3D: Ray3, gameObjects: GameObject[])
        {
            if (gameObjects.length == 0) return null;

            var pickingCollisionVOs = gameObjects.reduce((pv: PickingCollisionVO[], gameObject) =>
            {
                var model = gameObject.getComponent("RayCastable");
                var pickingCollisionVO = model && model.worldRayIntersection(ray3D);
                if (pickingCollisionVO) pv.push(pickingCollisionVO);
                return pv;
            }, []);

            if (pickingCollisionVOs.length == 0) return null;

            // 根据与包围盒距离进行排序
            pickingCollisionVOs.sort((a, b) => a.rayEntryDistance - b.rayEntryDistance);

            var shortestCollisionDistance = Number.MAX_VALUE;
            var bestCollisionVO: PickingCollisionVO = null;
            var collisionVOs: PickingCollisionVO[] = [];

            for (var i = 0; i < pickingCollisionVOs.length; ++i)
            {
                var pickingCollisionVO = pickingCollisionVOs[i];
                if (bestCollisionVO == null || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance)
                {
                    var result = pickingCollisionVO.geometry.raycast(pickingCollisionVO.localRay, shortestCollisionDistance, pickingCollisionVO.cullFace);
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
         * 获取射线穿过的实体
         * @param ray3D 射线
         * @param gameObjects 实体列表
         * @return
         */
        pickAll(ray3D: Ray3, gameObjects: GameObject[])
        {
            if (gameObjects.length == 0) return [];

            var pickingCollisionVOs = gameObjects.reduce((pv: PickingCollisionVO[], gameObject) =>
            {
                var model = gameObject.getComponent("RayCastable");
                var pickingCollisionVO = model && model.worldRayIntersection(ray3D);
                if (pickingCollisionVO) pv.push(pickingCollisionVO);
                return pv;
            }, []);

            if (pickingCollisionVOs.length == 0) return [];

            var collisionVOs = pickingCollisionVOs.filter(v =>
            {
                var result = v.geometry.raycast(v.localRay, Number.MAX_VALUE, v.cullFace);
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

    raycaster = new Raycaster();

    /**
	 * 拾取的碰撞数据
	 */
    export interface PickingCollisionVO
    {
		/**
		 * 第一个穿过的物体
		 */
        gameObject: GameObject;

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
        geometry: Geometry;

        /**
         * 剔除面
         */
        cullFace: CullFace;
    }



}
