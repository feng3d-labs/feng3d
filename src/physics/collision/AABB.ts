namespace CANNON
{
    export class AABB
    {
        /**
         * The lower bound of the bounding box.
         */
        lowerBound: Vec3;

        /**
         * The upper bound of the bounding box.
         */
        upperBound: Vec3;

        /**
         * 
         * @param options 
         * 
         * Axis aligned bounding box class.
         */
        constructor(options: { lowerBound?: Vec3, upperBound?: Vec3 } = {})
        {
            this.lowerBound = new Vec3();
            if (options.lowerBound)
            {
                this.lowerBound.copy(options.lowerBound);
            }

            this.upperBound = new Vec3();
            if (options.upperBound)
            {
                this.upperBound.copy(options.upperBound);
            }
        }

        /**
         * Set the AABB bounds from a set of points.
         * @param points An array of Vec3's.
         * @param position
         * @param quaternion
         * @param skinSize
         * @return The self object
         */
        setFromPoints(points: Vec3[], position?: Vec3, quaternion?: Quaternion, skinSize?: number)
        {
            var l = this.lowerBound,
                u = this.upperBound,
                q = quaternion;

            // Set to the first point
            l.copy(points[0]);
            if (q)
            {
                q.vmult(l, l);
            }
            u.copy(l);

            for (var i = 1; i < points.length; i++)
            {
                var p = points[i];

                if (q)
                {
                    q.vmult(p, tmp);
                    p = tmp;
                }

                if (p.x > u.x) { u.x = p.x; }
                if (p.x < l.x) { l.x = p.x; }
                if (p.y > u.y) { u.y = p.y; }
                if (p.y < l.y) { l.y = p.y; }
                if (p.z > u.z) { u.z = p.z; }
                if (p.z < l.z) { l.z = p.z; }
            }

            // Add offset
            if (position)
            {
                position.vadd(l, l);
                position.vadd(u, u);
            }

            if (skinSize)
            {
                l.x -= skinSize;
                l.y -= skinSize;
                l.z -= skinSize;
                u.x += skinSize;
                u.y += skinSize;
                u.z += skinSize;
            }

            return this;
        }

        /**
         * Copy bounds from an AABB to this AABB
         * @param aabb Source to copy from
         * @return The this object, for chainability
         */
        copy(aabb: AABB)
        {
            this.lowerBound.copy(aabb.lowerBound);
            this.upperBound.copy(aabb.upperBound);
            return this;
        }

        /**
         * Clone an AABB
         */
        clone()
        {
            return new AABB().copy(this);
        }

        /**
         * Extend this AABB so that it covers the given AABB too.
         * @param aabb
         */
        extend(aabb: AABB)
        {
            this.lowerBound.x = Math.min(this.lowerBound.x, aabb.lowerBound.x);
            this.upperBound.x = Math.max(this.upperBound.x, aabb.upperBound.x);
            this.lowerBound.y = Math.min(this.lowerBound.y, aabb.lowerBound.y);
            this.upperBound.y = Math.max(this.upperBound.y, aabb.upperBound.y);
            this.lowerBound.z = Math.min(this.lowerBound.z, aabb.lowerBound.z);
            this.upperBound.z = Math.max(this.upperBound.z, aabb.upperBound.z);
        }

        /**
         * Returns true if the given AABB overlaps this AABB.
         * @param aabb
         */
        overlaps(aabb: AABB)
        {
            var l1 = this.lowerBound,
                u1 = this.upperBound,
                l2 = aabb.lowerBound,
                u2 = aabb.upperBound;

            //      l2        u2
            //      |---------|
            // |--------|
            // l1       u1

            var overlapsX = ((l2.x <= u1.x && u1.x <= u2.x) || (l1.x <= u2.x && u2.x <= u1.x));
            var overlapsY = ((l2.y <= u1.y && u1.y <= u2.y) || (l1.y <= u2.y && u2.y <= u1.y));
            var overlapsZ = ((l2.z <= u1.z && u1.z <= u2.z) || (l1.z <= u2.z && u2.z <= u1.z));

            return overlapsX && overlapsY && overlapsZ;
        }

        /**
         * Mostly for debugging
         */
        volume()
        {
            var l = this.lowerBound,
                u = this.upperBound;
            return (u.x - l.x) * (u.y - l.y) * (u.z - l.z);
        }


        /**
         * Returns true if the given AABB is fully contained in this AABB.
         * @param aabb
         */
        contains(aabb: AABB)
        {
            var l1 = this.lowerBound,
                u1 = this.upperBound,
                l2 = aabb.lowerBound,
                u2 = aabb.upperBound;

            //      l2        u2
            //      |---------|
            // |---------------|
            // l1              u1

            return (
                (l1.x <= l2.x && u1.x >= u2.x) &&
                (l1.y <= l2.y && u1.y >= u2.y) &&
                (l1.z <= l2.z && u1.z >= u2.z)
            );
        }

        getCorners(a: Vec3, b: Vec3, c: Vec3, d: Vec3, e: Vec3, f: Vec3, g: Vec3, h: Vec3)
        {
            var l = this.lowerBound,
                u = this.upperBound;

            a.copy(l);
            b.set(u.x, l.y, l.z);
            c.set(u.x, u.y, l.z);
            d.set(l.x, u.y, u.z);
            e.set(u.x, l.y, l.z);
            f.set(l.x, u.y, l.z);
            g.set(l.x, l.y, u.z);
            h.copy(u);
        }

        /**
         * Get the representation of an AABB in another frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        toLocalFrame(frame: Transform, target: AABB)
        {
            var corners = transformIntoFrame_corners;
            var a = corners[0];
            var b = corners[1];
            var c = corners[2];
            var d = corners[3];
            var e = corners[4];
            var f = corners[5];
            var g = corners[6];
            var h = corners[7];

            // Get corners in current frame
            this.getCorners(a, b, c, d, e, f, g, h);

            // Transform them to new local frame
            for (var i = 0; i !== 8; i++)
            {
                var corner = corners[i];
                frame.pointToLocal(corner, corner);
            }

            return target.setFromPoints(corners);
        }

        /**
         * Get the representation of an AABB in the global frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        toWorldFrame(frame: Transform, target: AABB)
        {

            var corners = transformIntoFrame_corners;
            var a = corners[0];
            var b = corners[1];
            var c = corners[2];
            var d = corners[3];
            var e = corners[4];
            var f = corners[5];
            var g = corners[6];
            var h = corners[7];

            // Get corners in current frame
            this.getCorners(a, b, c, d, e, f, g, h);

            // Transform them to new local frame
            for (var i = 0; i !== 8; i++)
            {
                var corner = corners[i];
                frame.pointToWorld(corner, corner);
            }

            return target.setFromPoints(corners);
        }

        /**
         * Check if the AABB is hit by a ray.
         */
        overlapsRay(ray: Ray)
        {
            var t = 0;

            // ray.direction is unit direction vector of ray
            var dirFracX = 1 / ray._direction.x;
            var dirFracY = 1 / ray._direction.y;
            var dirFracZ = 1 / ray._direction.z;

            // this.lowerBound is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
            var t1 = (this.lowerBound.x - ray.from.x) * dirFracX;
            var t2 = (this.upperBound.x - ray.from.x) * dirFracX;
            var t3 = (this.lowerBound.y - ray.from.y) * dirFracY;
            var t4 = (this.upperBound.y - ray.from.y) * dirFracY;
            var t5 = (this.lowerBound.z - ray.from.z) * dirFracZ;
            var t6 = (this.upperBound.z - ray.from.z) * dirFracZ;

            // var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)));
            // var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)));
            var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
            var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

            // if tmax < 0, ray (line) is intersecting AABB, but whole AABB is behing us
            if (tmax < 0)
            {
                //t = tmax;
                return false;
            }

            // if tmin > tmax, ray doesn't intersect AABB
            if (tmin > tmax)
            {
                //t = tmax;
                return false;
            }

            return true;
        }

    }

    var tmp = new Vec3();
    var transformIntoFrame_corners = [
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3()
    ];
}