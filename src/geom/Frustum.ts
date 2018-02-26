namespace feng3d
{
    /**
     * 截头锥体,平截头体,视锥体
     */
    export class Frustum
    {
        planes: Plane3D[];

        constructor(p0 = new Plane3D(), p1 = new Plane3D(), p2 = new Plane3D(), p3 = new Plane3D(), p4 = new Plane3D(), p5 = new Plane3D())
        {
            this.planes = [p0, p1, p2, p3, p4, p5];
        }

        /**
		 * 更新视锥体6个面，平面均朝向视锥体内部
		 * @see http://www.linuxgraphics.cn/graphics/opengl_view_frustum_culling.html
		 */
        fromMatrix3D(matrix3D: Matrix4x4)
        {
            var raw = matrix3D.rawData;
            var c11 = raw[0], c12 = raw[4], c13 = raw[8], c14 = raw[12],
                c21 = raw[1], c22 = raw[5], c23 = raw[9], c24 = raw[13],
                c31 = raw[2], c32 = raw[6], c33 = raw[10], c34 = raw[14],
                c41 = raw[3], c42 = raw[7], c43 = raw[11], c44 = raw[15];

            // left plane
            this.planes[0] = new Plane3D(c41 + c11, c42 + c12, c43 + c13, (c44 + c14));
            // right plane
            this.planes[1] = new Plane3D(c41 - c11, c42 - c12, c43 - c13, -(c14 - c44));
            // bottom
            this.planes[2] = new Plane3D(c41 + c21, c42 + c22, c43 + c23, (c44 + c24));
            // top
            this.planes[3] = new Plane3D(c41 - c21, c42 - c22, c43 - c23, -(c24 - c44));
            // near
            this.planes[4] = new Plane3D(c31, c32, c33, c34);
            // far
            this.planes[5] = new Plane3D(c41 - c31, c42 - c32, c43 - c33, -(c34 - c44));
        }

        /**
         * 是否与盒子相交
         * @param box 盒子
         */
        intersectsBox(box: Box)
        {
            var center = box.min.addTo(box.max).scale(0.5);
            var halfExtents = box.max.subTo(box.min).scale(0.5);
            var planes = this.planes;

            var p = new Vector3();
            var n = new Vector3();

            for (var i = 0, numPlanes = planes.length; i < numPlanes; ++i)
            {
                var plane = planes[i];
                //最可能出现在平面内的点，即距离最可能大于0的点 (如果这个点都不在平面内的话，其他的点肯定会不在平面内)
                plane.getNormal(n);
                p.init(n.x < 0 ? -halfExtents.x : halfExtents.x, n.y < 0 ? -halfExtents.y : halfExtents.y, n.z < 0 ? -halfExtents.z : halfExtents.z)
                    .add(center);
                //小于0表示包围盒8个点都在平面内，同时就表面不存在点在视锥体内。注：视锥体6个平面朝内
                if (plane.distanceWithPoint(p) < 0)
                    return false;
            }

            return true;
        }

        /**
         * 是否与球相交
         */
        intersectsSphere(sphere: Sphere)
        {
            var planes = this.planes;
            var center = sphere.center;
            var negRadius = - sphere.radius;
            for (var i = 0; i < 6; i++)
            {
                var distance = planes[i].distanceWithPoint(center);
                if (distance < negRadius)
                {
                    return false;
                }
            }
            return true;
        }

        /**
         * 是否包含指定点
         */
        containsPoint(point)
        {
            var planes = this.planes;
            for (var i = 0; i < 6; i++)
            {
                if (planes[i].distanceWithPoint(point) < 0)
                {
                    return false;
                }
            }
            return true;
        }

        /**
         * 复制
         */
        copy(frustum: Frustum)
        {
            for (let i = 0, planes = frustum.planes, n = planes.length; i < n; i++)
            {
                this.planes[i].copy(planes[i]);
            }
            return this;
        }

        /**
         * 克隆
         */
        clone()
        {
            return new Frustum().copy(this);
        }
    }
}