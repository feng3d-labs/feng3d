module feng3d
{

	/**
	 * 拾取的碰撞数据
	 */
	export class PickingCollisionVO
	{
		/**
		 * 第一个穿过的物体
		 */
		public firstEntity: Entity;

		/**
		 * 碰撞的uv坐标
		 */
		public uv: Point;

		/**
		 * 实体上碰撞本地坐标
		 */
		public localPosition: Vector3D;

		/**
		 * 射线顶点到实体的距离
		 */
		public rayEntryDistance: number;

		/**
		 * 本地坐标系射线
		 */
		public localRay: Ray3D = new Ray3D();

		/**
		 * 本地坐标碰撞法线
		 */
		public localNormal: Vector3D;

		/**
		 * 场景中碰撞射线
		 */
		public ray3D: Ray3D = new Ray3D();

		/**
		 * 射线坐标是否在边界内
		 */
		public rayOriginIsInsideBounds: boolean;

		/**
		 * 碰撞三角形索引
		 */
		public index: number;

		/**
		 * 碰撞关联的渲染对象
		 */
		public renderable: Model;

		/**
		 * 创建射线拾取碰撞数据
		 * @param entity
		 */
		constructor(entity: Entity)
		{
			this.firstEntity = entity;
		}

		/**
		 * 实体上碰撞世界坐标
		 */
		public get scenePosition(): Vector3D
		{
			return this.firstEntity.sceneTransform.transformVector(this.localPosition);
		}
	}
}
