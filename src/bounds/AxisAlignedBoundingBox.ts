module feng3d
{
	/**
	 * 轴对其包围盒
	 * @author feng 2014-4-27
	 */
    export class AxisAlignedBoundingBox extends BoundingVolumeBase
    {
        private _centerX: number = 0;
        private _centerY: number = 0;
        private _centerZ: number = 0;
        private _halfExtentsX: number = 0;
        private _halfExtentsY: number = 0;
        private _halfExtentsZ: number = 0;

		/**
		 * 创建轴对其包围盒
		 */
        constructor()
        {
            super();
        }

		/**
		 * 测试轴对其包围盒是否出现在摄像机视锥体内
		 * @param planes 		视锥体面向量
		 * @return 				true：出现在视锥体内
		 * @see me.feng3d.cameras.Camera3D.updateFrustum()
		 */
        public isInFrustum(planes: Plane3D[], numPlanes: number): boolean
        {
            for (var i: number = 0; i < numPlanes; ++i)
            {
                var plane: Plane3D = planes[i];
                var a: number = plane.a;
                var b: number = plane.b;
                var c: number = plane.c;
                //最可能出现在平面内的点，即距离最可能大于0的点 (如果这个点都不在平面内的话，其他的点肯定会不在平面内)
                var flippedExtentX: number = a < 0 ? -this._halfExtentsX : this._halfExtentsX;
                var flippedExtentY: number = b < 0 ? -this._halfExtentsY : this._halfExtentsY;
                var flippedExtentZ: number = c < 0 ? -this._halfExtentsZ : this._halfExtentsZ;
                var projDist: number = a * (this._centerX + flippedExtentX) + b * (this._centerY + flippedExtentY) + c * (this._centerZ + flippedExtentZ) - plane.d;
                //小于0表示包围盒8个点都在平面内，同时就表面不存在点在视锥体内。注：视锥体6个平面朝内
                if (projDist < 0)
                    return false;
            }

            return true;
        }

		/**
		 * @inheritDoc
		 */
        public fromExtremes(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number)
        {
            this._centerX = (maxX + minX) * .5;
            this._centerY = (maxY + minY) * .5;
            this._centerZ = (maxZ + minZ) * .5;
            this._halfExtentsX = (maxX - minX) * .5;
            this._halfExtentsY = (maxY - minY) * .5;
            this._halfExtentsZ = (maxZ - minZ) * .5;
            super.fromExtremes(minX, minY, minZ, maxX, maxY, maxZ);
        }

		/**
		 * @inheritDoc
		 */
        public rayIntersection(ray3D: Ray3D, targetNormal: Vector3D): number
        {
            var position: Vector3D = ray3D.position;
            var direction: Vector3D = ray3D.direction;
            if (this.containsPoint(position))
                return 0;

            var px: number = position.x - this._centerX, py: number = position.y - this._centerY, pz: number = position.z - this._centerZ;
            var vx: number = direction.x, vy: number = direction.y, vz: number = direction.z;
            var ix: number, iy: number, iz: number;
            var rayEntryDistance: number;

            // ray-plane tests
            var intersects: boolean;
            if (vx < 0)
            {
                rayEntryDistance = (this._halfExtentsX - px) / vx;
                if (rayEntryDistance > 0)
                {
                    iy = py + rayEntryDistance * vy;
                    iz = pz + rayEntryDistance * vz;
                    if (iy > -this._halfExtentsY && iy < this._halfExtentsY && iz > -this._halfExtentsZ && iz < this._halfExtentsZ)
                    {
                        targetNormal.x = 1;
                        targetNormal.y = 0;
                        targetNormal.z = 0;

                        intersects = true;
                    }
                }
            }
            if (!intersects && vx > 0)
            {
                rayEntryDistance = (-this._halfExtentsX - px) / vx;
                if (rayEntryDistance > 0)
                {
                    iy = py + rayEntryDistance * vy;
                    iz = pz + rayEntryDistance * vz;
                    if (iy > -this._halfExtentsY && iy < this._halfExtentsY && iz > -this._halfExtentsZ && iz < this._halfExtentsZ)
                    {
                        targetNormal.x = -1;
                        targetNormal.y = 0;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vy < 0)
            {
                rayEntryDistance = (this._halfExtentsY - py) / vy;
                if (rayEntryDistance > 0)
                {
                    ix = px + rayEntryDistance * vx;
                    iz = pz + rayEntryDistance * vz;
                    if (ix > -this._halfExtentsX && ix < this._halfExtentsX && iz > -this._halfExtentsZ && iz < this._halfExtentsZ)
                    {
                        targetNormal.x = 0;
                        targetNormal.y = 1;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vy > 0)
            {
                rayEntryDistance = (-this._halfExtentsY - py) / vy;
                if (rayEntryDistance > 0)
                {
                    ix = px + rayEntryDistance * vx;
                    iz = pz + rayEntryDistance * vz;
                    if (ix > -this._halfExtentsX && ix < this._halfExtentsX && iz > -this._halfExtentsZ && iz < this._halfExtentsZ)
                    {
                        targetNormal.x = 0;
                        targetNormal.y = -1;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vz < 0)
            {
                rayEntryDistance = (this._halfExtentsZ - pz) / vz;
                if (rayEntryDistance > 0)
                {
                    ix = px + rayEntryDistance * vx;
                    iy = py + rayEntryDistance * vy;
                    if (iy > -this._halfExtentsY && iy < this._halfExtentsY && ix > -this._halfExtentsX && ix < this._halfExtentsX)
                    {
                        targetNormal.x = 0;
                        targetNormal.y = 0;
                        targetNormal.z = 1;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vz > 0)
            {
                rayEntryDistance = (-this._halfExtentsZ - pz) / vz;
                if (rayEntryDistance > 0)
                {
                    ix = px + rayEntryDistance * vx;
                    iy = py + rayEntryDistance * vy;
                    if (iy > -this._halfExtentsY && iy < this._halfExtentsY && ix > -this._halfExtentsX && ix < this._halfExtentsX)
                    {
                        targetNormal.x = 0;
                        targetNormal.y = 0;
                        targetNormal.z = -1;
                        intersects = true;
                    }
                }
            }

            return intersects ? rayEntryDistance : -1;
        }

		/**
		 * @inheritDoc
		 */
        public containsPoint(position: Vector3D): boolean
        {
            var px: number = position.x - this._centerX, py: number = position.y - this._centerY, pz: number = position.z - this._centerZ;
            return px <= this._halfExtentsX && px >= -this._halfExtentsX && py <= this._halfExtentsY && py >= -this._halfExtentsY && pz <= this._halfExtentsZ && pz >= -this._halfExtentsZ;
        }

		/**
		 * 对包围盒进行变换
		 * @param bounds		包围盒
		 * @param matrix		变换矩阵
		 * @see http://www.cppblog.com/lovedday/archive/2008/02/23/43122.html
		 */
        public transformFrom(bounds: BoundingVolumeBase, matrix: Matrix3D)
        {
            var aabb: AxisAlignedBoundingBox = bounds as AxisAlignedBoundingBox;
            var cx: number = aabb._centerX;
            var cy: number = aabb._centerY;
            var cz: number = aabb._centerZ;
            var raw = Matrix3D.RAW_DATA_CONTAINER;
            matrix.copyRawDataTo(raw);
            var m11: number = raw[0], m12: number = raw[4], m13: number = raw[8], m14: number = raw[12];
            var m21: number = raw[1], m22: number = raw[5], m23: number = raw[9], m24: number = raw[13];
            var m31: number = raw[2], m32: number = raw[6], m33: number = raw[10], m34: number = raw[14];

            this._centerX = cx * m11 + cy * m12 + cz * m13 + m14;
            this._centerY = cx * m21 + cy * m22 + cz * m23 + m24;
            this._centerZ = cx * m31 + cy * m32 + cz * m33 + m34;

            if (m11 < 0)
                m11 = -m11;
            if (m12 < 0)
                m12 = -m12;
            if (m13 < 0)
                m13 = -m13;
            if (m21 < 0)
                m21 = -m21;
            if (m22 < 0)
                m22 = -m22;
            if (m23 < 0)
                m23 = -m23;
            if (m31 < 0)
                m31 = -m31;
            if (m32 < 0)
                m32 = -m32;
            if (m33 < 0)
                m33 = -m33;
            var hx: number = aabb._halfExtentsX;
            var hy: number = aabb._halfExtentsY;
            var hz: number = aabb._halfExtentsZ;
            this._halfExtentsX = hx * m11 + hy * m12 + hz * m13;
            this._halfExtentsY = hx * m21 + hy * m22 + hz * m23;
            this._halfExtentsZ = hx * m31 + hy * m32 + hz * m33;

            this._min.x = this._centerX - this._halfExtentsX;
            this._min.y = this._centerY - this._halfExtentsY;
            this._min.z = this._centerZ - this._halfExtentsZ;
            this._max.x = this._centerX + this._halfExtentsX;
            this._max.y = this._centerY + this._halfExtentsY;
            this._max.z = this._centerZ + this._halfExtentsZ;

            this._aabbPointsDirty = true;
        }
    }
}
