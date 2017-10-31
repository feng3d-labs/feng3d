module feng3d
{
    export var bounding = {
        getboundingpoints: getboundingpoints,
        transform: transform,
        containsPoint: containsPoint,
        isInFrustum: isInFrustum,
        rayIntersection: rayIntersection,
    };

    export interface IBounding
    {
        min: Vector3D;
        max: Vector3D;
    }

    function getboundingpoints(bounding: IBounding)
    {
        var min = bounding.min;
        var max = bounding.max;
        return [
            new Vector3D(min.x, min.y, min.z),
            new Vector3D(max.x, min.y, min.z),
            new Vector3D(min.x, max.y, min.z),
            new Vector3D(min.x, min.y, max.z),
            new Vector3D(min.x, max.y, max.z),
            new Vector3D(max.x, min.y, max.z),
            new Vector3D(max.x, max.y, min.z),
            new Vector3D(max.x, max.y, max.z),
        ];
    }

    function transform(bounding: IBounding, matrix: Matrix3D, outbounding?: IBounding)
    {
        var points = getboundingpoints(bounding);

        for (var i = 0; i < points.length; i++)
        {
            matrix.transformVector(points[i], points[i]);
        }

        var newbounding = getboundingfrompoints(points, outbounding);
        return newbounding;
    }

    function getboundingfrompoints(points: Vector3D[], outbounding?: IBounding)
    {
        var min = new Vector3D(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        var max = new Vector3D(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE)
        for (var i = 0; i < points.length; i++)
        {
            min.x = Math.min(min.x, points[i].x);
            min.y = Math.min(min.y, points[i].y);
            min.z = Math.min(min.z, points[i].z);
            //
            max.x = Math.max(max.x, points[i].x);
            max.y = Math.max(max.y, points[i].y);
            max.z = Math.max(max.z, points[i].z);
        }
        if (outbounding)
        {
            outbounding.min.x = min.x;
            outbounding.min.y = min.y;
            outbounding.min.z = min.z;
            outbounding.max.x = max.x;
            outbounding.max.y = max.y;
            outbounding.max.z = max.z;
            return outbounding;
        }
        return { min: min, max: max };
    }

    function containsPoint(bounding: IBounding, position: Vector3D): boolean
    {
        var center = bounding.min.add(bounding.max).scaleBy(0.5);
        var halfExtents = bounding.max.subtract(bounding.min).scaleBy(0.5);

        var px = position.x - center.x, py = position.y - center.y, pz = position.z - center.z;
        return px <= halfExtents.x && px >= -halfExtents.x && py <= halfExtents.y && py >= -halfExtents.y && pz <= halfExtents.z && pz >= -halfExtents.z;
    }

    /**
     * 测试轴对其包围盒是否出现在摄像机视锥体内
     * @param planes 		视锥体面向量
     * @return 				true：出现在视锥体内
     * @see me.feng3d.cameras.Camera3D.updateFrustum()
     */
    function isInFrustum(bounding: IBounding, planes: Plane3D[], numPlanes: number): boolean
    {
        if (!bounding)
            return false;
        var center = bounding.min.add(bounding.max).scaleBy(0.5);
        var halfExtents = bounding.max.subtract(bounding.min).scaleBy(0.5);

        for (var i = 0; i < numPlanes; ++i)
        {
            var plane: Plane3D = planes[i];
            var a = plane.a;
            var b = plane.b;
            var c = plane.c;
            //最可能出现在平面内的点，即距离最可能大于0的点 (如果这个点都不在平面内的话，其他的点肯定会不在平面内)
            var flippedExtentX = a < 0 ? -halfExtents.x : halfExtents.x;
            var flippedExtentY = b < 0 ? -halfExtents.y : halfExtents.y;
            var flippedExtentZ = c < 0 ? -halfExtents.z : halfExtents.z;
            var projDist = a * (center.x + flippedExtentX) + b * (center.y + flippedExtentY) + c * (center.z + flippedExtentZ) - plane.d;
            //小于0表示包围盒8个点都在平面内，同时就表面不存在点在视锥体内。注：视锥体6个平面朝内
            if (projDist < 0)
                return false;
        }

        return true;
    }

    function rayIntersection(bounding: IBounding, ray3D: Ray3D, targetNormal: Vector3D): number
    {
        var position: Vector3D = ray3D.position;
        var direction: Vector3D = ray3D.direction;
        if (containsPoint(bounding, position))
            return 0;
        var center = bounding.min.add(bounding.max).scaleBy(0.5);
        var halfExtents = bounding.max.subtract(bounding.min).scaleBy(0.5);

        var px = position.x - center.x, py = position.y - center.y, pz = position.z - center.z;
        var vx = direction.x, vy = direction.y, vz = direction.z;
        var ix: number, iy: number, iz: number;
        var rayEntryDistance = -1;

        // ray-plane tests
        var intersects = false;
        if (vx < 0)
        {
            rayEntryDistance = (halfExtents.x - px) / vx;
            if (rayEntryDistance > 0)
            {
                iy = py + rayEntryDistance * vy;
                iz = pz + rayEntryDistance * vz;
                if (iy > -halfExtents.y && iy < halfExtents.y && iz > -halfExtents.z && iz < halfExtents.z)
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
            rayEntryDistance = (-halfExtents.x - px) / vx;
            if (rayEntryDistance > 0)
            {
                iy = py + rayEntryDistance * vy;
                iz = pz + rayEntryDistance * vz;
                if (iy > -halfExtents.y && iy < halfExtents.y && iz > -halfExtents.z && iz < halfExtents.z)
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
            rayEntryDistance = (halfExtents.y - py) / vy;
            if (rayEntryDistance > 0)
            {
                ix = px + rayEntryDistance * vx;
                iz = pz + rayEntryDistance * vz;
                if (ix > -halfExtents.x && ix < halfExtents.x && iz > -halfExtents.z && iz < halfExtents.z)
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
            rayEntryDistance = (-halfExtents.y - py) / vy;
            if (rayEntryDistance > 0)
            {
                ix = px + rayEntryDistance * vx;
                iz = pz + rayEntryDistance * vz;
                if (ix > -halfExtents.x && ix < halfExtents.x && iz > -halfExtents.z && iz < halfExtents.z)
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
            rayEntryDistance = (halfExtents.z - pz) / vz;
            if (rayEntryDistance > 0)
            {
                ix = px + rayEntryDistance * vx;
                iy = py + rayEntryDistance * vy;
                if (iy > -halfExtents.y && iy < halfExtents.y && ix > -halfExtents.x && ix < halfExtents.x)
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
            rayEntryDistance = (-halfExtents.z - pz) / vz;
            if (rayEntryDistance > 0)
            {
                ix = px + rayEntryDistance * vx;
                iy = py + rayEntryDistance * vy;
                if (iy > -halfExtents.y && iy < halfExtents.y && ix > -halfExtents.x && ix < halfExtents.x)
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
}
