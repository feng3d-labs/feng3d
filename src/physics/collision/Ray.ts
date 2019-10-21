namespace CANNON
{
    export class Ray
    {
        from = new feng3d.Vector3();

        to = new feng3d.Vector3();

        _direction = new feng3d.Vector3();

        /**
         * The precision of the ray. Used when checking parallelity etc.
         */
        precision = 0.0001;

        /**
         * Set to true if you want the Ray to take .collisionResponse flags into account on bodies and shapes.
         */
        checkCollisionResponse = true;

        /**
         * If set to true, the ray skips any hits with normal.dot(rayDirection) < 0.
         */
        skipBackfaces = false;

        collisionFilterMask = -1;

        collisionFilterGroup = -1;

        /**
         * The intersection mode. Should be Ray.ANY, Ray.ALL or Ray.CLOSEST.
         */
        mode = Ray.ANY;

        /**
         * Current result object.
         */
        result = new RaycastResult();

        /**
         * Will be set to true during intersectWorld() if the ray hit anything.
         */
        hasHit = false;

        /**
         * A line in 3D space that intersects bodies and return points.
         * @param from
         * @param to
         */
        constructor(from = new feng3d.Vector3(), to = new feng3d.Vector3())
        {
            this.from = from;
            this.to = to;
        }

        static CLOSEST = 1;
        static ANY = 2;
        static ALL = 4;

        /**
         * Do itersection against all bodies in the given World.
         * @param world
         * @param options
         * @return True if the ray hit anything, otherwise false.
         */
        intersectWorld(world: World, from = new feng3d.Vector3(), to = new feng3d.Vector3(), result = new RaycastResult(), mode = Ray.ANY, skipBackfaces = false, collisionFilterMask = -1,
            collisionFilterGroup = -1)
        {
            this.mode = mode;
            this.result = result;
            this.skipBackfaces = skipBackfaces;
            this.collisionFilterMask = collisionFilterMask;
            this.collisionFilterGroup = collisionFilterGroup;
            if (from)
            {
                this.from.copy(from);
            }
            if (to)
            {
                this.to.copy(to);
            }
            this.hasHit = false;

            this.result.reset();
            this._updateDirection();

            var tmpAABB = new feng3d.AABB();
            this.getAABB(tmpAABB);
            var tmpArray = [];
            world.broadphase.aabbQuery(world, tmpAABB, tmpArray);
            this.intersectBodies(tmpArray);

            return this.hasHit;
        }

        /**
         * Shoot a ray at a body, get back information about the hit.
         * @param body
         * @param result Deprecated - set the result property of the Ray instead.
         */
        private intersectBody(body: Body, result?: RaycastResult)
        {
            if (result)
            {
                this.result = result;
                this._updateDirection();
            }
            var checkCollisionResponse = this.checkCollisionResponse;

            if (checkCollisionResponse && !body.collisionResponse)
            {
                return;
            }

            if ((this.collisionFilterGroup & body.collisionFilterMask) === 0 || (body.collisionFilterGroup & this.collisionFilterMask) === 0)
            {
                return;
            }

            var xi = new feng3d.Vector3();
            var qi = new feng3d.Quaternion();

            for (var i = 0, N = body.shapes.length; i < N; i++)
            {
                var shape = body.shapes[i];

                if (checkCollisionResponse && !shape.collisionResponse)
                {
                    continue; // Skip
                }

                body.quaternion.multTo(body.shapeOrientations[i], qi);
                body.quaternion.rotatePoint(body.shapeOffsets[i], xi);
                xi.addTo(body.position, xi);

                this.intersectShape(
                    shape,
                    qi,
                    xi,
                    body
                );

                if (this.result._shouldStop)
                {
                    break;
                }
            }
        }

        /**
         * @param bodies An array of Body objects.
         * @param result Deprecated
         */
        intersectBodies(bodies: Body[], result?: RaycastResult)
        {
            if (result)
            {
                this.result = result;
                this._updateDirection();
            }

            for (var i = 0, l = bodies.length; !this.result._shouldStop && i < l; i++)
            {
                this.intersectBody(bodies[i]);
            }
        };

        /**
         * Updates the _direction vector.
         */
        private _updateDirection()
        {
            this.to.subTo(this.from, this._direction);
            this._direction.normalize();
        };

        private intersectShape(shape: Shape, quat: feng3d.Quaternion, position: feng3d.Vector3, body: Body)
        {
            var from = this.from;

            // Checking boundingSphere
            var distance = distanceFromIntersection(from, this._direction, position);
            if (distance > shape.boundingSphereRadius)
            {
                return;
            }

            var intersectMethod = this[shape.type];
            if (intersectMethod)
            {
                intersectMethod.call(this, shape, quat, position, body, shape);
            }
        }

        private intersectBox(shape: Shape, quat: feng3d.Quaternion, position: feng3d.Vector3, body: Body, reportedShape: Shape)
        {
            return this.intersectConvex(shape, quat, position, body, reportedShape);
        }

        private intersectPlane(shape: Shape, quat: feng3d.Quaternion, position: feng3d.Vector3, body: Body, reportedShape: Shape)
        {
            var from = this.from;
            var to = this.to;
            var direction = this._direction;

            // Get plane normal
            var worldNormal = new feng3d.Vector3(0, 1, 0);
            quat.rotatePoint(worldNormal, worldNormal);

            var len = new feng3d.Vector3();
            from.subTo(position, len);
            var planeToFrom = len.dot(worldNormal);
            to.subTo(position, len);
            var planeToTo = len.dot(worldNormal);

            if (planeToFrom * planeToTo > 0)
            {
                // "from" and "to" are on the same side of the plane... bail out
                return;
            }

            if (from.distance(to) < planeToFrom)
            {
                return;
            }

            var n_dot_dir = worldNormal.dot(direction);

            if (Math.abs(n_dot_dir) < this.precision)
            {
                // No intersection
                return;
            }

            var planePointToFrom = new feng3d.Vector3();
            var dir_scaled_with_t = new feng3d.Vector3();
            var hitPointWorld = new feng3d.Vector3();

            from.subTo(position, planePointToFrom);
            var t = -worldNormal.dot(planePointToFrom) / n_dot_dir;
            direction.scaleNumberTo(t, dir_scaled_with_t);
            from.addTo(dir_scaled_with_t, hitPointWorld);

            this.reportIntersection(worldNormal, hitPointWorld, reportedShape, body, -1);
        }

        /**
         * Get the world AABB of the ray.
         */
        getAABB(result: feng3d.AABB)
        {
            var to = this.to;
            var from = this.from;
            result.min.x = Math.min(to.x, from.x);
            result.min.y = Math.min(to.y, from.y);
            result.min.z = Math.min(to.z, from.z);
            result.max.x = Math.max(to.x, from.x);
            result.max.y = Math.max(to.y, from.y);
            result.max.z = Math.max(to.z, from.z);
        }
        private intersectSphere(shape: any, quat: feng3d.Quaternion, position: feng3d.Vector3, body: Body, reportedShape: Shape)
        {
            var from = this.from,
                to = this.to,
                r = shape.radius;

            var a = Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2) + Math.pow(to.z - from.z, 2);
            var b = 2 * ((to.x - from.x) * (from.x - position.x) + (to.y - from.y) * (from.y - position.y) + (to.z - from.z) * (from.z - position.z));
            var c = Math.pow(from.x - position.x, 2) + Math.pow(from.y - position.y, 2) + Math.pow(from.z - position.z, 2) - Math.pow(r, 2);

            var delta = Math.pow(b, 2) - 4 * a * c;

            var intersectionPoint = new feng3d.Vector3();
            var normal = new feng3d.Vector3();

            if (delta < 0)
            {
                // No intersection
                return;

            } else if (delta === 0)
            {
                // single intersection point
                from.lerpNumberTo(to, delta, intersectionPoint);

                intersectionPoint.subTo(position, normal);
                normal.normalize();

                this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);

            } else
            {
                var d1 = (- b - Math.sqrt(delta)) / (2 * a);
                var d2 = (- b + Math.sqrt(delta)) / (2 * a);

                if (d1 >= 0 && d1 <= 1)
                {
                    from.lerpNumberTo(to, d1, intersectionPoint);
                    intersectionPoint.subTo(position, normal);
                    normal.normalize();
                    this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
                }

                if (this.result._shouldStop)
                {
                    return;
                }

                if (d2 >= 0 && d2 <= 1)
                {
                    from.lerpNumberTo(to, d2, intersectionPoint);
                    intersectionPoint.subTo(position, normal);
                    normal.normalize();
                    this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
                }
            }
        }

        private intersectConvex(
            shape: Shape,
            quat: feng3d.Quaternion,
            position: feng3d.Vector3,
            body: Body,
            reportedShape: Shape,
            options: { faceList?: any[] } = {}
        )
        {
            var normal = new feng3d.Vector3();
            var vector = new feng3d.Vector3();
            var faceList = (options && options.faceList) || null;

            // Checking faces
            var faces = shape.faces,
                vertices = <feng3d.Vector3[]>shape.vertices,
                normals = shape.faceNormals;
            var direction = this._direction;

            var from = this.from;
            var to = this.to;
            var fromToDistance = from.distance(to);

            var Nfaces = faceList ? faceList.length : faces.length;
            var result = this.result;

            var a = new feng3d.Vector3();
            var b = new feng3d.Vector3();
            var c = new feng3d.Vector3();
            var intersectPoint = new feng3d.Vector3();

            for (var j = 0; !result._shouldStop && j < Nfaces; j++)
            {
                var fi = faceList ? faceList[j] : j;

                var face = faces[fi];
                var faceNormal = normals[fi];
                var q = quat;
                var x = position;

                // determine if ray intersects the plane of the face
                // note: this works regardless of the direction of the face normal

                // Get plane point in world coordinates...
                vector.copy(vertices[face[0]]);
                q.rotatePoint(vector, vector);
                vector.addTo(x, vector);

                // ...but make it relative to the ray from. We'll fix this later.
                vector.subTo(from, vector);

                // Get plane normal
                q.rotatePoint(faceNormal, normal);

                // If this dot product is negative, we have something interesting
                var dot = direction.dot(normal);

                // Bail out if ray and plane are parallel
                if (Math.abs(dot) < this.precision)
                {
                    continue;
                }

                // calc distance to plane
                var scalar = normal.dot(vector) / dot;

                // if negative distance, then plane is behind ray
                if (scalar < 0)
                {
                    continue;
                }

                // if (dot < 0) {

                // Intersection point is from + direction * scalar
                direction.scaleNumberTo(scalar, intersectPoint);
                intersectPoint.addTo(from, intersectPoint);

                // a is the point we compare points b and c with.
                a.copy(vertices[face[0]]);
                q.rotatePoint(a, a);
                x.addTo(a, a);

                for (var i = 1; !result._shouldStop && i < face.length - 1; i++)
                {
                    // Transform 3 vertices to world coords
                    b.copy(vertices[face[i]]);
                    c.copy(vertices[face[i + 1]]);
                    q.rotatePoint(b, b);
                    q.rotatePoint(c, c);
                    x.addTo(b, b);
                    x.addTo(c, c);

                    var distance = intersectPoint.distance(from);

                    if (!(Ray.pointInTriangle(intersectPoint, a, b, c) || Ray.pointInTriangle(intersectPoint, b, a, c)) || distance > fromToDistance)
                    {
                        continue;
                    }

                    this.reportIntersection(normal, intersectPoint, reportedShape, body, fi);
                }
                // }
            }
        }

        /**
         * 
         * @param mesh 
         * @param quat 
         * @param position 
         * @param body 
         * @param reportedShape 
         * 
         * @todo Optimize by transforming the world to local space first.
         * @todo Use Octree lookup
         */
        private intersectTrimesh(mesh: any, quat: feng3d.Quaternion, position: feng3d.Vector3, body: Body, reportedShape: Shape)
        {
            var normal = new feng3d.Vector3();
            var triangles = [];
            var treeTransform = new Transform();
            var vector = new feng3d.Vector3();
            var localDirection = new feng3d.Vector3();
            var localFrom = new feng3d.Vector3();
            var localTo = new feng3d.Vector3();
            var worldIntersectPoint = new feng3d.Vector3();
            var worldNormal = new feng3d.Vector3();

            // Checking faces
            var indices = mesh.indices;

            var from = this.from;
            var to = this.to;
            var direction = this._direction;

            treeTransform.position.copy(position);
            treeTransform.quaternion.copy(quat);

            // Transform ray to local space!
            treeTransform.vectorToLocalFrame(direction, localDirection);
            treeTransform.pointToLocalFrame(from, localFrom);
            treeTransform.pointToLocalFrame(to, localTo);

            localTo.x *= mesh.scale.x;
            localTo.y *= mesh.scale.y;
            localTo.z *= mesh.scale.z;
            localFrom.x *= mesh.scale.x;
            localFrom.y *= mesh.scale.y;
            localFrom.z *= mesh.scale.z;

            localTo.subTo(localFrom, localDirection);
            localDirection.normalize();

            var fromToDistanceSquared = localFrom.distanceSquared(localTo);

            mesh.tree.rayQuery(this, treeTransform, triangles);

            var a = new feng3d.Vector3();
            var b = new feng3d.Vector3();
            var c = new feng3d.Vector3();
            var intersectPoint = new feng3d.Vector3();

            for (var i = 0, N = triangles.length; !this.result._shouldStop && i !== N; i++)
            {
                var trianglesIndex = triangles[i];

                mesh.getNormal(trianglesIndex, normal);

                // determine if ray intersects the plane of the face
                // note: this works regardless of the direction of the face normal

                // Get plane point in world coordinates...
                mesh.getVertex(indices[trianglesIndex * 3], a);

                // ...but make it relative to the ray from. We'll fix this later.
                a.subTo(localFrom, vector);

                // If this dot product is negative, we have something interesting
                var dot = localDirection.dot(normal);

                // Bail out if ray and plane are parallel
                // if (Math.abs( dot ) < this.precision){
                //     continue;
                // }

                // calc distance to plane
                var scalar = normal.dot(vector) / dot;

                // if negative distance, then plane is behind ray
                if (scalar < 0)
                {
                    continue;
                }

                // Intersection point is from + direction * scalar
                localDirection.scaleNumberTo(scalar, intersectPoint);
                intersectPoint.addTo(localFrom, intersectPoint);

                // Get triangle vertices
                mesh.getVertex(indices[trianglesIndex * 3 + 1], b);
                mesh.getVertex(indices[trianglesIndex * 3 + 2], c);

                var squaredDistance = intersectPoint.distanceSquared(localFrom);

                if (!(Ray.pointInTriangle(intersectPoint, b, a, c) || Ray.pointInTriangle(intersectPoint, a, b, c)) || squaredDistance > fromToDistanceSquared)
                {
                    continue;
                }

                // transform intersectpoint and normal to world
                treeTransform.vectorToWorldFrame(normal, worldNormal);
                treeTransform.pointToWorldFrame(intersectPoint, worldIntersectPoint);
                this.reportIntersection(worldNormal, worldIntersectPoint, reportedShape, body, trianglesIndex);
            }
            triangles.length = 0;
        }

        private reportIntersection(normal: feng3d.Vector3, hitPointWorld: feng3d.Vector3, shape: Shape, body: Body, hitFaceIndex = - 1)
        {
            var from = this.from;
            var to = this.to;
            var distance = from.distance(hitPointWorld);
            var result = this.result;

            // Skip back faces?
            if (this.skipBackfaces && normal.dot(this._direction) > 0)
            {
                return;
            }

            result.hitFaceIndex = hitFaceIndex;

            switch (this.mode)
            {
                case Ray.ALL:
                    this.hasHit = true;
                    result.set(normal, hitPointWorld, shape, body, distance);
                    result.hasHit = true;
                    break;

                case Ray.CLOSEST:

                    // Store if closer than current closest
                    if (distance < result.distance || !result.hasHit)
                    {
                        this.hasHit = true;
                        result.hasHit = true;
                        result.set(normal, hitPointWorld, shape, body, distance);
                    }
                    break;

                case Ray.ANY:

                    // Report and stop.
                    this.hasHit = true;
                    result.hasHit = true;
                    result.set(normal, hitPointWorld, shape, body, distance);
                    result._shouldStop = true;
                    break;
            }
        }

        /*
         * As per "Barycentric Technique" as named here http://www.blackpawn.com/texts/pointinpoly/default.html But without the division
         */
        static pointInTriangle(p: feng3d.Vector3, a: feng3d.Vector3, b: feng3d.Vector3, c: feng3d.Vector3)
        {
            var v0 = new feng3d.Vector3();
            var v1 = new feng3d.Vector3();
            var v2 = new feng3d.Vector3();

            c.subTo(a, v0);
            b.subTo(a, v1);
            p.subTo(a, v2);

            var dot00 = v0.dot(v0);
            var dot01 = v0.dot(v1);
            var dot02 = v0.dot(v2);
            var dot11 = v1.dot(v1);
            var dot12 = v1.dot(v2);

            var u: number, v: number;

            return ((u = dot11 * dot02 - dot01 * dot12) >= 0) &&
                ((v = dot00 * dot12 - dot01 * dot02) >= 0) &&
                (u + v < (dot00 * dot11 - dot01 * dot01));
        }

    }

    Ray.prototype[ShapeType.BOX] = Ray.prototype["intersectBox"];
    Ray.prototype[ShapeType.PLANE] = Ray.prototype["intersectPlane"];

    Ray.prototype[ShapeType.HEIGHTFIELD] = Ray.prototype["intersectHeightfield"];
    Ray.prototype[ShapeType.SPHERE] = Ray.prototype["intersectSphere"];

    Ray.prototype[ShapeType.TRIMESH] = Ray.prototype["intersectTrimesh"];
    Ray.prototype[ShapeType.CONVEXPOLYHEDRON] = Ray.prototype["intersectConvex"];

    function distanceFromIntersection(from: feng3d.Vector3, direction: feng3d.Vector3, position: feng3d.Vector3)
    {
        // v0 is vector from from to position
        var v0 = position.subTo(from);
        var dot = v0.dot(direction);

        // intersect = direction*dot + from
        var intersect = direction.multiplyNumberTo(dot);
        intersect.addTo(from, intersect);

        var distance = position.distance(intersect);

        return distance;
    }
}