module feng3d {

	/**
	 * 包围盒基类
	 * @author feng 2014-4-27
	 */
    export abstract class BoundingVolumeBase {
        /** 最小坐标 */
        protected _min: Vector3D;
        /** 最大坐标 */
        protected _max: Vector3D;

        protected _aabbPointsDirty: boolean = true;
        protected _boundingRenderable: WireframePrimitiveBase;

		/**
		 * The maximum extreme of the bounds
		 */
        public get max(): Vector3D {
            return this._max;
        }

		/**
		 * The minimum extreme of the bounds
		 */
        public get min(): Vector3D {
            return this._min;
        }

		/**
		 * 创建包围盒
		 */
        constructor() {
            this._min = new Vector3D();
            this._max = new Vector3D();
        }

		/**
		 * 渲染实体
		 */
        public get boundingRenderable(): WireframePrimitiveBase {
            if (!this._boundingRenderable) {
                this._boundingRenderable = this.createBoundingRenderable();
                this.updateBoundingRenderable();
            }

            return this._boundingRenderable;
        }

		/**
		 * 销毁渲染实体
		 */
        public disposeRenderable() {
            this._boundingRenderable = null;
        }

		/**
		 * 更新边界渲染实体
		 */
        protected abstract updateBoundingRenderable();

		/**
		 * 创建渲染边界
		 */
        protected abstract createBoundingRenderable(): WireframePrimitiveBase;

		/**
		 * 根据几何结构更新边界
		 */
        public fromGeometry(geometry: Geometry) {
            var subGeoms: SubGeometry[] = geometry.subGeometries;
            var numSubGeoms: number = subGeoms.length;
            var minX: number, minY: number, minZ: number;
            var maxX: number, maxY: number, maxZ: number;

            if (numSubGeoms > 0) {
                var subGeom: SubGeometry = subGeoms[0];
                var vertices: number[] = subGeom.vertexPositionData;
                var i: number = 0;
                minX = maxX = vertices[i];
                minY = maxY = vertices[i + 1];
                minZ = maxZ = vertices[i + 2];

                var j: number = 0;
                while (j < numSubGeoms) {
                    subGeom = subGeoms[j++];
                    vertices = subGeom.vertexPositionData;
                    var vertexDataLen: number = vertices.length;
                    i = 0;
                    var stride: number = subGeom.vertexPositionStride;

                    while (i < vertexDataLen) {
                        var v: number = vertices[i];
                        if (v < minX)
                            minX = v;
                        else if (v > maxX)
                            maxX = v;
                        v = vertices[i + 1];
                        if (v < minY)
                            minY = v;
                        else if (v > maxY)
                            maxY = v;
                        v = vertices[i + 2];
                        if (v < minZ)
                            minZ = v;
                        else if (v > maxZ)
                            maxZ = v;
                        i += stride;
                    }
                }

                this.fromExtremes(minX, minY, minZ, maxX, maxY, maxZ);
            }
            else
                this.fromExtremes(0, 0, 0, 0, 0, 0);
        }

		/**
		 * 根据所给极值设置边界
		 * @param minX 边界最小X坐标
		 * @param minY 边界最小Y坐标
		 * @param minZ 边界最小Z坐标
		 * @param maxX 边界最大X坐标
		 * @param maxY 边界最大Y坐标
		 * @param maxZ 边界最大Z坐标
		 */
        public fromExtremes(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number) {
            this._min.x = minX;
            this._min.y = minY;
            this._min.z = minZ;
            this._max.x = maxX;
            this._max.y = maxY;
            this._max.z = maxZ;
            if (this._boundingRenderable)
                this.updateBoundingRenderable();
        }

		/**
		 * 检测射线是否与边界交叉
		 * @param ray3D						射线
		 * @param targetNormal				交叉点法线值
		 * @return							射线起点到交点距离
		 */
        public rayIntersection(ray3D: Ray3D, targetNormal: Vector3D): number {
            return -1;
        }

		/**
		 * 检测是否包含指定点
		 * @param position 		被检测点
		 * @return				true：包含指定点
		 */
        public containsPoint(position: Vector3D): boolean {
            return false;
        }

		/**
		 * 测试是否出现在摄像机视锥体内
		 * @param planes 		视锥体面向量
		 * @param numPlanes		面数
		 * @return 				true：出现在视锥体内
		 */
        public abstract isInFrustum(planes: Plane3D[], numPlanes: number): boolean;

		/**
		 * 对包围盒进行变换
		 * @param bounds		包围盒
		 * @param matrix		变换矩阵
		 */
        public abstract transformFrom(bounds: BoundingVolumeBase, matrix: Matrix3D);

		/**
		 * 从给出的球体设置边界
		 * @param center 		球心坐标
		 * @param radius 		球体半径
		 */
        public fromSphere(center: Vector3D, radius: number) {
            this.fromExtremes(center.x - radius, center.y - radius, center.z - radius, center.x + radius, center.y + radius, center.z + radius);
        }
    }
}
