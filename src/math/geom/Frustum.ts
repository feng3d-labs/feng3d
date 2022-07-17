namespace feng3d
{

    /**
     * 截头锥体
     *
     * Frustums are used to determine what is inside the camera's field of view. They help speed up the rendering process.
     *
     * Frustums用于确定摄像机的视场范围。它们有助于加速渲染过程。
     *
     * @author mrdoob / http://mrdoob.com/
     * @author alteredq / http://alteredqualia.com/
     * @author bhouston / http://clara.io
     */
    export class Frustum
    {
        planes: Plane[];

        /**
         * 初始化截头锥体
         *
         * @param p0
         * @param p1
         * @param p2
         * @param p3
         * @param p4
         * @param p5
         */
        constructor(p0 = new Plane(), p1 = new Plane(), p2 = new Plane(), p3 = new Plane(), p4 = new Plane(), p5 = new Plane())
        {
            this.planes = [
                p0, p1, p2, p3, p4, p5
            ];
        }

        set(p0: Plane, p1: Plane, p2: Plane, p3: Plane, p4: Plane, p5: Plane)
        {
            const planes = this.planes;

            planes[0].copy(p0);
            planes[1].copy(p1);
            planes[2].copy(p2);
            planes[3].copy(p3);
            planes[4].copy(p4);
            planes[5].copy(p5);

            return this;
        }

        clone()
        {
            return new Frustum().copy(this);
        }

        copy(frustum: Frustum)
        {
            const planes = this.planes;

            for (let i = 0; i < 6; i++)
            {
                planes[i].copy(frustum.planes[i]);
            }

            return this;
        }

        /**
         * 从矩阵初始化
         *
         * @param matrix4x4 矩阵
         */
        fromMatrix(matrix4x4: Matrix4x4)
        {
            const planes = this.planes;
            const me = matrix4x4.elements;
            const me0 = me[0]; const me1 = me[1]; const me2 = me[2]; const
                me3 = me[3];
            const me4 = me[4]; const me5 = me[5]; const me6 = me[6]; const
                me7 = me[7];
            const me8 = me[8]; const me9 = me[9]; const me10 = me[10]; const
                me11 = me[11];
            const me12 = me[12]; const me13 = me[13]; const me14 = me[14]; const
                me15 = me[15];

            planes[0].set(me3 - me0, me7 - me4, me11 - me8, me15 - me12).normalize();
            planes[1].set(me3 + me0, me7 + me4, me11 + me8, me15 + me12).normalize();
            planes[2].set(me3 + me1, me7 + me5, me11 + me9, me15 + me13).normalize();
            planes[3].set(me3 - me1, me7 - me5, me11 - me9, me15 - me13).normalize();
            planes[4].set(me3 - me2, me7 - me6, me11 - me10, me15 - me14).normalize();
            planes[5].set(me3 + me2, me7 + me6, me11 + me10, me15 + me14).normalize();

            return this;
        }

        /**
         * 是否与球体相交
         *
         * @param sphere 球体
         */
        intersectsSphere(sphere: Sphere)
        {
            const planes = this.planes;
            const center = sphere.center;
            const negRadius = -sphere.radius;

            for (let i = 0; i < 6; i++)
            {
                const distance = planes[i].distanceWithPoint(center);

                if (distance < negRadius)
                {
                    return false;
                }
            }

            return true;
        }

        /**
         * 是否与长方体相交
         *
         * @param box 长方体
         */
        intersectsBox(box: Box3)
        {
            const planes = this.planes;

            const temp = new Vector3();

            for (let i = 0; i < 6; i++)
            {
                const plane = planes[i];

                // corner at max distance
                const normal = plane.getNormal();

                temp.x = normal.x > 0 ? box.max.x : box.min.x;
                temp.y = normal.y > 0 ? box.max.y : box.min.y;
                temp.z = normal.z > 0 ? box.max.z : box.min.z;

                if (plane.distanceWithPoint(temp) < 0)
                {
                    return false;
                }
            }

            return true;
        }

        /**
         * 与点是否相交
         *
         * @param point
         */
        containsPoint(point: Vector3, precision = mathUtil.PRECISION)
        {
            const planes = this.planes;

            for (let i = 0; i < 6; i++)
            {
                if (planes[i].distanceWithPoint(point) < -precision)
                {
                    return false;
                }
            }

            return true;
        }
    }
}