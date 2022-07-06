namespace CANNON
{
    export class Narrowphase
    {
        /**
         * Internal storage of pooled contact points.
         */
        contactPointPool: ContactEquation[];
        frictionEquationPool: FrictionEquation[];
        result: ContactEquation[];
        frictionResult: FrictionEquation[];
        world: World;
        currentContactMaterial: ContactMaterial;
        enableFrictionReduction: boolean;

        /**
         * Helper class for the World. Generates ContactEquations.
         * @class Narrowphase
         * @constructor
         * @todo Sphere-ConvexPolyhedron contacts
         * @todo Contact reduction
         * @todo  should move methods to prototype
         */
        constructor(world: World)
        {
            this.contactPointPool = [];

            this.frictionEquationPool = [];

            this.result = [];
            this.frictionResult = [];

            this.world = world;
            this.currentContactMaterial = null;

            this.enableFrictionReduction = false;
        }

        /**
         * Make a contact object, by using the internal pool or creating a new one.
         * 
         * @param bi 
         * @param bj 
         * @param si 
         * @param sj 
         * @param overrideShapeA 
         * @param overrideShapeB 
         */
        createContactEquation(bi: Body, bj: Body, si: Shape, sj: Shape, overrideShapeA: Shape, overrideShapeB: Shape)
        {
            var c: ContactEquation;
            if (this.contactPointPool.length)
            {
                c = this.contactPointPool.pop();
                c.bi = bi;
                c.bj = bj;
            } else
            {
                c = new ContactEquation(bi, bj);
            }

            c.enabled = bi.collisionResponse && bj.collisionResponse && si.collisionResponse && sj.collisionResponse;

            var cm = this.currentContactMaterial;

            c.restitution = cm.restitution;

            c.setSpookParams(
                cm.contactEquationStiffness,
                cm.contactEquationRelaxation,
                this.world.dt
            );

            var matA = si.material || bi.material;
            var matB = sj.material || bj.material;
            if (matA && matB && matA.restitution >= 0 && matB.restitution >= 0)
            {
                c.restitution = matA.restitution * matB.restitution;
            }

            c.si = overrideShapeA || si;
            c.sj = overrideShapeB || sj;

            return c;
        };

        createFrictionEquationsFromContact(contactEquation: ContactEquation, outArray: FrictionEquation[])
        {
            var bodyA = contactEquation.bi;
            var bodyB = contactEquation.bj;
            var shapeA = contactEquation.si;
            var shapeB = contactEquation.sj;

            var world = this.world;
            var cm = this.currentContactMaterial;

            // If friction or restitution were specified in the material, use them
            var friction = cm.friction;
            var matA = shapeA.material || bodyA.material;
            var matB = shapeB.material || bodyB.material;
            if (matA && matB && matA.friction >= 0 && matB.friction >= 0)
            {
                friction = matA.friction * matB.friction;
            }

            if (friction > 0)
            {
                // Create 2 tangent equations
                var mug = friction * world.gravity.length;
                var reducedMass = (bodyA.invMass + bodyB.invMass);
                if (reducedMass > 0)
                {
                    reducedMass = 1 / reducedMass;
                }
                var pool = this.frictionEquationPool;
                var c1: FrictionEquation = pool.length ? pool.pop() : new FrictionEquation(bodyA, bodyB, mug * reducedMass);
                var c2: FrictionEquation = pool.length ? pool.pop() : new FrictionEquation(bodyA, bodyB, mug * reducedMass);

                c1.bi = c2.bi = bodyA;
                c1.bj = c2.bj = bodyB;
                c1.minForce = c2.minForce = -mug * reducedMass;
                c1.maxForce = c2.maxForce = mug * reducedMass;

                // Copy over the relative vectors
                c1.ri.copy(contactEquation.ri);
                c1.rj.copy(contactEquation.rj);
                c2.ri.copy(contactEquation.ri);
                c2.rj.copy(contactEquation.rj);

                // Construct tangents
                contactEquation.ni.tangents(c1.t, c2.t);

                // Set spook params
                c1.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, world.dt);
                c2.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, world.dt);

                c1.enabled = c2.enabled = contactEquation.enabled;

                outArray.push(c1, c2);

                return true;
            }

            return false;
        }

        // Take the average N latest contact point on the plane.
        createFrictionFromAverage(numContacts: number)
        {
            // The last contactEquation
            var c = this.result[this.result.length - 1];

            // Create the result: two "average" friction equations
            if (!this.createFrictionEquationsFromContact(c, this.frictionResult) || numContacts === 1)
            {
                return;
            }

            var f1 = this.frictionResult[this.frictionResult.length - 2];
            var f2 = this.frictionResult[this.frictionResult.length - 1];

            averageNormal.setZero();
            averageContactPointA.setZero();
            averageContactPointB.setZero();

            var bodyA = c.bi;
            var bodyB = c.bj;
            for (var i = 0; i !== numContacts; i++)
            {
                c = this.result[this.result.length - 1 - i];
                if (c.bodyA !== bodyA)
                {
                    averageNormal.addTo(c.ni, averageNormal);
                    averageContactPointA.addTo(c.ri, averageContactPointA);
                    averageContactPointB.addTo(c.rj, averageContactPointB);
                } else
                {
                    averageNormal.subTo(c.ni, averageNormal);
                    averageContactPointA.addTo(c.rj, averageContactPointA);
                    averageContactPointB.addTo(c.ri, averageContactPointB);
                }
            }

            var invNumContacts = 1 / numContacts;
            averageContactPointA.scaleNumberTo(invNumContacts, f1.ri);
            averageContactPointB.scaleNumberTo(invNumContacts, f1.rj);
            f2.ri.copy(f1.ri); // Should be the same
            f2.rj.copy(f1.rj);
            averageNormal.normalize();
            averageNormal.tangents(f1.t, f2.t);
            // return eq;
        }

        /**
         * Generate all contacts between a list of body pairs
         * @method getContacts
         * @param {array} p1 Array of body indices
         * @param {array} p2 Array of body indices
         * @param {World} world
         * @param {array} result Array to store generated contacts
         * @param {array} oldcontacts Optional. Array of reusable contact objects
         */
        getContacts(p1: Body[], p2: Body[], world: World, result: ContactEquation[], oldcontacts: ContactEquation[], frictionResult: FrictionEquation[], frictionPool: FrictionEquation[])
        {
            // Save old contact objects
            this.contactPointPool = oldcontacts;
            this.frictionEquationPool = frictionPool;
            this.result = result;
            this.frictionResult = frictionResult;

            var qi = tmpQuat1;
            var qj = tmpQuat2;
            var xi = tmpVec1;
            var xj = tmpVec2;

            for (var k = 0, N = p1.length; k !== N; k++)
            {

                // Get current collision bodies
                var bi = p1[k],
                    bj = p2[k];

                // Get contact material
                var bodyContactMaterial: ContactMaterial = null;
                if (bi.material && bj.material)
                {
                    bodyContactMaterial = world.getContactMaterial(bi.material, bj.material) || null;
                }

                var justTest = (
                    (
                        (bi.type & Body.KINEMATIC) && (bj.type & Body.STATIC)
                    ) || (
                        (bi.type & Body.STATIC) && (bj.type & Body.KINEMATIC)
                    ) || (
                        (bi.type & Body.KINEMATIC) && (bj.type & Body.KINEMATIC)
                    )
                );

                for (var i = 0; i < bi.shapes.length; i++)
                {
                    bi.quaternion.multTo(bi.shapeOrientations[i], qi);
                    bi.quaternion.vmult(bi.shapeOffsets[i], xi);
                    xi.addTo(bi.position, xi);
                    var si = bi.shapes[i];

                    for (var j = 0; j < bj.shapes.length; j++)
                    {

                        // Compute world transform of shapes
                        bj.quaternion.multTo(bj.shapeOrientations[j], qj);
                        bj.quaternion.vmult(bj.shapeOffsets[j], xj);
                        xj.addTo(bj.position, xj);
                        var sj = bj.shapes[j];

                        if (!((si.collisionFilterMask & sj.collisionFilterGroup) && (sj.collisionFilterMask & si.collisionFilterGroup)))
                        {
                            continue;
                        }

                        if (xi.distance(xj) > si.boundingSphereRadius + sj.boundingSphereRadius)
                        {
                            continue;
                        }

                        // Get collision material
                        var shapeContactMaterial: ContactMaterial = null;
                        if (si.material && sj.material)
                        {
                            shapeContactMaterial = world.getContactMaterial(si.material, sj.material) || null;
                        }

                        this.currentContactMaterial = shapeContactMaterial || bodyContactMaterial || world.defaultContactMaterial;

                        // Get contacts
                        var resolver = this[si.type | sj.type];
                        if (resolver)
                        {
                            var retval = false;
                            if (si.type < sj.type)
                            {
                                retval = resolver.call(this, si, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
                            } else
                            {
                                retval = resolver.call(this, sj, si, xj, xi, qj, qi, bj, bi, si, sj, justTest);
                            }

                            if (retval && justTest)
                            {
                                // Register overlap
                                world.shapeOverlapKeeper.set(si.id, sj.id);
                                world.bodyOverlapKeeper.set(bi.id, bj.id);
                            }
                        }
                    }
                }
            }
        }

        boxBox(si: Box, sj: Box, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            si.convexPolyhedronRepresentation.material = si.material;
            sj.convexPolyhedronRepresentation.material = sj.material;
            si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
            sj.convexPolyhedronRepresentation.collisionResponse = sj.collisionResponse;
            return this.convexConvex(si.convexPolyhedronRepresentation, sj.convexPolyhedronRepresentation, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        }

        boxConvex(si: Box, sj: ConvexPolyhedron, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            si.convexPolyhedronRepresentation.material = si.material;
            si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
            return this.convexConvex(si.convexPolyhedronRepresentation, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        }

        boxParticle(si: Box, sj: Particle, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            si.convexPolyhedronRepresentation.material = si.material;
            si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
            return this.convexParticle(si.convexPolyhedronRepresentation, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        }

        sphereSphere(si: Sphere, sj: Sphere, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape, rsj?: Shape, justTest?: boolean)
        {
            if (justTest)
            {
                return xi.distanceSquared(xj) < Math.pow(si.radius + sj.radius, 2);
            }

            // We will have only one contact in this case
            var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);

            // Contact normal
            xj.subTo(xi, r.ni);
            r.ni.normalize();

            // Contact point locations
            r.ri.copy(r.ni);
            r.rj.copy(r.ni);
            r.ri.scaleNumberTo(si.radius, r.ri);
            r.rj.scaleNumberTo(-sj.radius, r.rj);

            r.ri.addTo(xi, r.ri);
            r.ri.subTo(bi.position, r.ri);

            r.rj.addTo(xj, r.rj);
            r.rj.subTo(bj.position, r.rj);

            this.result.push(r);

            this.createFrictionEquationsFromContact(r, this.frictionResult);
        };

        /**
         * @method planeTrimesh
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vector3}       xi
         * @param  {Vector3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        planeTrimesh(
            planeShape: Plane,
            trimeshShape: Trimesh,
            planePos: Vector3,
            trimeshPos: Vector3,
            planeQuat: Quaternion,
            trimeshQuat: Quaternion,
            planeBody: Body,
            trimeshBody: Body,
            rsi: Shape,
            rsj: Shape,
            justTest: boolean
        )
        {
            // Make contacts!
            var v = new Vector3();

            var normal = planeTrimesh_normal;
            normal.copy(World.worldNormal);
            planeQuat.vmult(normal, normal); // Turn normal according to plane

            for (var i = 0; i < trimeshShape.vertices.length / 3; i++)
            {

                // Get world vertex from trimesh
                trimeshShape.getVertex(i, v);

                // Safe up
                var v2 = new Vector3();
                v2.copy(v);
                Transform.pointToWorldFrame(trimeshPos, trimeshQuat, v2, v);

                // Check plane side
                var relpos = planeTrimesh_relpos;
                v.subTo(planePos, relpos);
                var dot = normal.dot(relpos);

                if (dot <= 0.0)
                {
                    if (justTest)
                    {
                        return true;
                    }

                    var r = this.createContactEquation(planeBody, trimeshBody, planeShape, trimeshShape, rsi, rsj);

                    r.ni.copy(normal); // Contact normal is the plane normal

                    // Get vertex position projected on plane
                    var projected = planeTrimesh_projected;
                    normal.scaleNumberTo(relpos.dot(normal), projected);
                    v.subTo(projected, projected);

                    // ri is the projected world position minus plane position
                    r.ri.copy(projected);
                    r.ri.subTo(planeBody.position, r.ri);

                    r.rj.copy(v);
                    r.rj.subTo(trimeshBody.position, r.rj);

                    // Store result
                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                }
            }
        }

        sphereTrimesh(
            sphereShape: Sphere,
            trimeshShape: Trimesh,
            spherePos: Vector3,
            trimeshPos: Vector3,
            sphereQuat: Quaternion,
            trimeshQuat: Quaternion,
            sphereBody: Body,
            trimeshBody: Body,
            rsi: Shape,
            rsj: Shape,
            justTest: boolean
        )
        {
            var edgeVertexA = sphereTrimesh_edgeVertexA;
            var edgeVertexB = sphereTrimesh_edgeVertexB;
            var edgeVector = sphereTrimesh_edgeVector;
            var edgeVectorUnit = sphereTrimesh_edgeVectorUnit;
            var localSpherePos = sphereTrimesh_localSpherePos;
            var tmp = sphereTrimesh_tmp;
            var localSphereAABB = sphereTrimesh_localSphereAABB;
            var v2 = sphereTrimesh_v2;
            var relpos = sphereTrimesh_relpos;
            var triangles = sphereTrimesh_triangles;

            // Convert sphere position to local in the trimesh
            Transform.pointToLocalFrame(trimeshPos, trimeshQuat, spherePos, localSpherePos);

            // Get the aabb of the sphere locally in the trimesh
            var sphereRadius = sphereShape.radius;
            localSphereAABB.min.set(
                localSpherePos.x - sphereRadius,
                localSpherePos.y - sphereRadius,
                localSpherePos.z - sphereRadius
            );
            localSphereAABB.max.set(
                localSpherePos.x + sphereRadius,
                localSpherePos.y + sphereRadius,
                localSpherePos.z + sphereRadius
            );

            trimeshShape.getTrianglesInAABB(localSphereAABB, triangles);
            //for (var i = 0; i < trimeshShape.indices.length / 3; i++) triangles.push(i); // All

            // Vertices
            var v = sphereTrimesh_v;
            var radiusSquared = sphereShape.radius * sphereShape.radius;
            for (var i = 0; i < triangles.length; i++)
            {
                for (var j = 0; j < 3; j++)
                {

                    trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + j], v);

                    // Check vertex overlap in sphere
                    v.subTo(localSpherePos, relpos);

                    if (relpos.lengthSquared <= radiusSquared)
                    {

                        // Safe up
                        v2.copy(v);
                        Transform.pointToWorldFrame(trimeshPos, trimeshQuat, v2, v);

                        v.subTo(spherePos, relpos);

                        if (justTest)
                        {
                            return true;
                        }

                        var r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);
                        r.ni.copy(relpos);
                        r.ni.normalize();

                        // ri is the vector from sphere center to the sphere surface
                        r.ri.copy(r.ni);
                        r.ri.scaleNumberTo(sphereShape.radius, r.ri);
                        r.ri.addTo(spherePos, r.ri);
                        r.ri.subTo(sphereBody.position, r.ri);

                        r.rj.copy(v);
                        r.rj.subTo(trimeshBody.position, r.rj);

                        // Store result
                        this.result.push(r);
                        this.createFrictionEquationsFromContact(r, this.frictionResult);
                    }
                }
            }

            // Check all edges
            for (var i = 0; i < triangles.length; i++)
            {
                for (var j = 0; j < 3; j++)
                {

                    trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + j], edgeVertexA);
                    trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + ((j + 1) % 3)], edgeVertexB);
                    edgeVertexB.subTo(edgeVertexA, edgeVector);

                    // Project sphere position to the edge
                    localSpherePos.subTo(edgeVertexB, tmp);
                    var positionAlongEdgeB = tmp.dot(edgeVector);

                    localSpherePos.subTo(edgeVertexA, tmp);
                    var positionAlongEdgeA = tmp.dot(edgeVector);

                    if (positionAlongEdgeA > 0 && positionAlongEdgeB < 0)
                    {

                        // Now check the orthogonal distance from edge to sphere center
                        localSpherePos.subTo(edgeVertexA, tmp);

                        edgeVectorUnit.copy(edgeVector);
                        edgeVectorUnit.normalize();
                        positionAlongEdgeA = tmp.dot(edgeVectorUnit);

                        edgeVectorUnit.scaleNumberTo(positionAlongEdgeA, tmp);
                        tmp.addTo(edgeVertexA, tmp);

                        // tmp is now the sphere center position projected to the edge, defined locally in the trimesh frame
                        var dist = tmp.distance(localSpherePos);
                        if (dist < sphereShape.radius)
                        {

                            if (justTest)
                            {
                                return true;
                            }

                            var r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);

                            tmp.subTo(localSpherePos, r.ni);
                            r.ni.normalize();
                            r.ni.scaleNumberTo(sphereShape.radius, r.ri);

                            Transform.pointToWorldFrame(trimeshPos, trimeshQuat, tmp, tmp);
                            tmp.subTo(trimeshBody.position, r.rj);

                            Transform.vectorToWorldFrame(trimeshQuat, r.ni, r.ni);
                            Transform.vectorToWorldFrame(trimeshQuat, r.ri, r.ri);

                            this.result.push(r);
                            this.createFrictionEquationsFromContact(r, this.frictionResult);
                        }
                    }
                }
            }

            // Triangle faces
            var va = sphereTrimesh_va;
            var vb = sphereTrimesh_vb;
            var vc = sphereTrimesh_vc;
            var normal = sphereTrimesh_normal;
            for (var i = 0, N = triangles.length; i !== N; i++)
            {
                trimeshShape.getTriangleVertices(triangles[i], va, vb, vc);
                trimeshShape.getNormal(triangles[i], normal);
                localSpherePos.subTo(va, tmp);
                var dist = tmp.dot(normal);
                normal.scaleNumberTo(dist, tmp);
                localSpherePos.subTo(tmp, tmp);

                // tmp is now the sphere position projected to the triangle plane
                dist = tmp.distance(localSpherePos);
                if (feng3d.Triangle3.containsPoint(va, vb, vc, tmp) && dist < sphereShape.radius)
                {
                    if (justTest)
                    {
                        return true;
                    }
                    var r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);

                    tmp.subTo(localSpherePos, r.ni);
                    r.ni.normalize();
                    r.ni.scaleNumberTo(sphereShape.radius, r.ri);

                    Transform.pointToWorldFrame(trimeshPos, trimeshQuat, tmp, tmp);
                    tmp.subTo(trimeshBody.position, r.rj);

                    Transform.vectorToWorldFrame(trimeshQuat, r.ni, r.ni);
                    Transform.vectorToWorldFrame(trimeshQuat, r.ri, r.ri);

                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                }
            }

            triangles.length = 0;
        }

        spherePlane(si: Sphere, sj: Plane, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            // We will have one contact in this case
            var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);

            // Contact normal
            r.ni.copy(World.worldNormal);
            qj.vmult(r.ni, r.ni);
            r.ni.negateTo(r.ni); // body i is the sphere, flip normal
            r.ni.normalize(); // Needed?

            // Vector from sphere center to contact point
            r.ni.scaleNumberTo(si.radius, r.ri);

            // Project down sphere on plane
            xi.subTo(xj, point_on_plane_to_sphere);
            r.ni.scaleNumberTo(r.ni.dot(point_on_plane_to_sphere), plane_to_sphere_ortho);
            point_on_plane_to_sphere.subTo(plane_to_sphere_ortho, r.rj); // The sphere position projected to plane

            if (-point_on_plane_to_sphere.dot(r.ni) <= si.radius)
            {

                if (justTest)
                {
                    return true;
                }

                // Make it relative to the body
                var ri = r.ri;
                var rj = r.rj;
                ri.addTo(xi, ri);
                ri.subTo(bi.position, ri);
                rj.addTo(xj, rj);
                rj.subTo(bj.position, rj);

                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
            }
        }

        sphereBox(si: Sphere, sj: Box, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            // we refer to the box as body j
            var sides = sphereBox_sides;
            xi.subTo(xj, box_to_sphere);
            sj.getSideNormals(sides, qj);
            var R = si.radius;
            var penetrating_sides = [];

            // Check side (plane) intersections
            var found = false;

            // Store the resulting side penetration info
            var side_ns = sphereBox_side_ns;
            var side_ns1 = sphereBox_side_ns1;
            var side_ns2 = sphereBox_side_ns2;
            var side_h = null;
            var side_penetrations = 0;
            var side_dot1 = 0;
            var side_dot2 = 0;
            var side_distance = null;
            for (var idx = 0, nsides = sides.length; idx !== nsides && found === false; idx++)
            {
                // Get the plane side normal (ns)
                var ns = sphereBox_ns;
                ns.copy(sides[idx]);

                var h = ns.length;
                ns.normalize();

                // The normal/distance dot product tells which side of the plane we are
                var dot = box_to_sphere.dot(ns);

                if (dot < h + R && dot > 0)
                {
                    // Intersects plane. Now check the other two dimensions
                    var ns1 = sphereBox_ns1;
                    var ns2 = sphereBox_ns2;
                    ns1.copy(sides[(idx + 1) % 3]);
                    ns2.copy(sides[(idx + 2) % 3]);
                    var h1 = ns1.length;
                    var h2 = ns2.length;
                    ns1.normalize();
                    ns2.normalize();
                    var dot1 = box_to_sphere.dot(ns1);
                    var dot2 = box_to_sphere.dot(ns2);
                    if (dot1 < h1 && dot1 > -h1 && dot2 < h2 && dot2 > -h2)
                    {
                        var dist = Math.abs(dot - h - R);
                        if (side_distance === null || dist < side_distance)
                        {
                            side_distance = dist;
                            side_dot1 = dot1;
                            side_dot2 = dot2;
                            side_h = h;
                            side_ns.copy(ns);
                            side_ns1.copy(ns1);
                            side_ns2.copy(ns2);
                            side_penetrations++;

                            if (justTest)
                            {
                                return true;
                            }
                        }
                    }
                }
            }
            if (side_penetrations)
            {
                found = true;
                let r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                side_ns.scaleNumberTo(-R, r.ri); // Sphere r
                r.ni.copy(side_ns);
                r.ni.negateTo(r.ni); // Normal should be out of sphere
                side_ns.scaleNumberTo(side_h, side_ns);
                side_ns1.scaleNumberTo(side_dot1, side_ns1);
                side_ns.addTo(side_ns1, side_ns);
                side_ns2.scaleNumberTo(side_dot2, side_ns2);
                side_ns.addTo(side_ns2, r.rj);

                // Make relative to bodies
                r.ri.addTo(xi, r.ri);
                r.ri.subTo(bi.position, r.ri);
                r.rj.addTo(xj, r.rj);
                r.rj.subTo(bj.position, r.rj);

                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
            }

            // Check corners
            var rj = new Vector3();
            var sphere_to_corner = sphereBox_sphere_to_corner;
            for (var j = 0; j !== 2 && !found; j++)
            {
                for (var k = 0; k !== 2 && !found; k++)
                {
                    for (var l = 0; l !== 2 && !found; l++)
                    {
                        rj.set(0, 0, 0);
                        if (j)
                        {
                            rj.addTo(sides[0], rj);
                        } else
                        {
                            rj.subTo(sides[0], rj);
                        }
                        if (k)
                        {
                            rj.addTo(sides[1], rj);
                        } else
                        {
                            rj.subTo(sides[1], rj);
                        }
                        if (l)
                        {
                            rj.addTo(sides[2], rj);
                        } else
                        {
                            rj.subTo(sides[2], rj);
                        }

                        // World position of corner
                        xj.addTo(rj, sphere_to_corner);
                        sphere_to_corner.subTo(xi, sphere_to_corner);

                        if (sphere_to_corner.lengthSquared < R * R)
                        {
                            if (justTest)
                            {
                                return true;
                            }
                            found = true;
                            let r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                            r.ri.copy(sphere_to_corner);
                            r.ri.normalize();
                            r.ni.copy(r.ri);
                            r.ri.scaleNumberTo(R, r.ri);
                            r.rj.copy(rj);

                            // Make relative to bodies
                            r.ri.addTo(xi, r.ri);
                            r.ri.subTo(bi.position, r.ri);
                            r.rj.addTo(xj, r.rj);
                            r.rj.subTo(bj.position, r.rj);

                            this.result.push(r);
                            this.createFrictionEquationsFromContact(r, this.frictionResult);
                        }
                    }
                }
            }
            rj = null;

            // Check edges
            var edgeTangent = new Vector3();
            var edgeCenter = new Vector3();
            let r = new Vector3(); // r = edge center to sphere center
            var orthogonal = new Vector3();
            var dist1: Vector3 = new Vector3();
            var Nsides = sides.length;
            for (var j = 0; j !== Nsides && !found; j++)
            {
                for (var k = 0; k !== Nsides && !found; k++)
                {
                    if (j % 3 !== k % 3)
                    {
                        // Get edge tangent
                        sides[k].crossTo(sides[j], edgeTangent);
                        edgeTangent.normalize();
                        sides[j].addTo(sides[k], edgeCenter);
                        r.copy(xi);
                        r.subTo(edgeCenter, r);
                        r.subTo(xj, r);
                        var orthonorm = r.dot(edgeTangent); // distance from edge center to sphere center in the tangent direction
                        edgeTangent.scaleNumberTo(orthonorm, orthogonal); // Vector from edge center to sphere center in the tangent direction

                        // Find the third side orthogonal to this one
                        var l = 0;
                        while (l === j % 3 || l === k % 3)
                        {
                            l++;
                        }

                        // vec from edge center to sphere projected to the plane orthogonal to the edge tangent
                        dist1.copy(xi);
                        dist1.subTo(orthogonal, dist1);
                        dist1.subTo(edgeCenter, dist1);
                        dist1.subTo(xj, dist1);

                        // Distances in tangent direction and distance in the plane orthogonal to it
                        var tdist = Math.abs(orthonorm);
                        var ndist = dist1.length;

                        if (tdist < sides[l].length && ndist < R)
                        {
                            if (justTest)
                            {
                                return true;
                            }
                            found = true;
                            var res = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                            edgeCenter.addTo(orthogonal, res.rj); // box rj
                            res.rj.copy(res.rj);
                            dist1.negateTo(res.ni);
                            res.ni.normalize();

                            res.ri.copy(res.rj);
                            res.ri.addTo(xj, res.ri);
                            res.ri.subTo(xi, res.ri);
                            res.ri.normalize();
                            res.ri.scaleNumberTo(R, res.ri);

                            // Make relative to bodies
                            res.ri.addTo(xi, res.ri);
                            res.ri.subTo(bi.position, res.ri);
                            res.rj.addTo(xj, res.rj);
                            res.rj.subTo(bj.position, res.rj);

                            this.result.push(res);
                            this.createFrictionEquationsFromContact(res, this.frictionResult);
                        }
                    }
                }
            }
        }

        sphereConvex(si: Sphere, sj: ConvexPolyhedron, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            xi.subTo(xj, convex_to_sphere);
            var normals = sj.faceNormals;
            var faces = sj.faces;
            var verts = sj.vertices;
            var R = si.radius;
            var penetrating_sides = [];

            // if(convex_to_sphere.lengthSquared > si.boundingSphereRadius + sj.boundingSphereRadius){
            //     return;
            // }

            // Check corners
            for (var i = 0; i !== verts.length; i++)
            {
                var v = <Vector3>verts[i];

                // World position of corner
                var worldCorner = sphereConvex_worldCorner;
                qj.vmult(v, worldCorner);
                xj.addTo(worldCorner, worldCorner);
                var sphere_to_corner = sphereConvex_sphereToCorner;
                worldCorner.subTo(xi, sphere_to_corner);
                if (sphere_to_corner.lengthSquared < R * R)
                {
                    if (justTest)
                    {
                        return true;
                    }
                    found = true;
                    var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                    r.ri.copy(sphere_to_corner);
                    r.ri.normalize();
                    r.ni.copy(r.ri);
                    r.ri.scaleNumberTo(R, r.ri);
                    worldCorner.subTo(xj, r.rj);

                    // Should be relative to the body.
                    r.ri.addTo(xi, r.ri);
                    r.ri.subTo(bi.position, r.ri);

                    // Should be relative to the body.
                    r.rj.addTo(xj, r.rj);
                    r.rj.subTo(bj.position, r.rj);

                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                    return;
                }
            }

            // Check side (plane) intersections
            var found = false;
            for (var i = 0, nfaces = faces.length; i !== nfaces && found === false; i++)
            {
                var normal = normals[i];
                var face = faces[i];

                // Get world-transformed normal of the face
                var worldNormal = sphereConvex_worldNormal;
                qj.vmult(normal, worldNormal);

                // Get a world vertex from the face
                var worldPoint = sphereConvex_worldPoint;
                qj.vmult(<Vector3>verts[face[0]], worldPoint);
                worldPoint.addTo(xj, worldPoint);

                // Get a point on the sphere, closest to the face normal
                var worldSpherePointClosestToPlane = sphereConvex_worldSpherePointClosestToPlane;
                worldNormal.scaleNumberTo(-R, worldSpherePointClosestToPlane);
                xi.addTo(worldSpherePointClosestToPlane, worldSpherePointClosestToPlane);

                // Vector from a face point to the closest point on the sphere
                var penetrationVec = sphereConvex_penetrationVec;
                worldSpherePointClosestToPlane.subTo(worldPoint, penetrationVec);

                // The penetration. Negative value means overlap.
                var penetration = penetrationVec.dot(worldNormal);

                var worldPointToSphere = sphereConvex_sphereToWorldPoint;
                xi.subTo(worldPoint, worldPointToSphere);

                if (penetration < 0 && worldPointToSphere.dot(worldNormal) > 0)
                {
                    // Intersects plane. Now check if the sphere is inside the face polygon
                    var faceVerts = []; // Face vertices, in world coords
                    for (var j = 0, Nverts = face.length; j !== Nverts; j++)
                    {
                        var worldVertex = new Vector3();
                        qj.vmult(<Vector3>verts[face[j]], worldVertex);
                        xj.addTo(worldVertex, worldVertex);
                        faceVerts.push(worldVertex);
                    }

                    if (pointInPolygon(faceVerts, worldNormal, xi))
                    { // Is the sphere center in the face polygon?
                        if (justTest)
                        {
                            return true;
                        }
                        found = true;
                        var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);

                        worldNormal.scaleNumberTo(-R, r.ri); // Contact offset, from sphere center to contact
                        worldNormal.negateTo(r.ni); // Normal pointing out of sphere

                        var penetrationVec2 = new Vector3();
                        worldNormal.scaleNumberTo(-penetration, penetrationVec2);
                        var penetrationSpherePoint = new Vector3();
                        worldNormal.scaleNumberTo(-R, penetrationSpherePoint);

                        //xi.subTo(xj).addTo(penetrationSpherePoint).addTo(penetrationVec2 , r.rj);
                        xi.subTo(xj, r.rj);
                        r.rj.addTo(penetrationSpherePoint, r.rj);
                        r.rj.addTo(penetrationVec2, r.rj);

                        // Should be relative to the body.
                        r.rj.addTo(xj, r.rj);
                        r.rj.subTo(bj.position, r.rj);

                        // Should be relative to the body.
                        r.ri.addTo(xi, r.ri);
                        r.ri.subTo(bi.position, r.ri);

                        this.result.push(r);
                        this.createFrictionEquationsFromContact(r, this.frictionResult);

                        return; // We only expect *one* face contact
                    } else
                    {
                        // Edge?
                        for (var j = 0; j !== face.length; j++)
                        {

                            // Get two world transformed vertices
                            var v1 = new Vector3();
                            var v2 = new Vector3();
                            qj.vmult(<Vector3>verts[face[(j + 1) % face.length]], v1);
                            qj.vmult(<Vector3>verts[face[(j + 2) % face.length]], v2);
                            xj.addTo(v1, v1);
                            xj.addTo(v2, v2);

                            // Construct edge vector
                            var edge = sphereConvex_edge;
                            v2.subTo(v1, edge);

                            // Construct the same vector, but normalized
                            var edgeUnit = sphereConvex_edgeUnit;
                            edge.unit(edgeUnit);

                            // p is xi projected onto the edge
                            var p = new Vector3();
                            var v1_to_xi = new Vector3();
                            xi.subTo(v1, v1_to_xi);
                            var dot = v1_to_xi.dot(edgeUnit);
                            edgeUnit.scaleNumberTo(dot, p);
                            p.addTo(v1, p);

                            // Compute a vector from p to the center of the sphere
                            var xi_to_p = new Vector3();
                            p.subTo(xi, xi_to_p);

                            // Collision if the edge-sphere distance is less than the radius
                            // AND if p is in between v1 and v2
                            if (dot > 0 && dot * dot < edge.lengthSquared && xi_to_p.lengthSquared < R * R)
                            { // Collision if the edge-sphere distance is less than the radius
                                // Edge contact!
                                if (justTest)
                                {
                                    return true;
                                }
                                var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                                p.subTo(xj, r.rj);

                                p.subTo(xi, r.ni);
                                r.ni.normalize();

                                r.ni.scaleNumberTo(R, r.ri);

                                // Should be relative to the body.
                                r.rj.addTo(xj, r.rj);
                                r.rj.subTo(bj.position, r.rj);

                                // Should be relative to the body.
                                r.ri.addTo(xi, r.ri);
                                r.ri.subTo(bi.position, r.ri);

                                this.result.push(r);
                                this.createFrictionEquationsFromContact(r, this.frictionResult);

                                return;
                            }
                        }
                    }
                }
            }
        }

        planeBox(si: Plane, sj: Box, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            sj.convexPolyhedronRepresentation.material = sj.material;
            sj.convexPolyhedronRepresentation.collisionResponse = sj.collisionResponse;
            sj.convexPolyhedronRepresentation.id = sj.id;
            return this.planeConvex(si, sj.convexPolyhedronRepresentation, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        }

        planeConvex(
            planeShape: Plane,
            convexShape: ConvexPolyhedron,
            planePosition: Vector3,
            convexPosition: Vector3,
            planeQuat: Quaternion,
            convexQuat: Quaternion,
            planeBody: Body,
            convexBody: Body,
            si: Shape,
            sj: Shape,
            justTest: boolean
        )
        {
            // Simply return the points behind the plane.
            var worldVertex = planeConvex_v,
                worldNormal = planeConvex_normal;
            worldNormal.copy(World.worldNormal);
            planeQuat.vmult(worldNormal, worldNormal); // Turn normal according to plane orientation

            var numContacts = 0;
            var relpos = planeConvex_relpos;
            for (var i = 0; i !== convexShape.vertices.length; i++)
            {

                // Get world convex vertex
                worldVertex.copy(convexShape.vertices[i]);
                convexQuat.vmult(worldVertex, worldVertex);
                convexPosition.addTo(worldVertex, worldVertex);
                worldVertex.subTo(planePosition, relpos);

                var dot = worldNormal.dot(relpos);
                if (dot <= 0.0)
                {
                    if (justTest)
                    {
                        return true;
                    }

                    var r = this.createContactEquation(planeBody, convexBody, planeShape, convexShape, si, sj);

                    // Get vertex position projected on plane
                    var projected = planeConvex_projected;
                    worldNormal.scaleNumberTo(worldNormal.dot(relpos), projected);
                    worldVertex.subTo(projected, projected);
                    projected.subTo(planePosition, r.ri); // From plane to vertex projected on plane

                    r.ni.copy(worldNormal); // Contact normal is the plane normal out from plane

                    // rj is now just the vector from the convex center to the vertex
                    worldVertex.subTo(convexPosition, r.rj);

                    // Make it relative to the body
                    r.ri.addTo(planePosition, r.ri);
                    r.ri.subTo(planeBody.position, r.ri);
                    r.rj.addTo(convexPosition, r.rj);
                    r.rj.subTo(convexBody.position, r.rj);

                    this.result.push(r);
                    numContacts++;
                    if (!this.enableFrictionReduction)
                    {
                        this.createFrictionEquationsFromContact(r, this.frictionResult);
                    }
                }
            }

            if (this.enableFrictionReduction && numContacts)
            {
                this.createFrictionFromAverage(numContacts);
            }
        }

        convexConvex(si: ConvexPolyhedron, sj: ConvexPolyhedron, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean, faceListA?: number[], faceListB?: number[])
        {
            var sepAxis = convexConvex_sepAxis;

            if (xi.distance(xj) > si.boundingSphereRadius + sj.boundingSphereRadius)
            {
                return;
            }

            if (si.findSeparatingAxis(sj, xi, qi, xj, qj, sepAxis, faceListA, faceListB))
            {
                var res: {
                    point: Vector3;
                    normal: Vector3;
                    depth: number;
                }[] = [];
                var q = convexConvex_q;
                si.clipAgainstHull(xi, qi, sj, xj, qj, sepAxis, -100, 100, res);
                var numContacts = 0;
                for (var j = 0; j !== res.length; j++)
                {
                    if (justTest)
                    {
                        return true;
                    }
                    var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj),
                        ri = r.ri,
                        rj = r.rj;
                    sepAxis.negateTo(r.ni);
                    res[j].normal.negateTo(q);
                    q.scaleNumberTo(res[j].depth, q);
                    res[j].point.addTo(q, ri);
                    rj.copy(res[j].point);

                    // Contact points are in world coordinates. Transform back to relative
                    ri.subTo(xi, ri);
                    rj.subTo(xj, rj);

                    // Make relative to bodies
                    ri.addTo(xi, ri);
                    ri.subTo(bi.position, ri);
                    rj.addTo(xj, rj);
                    rj.subTo(bj.position, rj);

                    this.result.push(r);
                    numContacts++;
                    if (!this.enableFrictionReduction)
                    {
                        this.createFrictionEquationsFromContact(r, this.frictionResult);
                    }
                }
                if (this.enableFrictionReduction && numContacts)
                {
                    this.createFrictionFromAverage(numContacts);
                }
            }
        }

        /**
         * @method convexTrimesh
         * @param  {Array}      result
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vector3}       xi
         * @param  {Vector3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        // Narrowphase.prototype[Shape.types.CONVEXPOLYHEDRON | Shape.types.TRIMESH] =
        // Narrowphase.prototype.convexTrimesh = function(si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,faceListA,faceListB){
        //     var sepAxis = convexConvex_sepAxis;

        //     if(xi.distance(xj) > si.boundingSphereRadius + sj.boundingSphereRadius){
        //         return;
        //     }

        //     // Construct a temp hull for each triangle
        //     var hullB = new ConvexPolyhedron();

        //     hullB.faces = [[0,1,2]];
        //     var va = new Vector3();
        //     var vb = new Vector3();
        //     var vc = new Vector3();
        //     hullB.vertices = [
        //         va,
        //         vb,
        //         vc
        //     ];

        //     for (var i = 0; i < sj.indices.length / 3; i++) {

        //         var triangleNormal = new Vector3();
        //         sj.getNormal(i, triangleNormal);
        //         hullB.faceNormals = [triangleNormal];

        //         sj.getTriangleVertices(i, va, vb, vc);

        //         var d = si.testSepAxis(triangleNormal, hullB, xi, qi, xj, qj);
        //         if(!d){
        //             triangleNormal.scaleNumberTo(-1, triangleNormal);
        //             d = si.testSepAxis(triangleNormal, hullB, xi, qi, xj, qj);

        //             if(!d){
        //                 continue;
        //             }
        //         }

        //         var res = [];
        //         var q = convexConvex_q;
        //         si.clipAgainstHull(xi,qi,hullB,xj,qj,triangleNormal,-100,100,res);
        //         for(var j = 0; j !== res.length; j++){
        //             var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj),
        //                 ri = r.ri,
        //                 rj = r.rj;
        //             r.ni.copy(triangleNormal);
        //             r.ni.negateTo(r.ni);
        //             res[j].normal.negateTo(q);
        //             q.multTo(res[j].depth, q);
        //             res[j].point.addTo(q, ri);
        //             rj.copy(res[j].point);

        //             // Contact points are in world coordinates. Transform back to relative
        //             ri.subTo(xi,ri);
        //             rj.subTo(xj,rj);

        //             // Make relative to bodies
        //             ri.addTo(xi, ri);
        //             ri.subTo(bi.position, ri);
        //             rj.addTo(xj, rj);
        //             rj.subTo(bj.position, rj);

        //             result.push(r);
        //         }
        //     }
        // };

        planeParticle(sj: Plane, si: Particle, xj: Vector3, xi: Vector3, qj: Quaternion, qi: Quaternion, bj: Body, bi: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            var normal = particlePlane_normal;
            normal.copy(World.worldNormal);
            bj.quaternion.vmult(normal, normal); // Turn normal according to plane orientation
            var relpos = particlePlane_relpos;
            xi.subTo(bj.position, relpos);
            var dot = normal.dot(relpos);
            if (dot <= 0.0)
            {

                if (justTest)
                {
                    return true;
                }

                var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                r.ni.copy(normal); // Contact normal is the plane normal
                r.ni.negateTo(r.ni);
                r.ri.set(0, 0, 0); // Center of particle

                // Get particle position projected on plane
                var projected = particlePlane_projected;
                normal.scaleNumberTo(normal.dot(xi), projected);
                xi.subTo(projected, projected);
                //projected.addTo(bj.position,projected);

                // rj is now the projected world position minus plane position
                r.rj.copy(projected);
                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
            }
        }

        sphereParticle(sj: Sphere, si: Particle, xj: Vector3, xi: Vector3, qj: Quaternion, qi: Quaternion, bj: Body, bi: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            // The normal is the unit vector from sphere center to particle center
            var normal = particleSphere_normal;
            normal.copy(World.worldNormal);
            xi.subTo(xj, normal);
            var lengthSquared = normal.lengthSquared;

            if (lengthSquared <= sj.radius * sj.radius)
            {
                if (justTest)
                {
                    return true;
                }
                var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                normal.normalize();
                r.rj.copy(normal);
                r.rj.scaleNumberTo(sj.radius, r.rj);
                r.ni.copy(normal); // Contact normal
                r.ni.negateTo(r.ni);
                r.ri.set(0, 0, 0); // Center of particle
                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
            }
        }

        convexParticle(sj: ConvexPolyhedron, si: Particle, xj: Vector3, xi: Vector3, qj: Quaternion, qi: Quaternion, bj: Body, bi: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            var penetratedFaceIndex = -1;
            var penetratedFaceNormal = convexParticle_penetratedFaceNormal;
            var worldPenetrationVec = convexParticle_worldPenetrationVec;
            var minPenetration = null;
            var numDetectedFaces = 0;

            // Convert particle position xi to local coords in the convex
            var local = convexParticle_local;
            local.copy(xi);
            local.subTo(xj, local); // Convert position to relative the convex origin
            qj.inverseTo(cqj);
            cqj.vmult(local, local);

            if (sj.pointIsInside(local))
            {

                if (sj.worldVerticesNeedsUpdate)
                {
                    sj.computeWorldVertices(xj, qj);
                }
                if (sj.worldFaceNormalsNeedsUpdate)
                {
                    sj.computeWorldFaceNormals(qj);
                }

                // For each world polygon in the polyhedra
                for (var i = 0, nfaces = sj.faces.length; i !== nfaces; i++)
                {

                    // Construct world face vertices
                    var verts = [sj.worldVertices[sj.faces[i][0]]];
                    var normal = sj.worldFaceNormals[i];

                    // Check how much the particle penetrates the polygon plane.
                    xi.subTo(verts[0], convexParticle_vertexToParticle);
                    var penetration = -normal.dot(convexParticle_vertexToParticle);
                    if (minPenetration === null || Math.abs(penetration) < Math.abs(minPenetration))
                    {

                        if (justTest)
                        {
                            return true;
                        }

                        minPenetration = penetration;
                        penetratedFaceIndex = i;
                        penetratedFaceNormal.copy(normal);
                        numDetectedFaces++;
                    }
                }

                if (penetratedFaceIndex !== -1)
                {
                    // Setup contact
                    var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                    penetratedFaceNormal.scaleNumberTo(minPenetration, worldPenetrationVec);

                    // rj is the particle position projected to the face
                    worldPenetrationVec.addTo(xi, worldPenetrationVec);
                    worldPenetrationVec.subTo(xj, worldPenetrationVec);
                    r.rj.copy(worldPenetrationVec);
                    //var projectedToFace = xi.subTo(xj).addTo(worldPenetrationVec);
                    //projectedToFace.copy(r.rj);

                    //qj.vmult(r.rj,r.rj);
                    penetratedFaceNormal.negateTo(r.ni); // Contact normal
                    r.ri.set(0, 0, 0); // Center of particle

                    var ri = r.ri,
                        rj = r.rj;

                    // Make relative to bodies
                    ri.addTo(xi, ri);
                    ri.subTo(bi.position, ri);
                    rj.addTo(xj, rj);
                    rj.subTo(bj.position, rj);

                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                } else
                {
                    console.warn("Point found inside convex, but did not find penetrating face!");
                }
            }
        }

        boxHeightfield(si: Box, sj: Heightfield, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            si.convexPolyhedronRepresentation.material = si.material;
            si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
            return this.convexHeightfield(si.convexPolyhedronRepresentation, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        }

        convexHeightfield(
            convexShape: ConvexPolyhedron,
            hfShape: Heightfield,
            convexPos: Vector3,
            hfPos: Vector3,
            convexQuat: Quaternion,
            hfQuat: Quaternion,
            convexBody: Body,
            hfBody: Body,
            rsi: Shape,
            rsj: Shape,
            justTest: boolean
        )
        {
            var data = hfShape.data,
                w = hfShape.elementSize,
                radius = convexShape.boundingSphereRadius,
                worldPillarOffset = convexHeightfield_tmp2,
                faceList = convexHeightfield_faceList;

            // Get sphere position to heightfield local!
            var localConvexPos = convexHeightfield_tmp1;
            Transform.pointToLocalFrame(hfPos, hfQuat, convexPos, localConvexPos);

            // Get the index of the data points to test against
            var iMinX = Math.floor((localConvexPos.x - radius) / w) - 1,
                iMaxX = Math.ceil((localConvexPos.x + radius) / w) + 1,
                iMinY = Math.floor((localConvexPos.y - radius) / w) - 1,
                iMaxY = Math.ceil((localConvexPos.y + radius) / w) + 1;

            // Bail out if we are out of the terrain
            if (iMaxX < 0 || iMaxY < 0 || iMinX > data.length || iMinY > data[0].length)
            {
                return;
            }

            // Clamp index to edges
            if (iMinX < 0) { iMinX = 0; }
            if (iMaxX < 0) { iMaxX = 0; }
            if (iMinY < 0) { iMinY = 0; }
            if (iMaxY < 0) { iMaxY = 0; }
            if (iMinX >= data.length) { iMinX = data.length - 1; }
            if (iMaxX >= data.length) { iMaxX = data.length - 1; }
            if (iMaxY >= data[0].length) { iMaxY = data[0].length - 1; }
            if (iMinY >= data[0].length) { iMinY = data[0].length - 1; }

            var minMax = [];
            hfShape.getRectMinMax(iMinX, iMinY, iMaxX, iMaxY, minMax);
            var min = minMax[0];
            var max = minMax[1];

            // Bail out if we're cant touch the bounding height box
            if (localConvexPos.z - radius > max || localConvexPos.z + radius < min)
            {
                return;
            }

            for (var i = iMinX; i < iMaxX; i++)
            {
                for (var j = iMinY; j < iMaxY; j++)
                {

                    var intersecting = false;

                    // Lower triangle
                    hfShape.getConvexTrianglePillar(i, j, false);
                    Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
                    if (convexPos.distance(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + convexShape.boundingSphereRadius)
                    {
                        intersecting = this.convexConvex(convexShape, hfShape.pillarConvex, convexPos, worldPillarOffset, convexQuat, hfQuat, convexBody, hfBody, null, null, justTest, faceList, null);
                    }

                    if (justTest && intersecting)
                    {
                        return true;
                    }

                    // Upper triangle
                    hfShape.getConvexTrianglePillar(i, j, true);
                    Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
                    if (convexPos.distance(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + convexShape.boundingSphereRadius)
                    {
                        intersecting = this.convexConvex(convexShape, hfShape.pillarConvex, convexPos, worldPillarOffset, convexQuat, hfQuat, convexBody, hfBody, null, null, justTest, faceList, null);
                    }

                    if (justTest && intersecting)
                    {
                        return true;
                    }
                }
            }
        };

        sphereHeightfield(
            sphereShape: Sphere,
            hfShape: Heightfield,
            spherePos: Vector3,
            hfPos: Vector3,
            sphereQuat: Quaternion,
            hfQuat: Quaternion,
            sphereBody: Body,
            hfBody: Body,
            rsi?: Shape,
            rsj?: Shape,
            justTest?: boolean
        )
        {
            var data = hfShape.data,
                radius = sphereShape.radius,
                w = hfShape.elementSize,
                worldPillarOffset = sphereHeightfield_tmp2;

            // Get sphere position to heightfield local!
            var localSpherePos = sphereHeightfield_tmp1;
            Transform.pointToLocalFrame(hfPos, hfQuat, spherePos, localSpherePos);

            // Get the index of the data points to test against
            var iMinX = Math.floor((localSpherePos.x - radius) / w) - 1,
                iMaxX = Math.ceil((localSpherePos.x + radius) / w) + 1,
                iMinY = Math.floor((localSpherePos.y - radius) / w) - 1,
                iMaxY = Math.ceil((localSpherePos.y + radius) / w) + 1;

            // Bail out if we are out of the terrain
            if (iMaxX < 0 || iMaxY < 0 || iMinX > data.length || iMaxY > data[0].length)
            {
                return;
            }

            // Clamp index to edges
            if (iMinX < 0) { iMinX = 0; }
            if (iMaxX < 0) { iMaxX = 0; }
            if (iMinY < 0) { iMinY = 0; }
            if (iMaxY < 0) { iMaxY = 0; }
            if (iMinX >= data.length) { iMinX = data.length - 1; }
            if (iMaxX >= data.length) { iMaxX = data.length - 1; }
            if (iMaxY >= data[0].length) { iMaxY = data[0].length - 1; }
            if (iMinY >= data[0].length) { iMinY = data[0].length - 1; }

            var minMax = [];
            hfShape.getRectMinMax(iMinX, iMinY, iMaxX, iMaxY, minMax);
            var min = minMax[0];
            var max = minMax[1];

            // Bail out if we're cant touch the bounding height box
            if (localSpherePos.z - radius > max || localSpherePos.z + radius < min)
            {
                return;
            }

            var result = this.result;
            for (var i = iMinX; i < iMaxX; i++)
            {
                for (var j = iMinY; j < iMaxY; j++)
                {

                    var numContactsBefore = result.length;

                    var intersecting = false;

                    // Lower triangle
                    hfShape.getConvexTrianglePillar(i, j, false);
                    Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
                    if (spherePos.distance(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + sphereShape.boundingSphereRadius)
                    {
                        intersecting = this.sphereConvex(sphereShape, hfShape.pillarConvex, spherePos, worldPillarOffset, sphereQuat, hfQuat, sphereBody, hfBody, sphereShape, hfShape, justTest);
                    }

                    if (justTest && intersecting)
                    {
                        return true;
                    }

                    // Upper triangle
                    hfShape.getConvexTrianglePillar(i, j, true);
                    Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
                    if (spherePos.distance(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + sphereShape.boundingSphereRadius)
                    {
                        intersecting = this.sphereConvex(sphereShape, hfShape.pillarConvex, spherePos, worldPillarOffset, sphereQuat, hfQuat, sphereBody, hfBody, sphereShape, hfShape, justTest);
                    }

                    if (justTest && intersecting)
                    {
                        return true;
                    }

                    var numContacts = result.length - numContactsBefore;

                    if (numContacts > 2)
                    {
                        return;
                    }
                    /*
                    // Skip all but 1
                    for (var k = 0; k < numContacts - 1; k++) {
                        result.pop();
                    }
                    */
                }
            }
        }

    }

    var averageNormal = new Vector3();
    var averageContactPointA = new Vector3();
    var averageContactPointB = new Vector3();

    var tmpVec1 = new Vector3();
    var tmpVec2 = new Vector3();
    var tmpQuat1 = new Quaternion();
    var tmpQuat2 = new Quaternion();

    var numWarnings = 0;
    var maxWarnings = 10;

    function warn(msg)
    {
        if (numWarnings > maxWarnings)
        {
            return;
        }

        numWarnings++;

        console.warn(msg);
    }

    var planeTrimesh_normal = new Vector3();
    var planeTrimesh_relpos = new Vector3();
    var planeTrimesh_projected = new Vector3();

    var sphereTrimesh_normal = new Vector3();
    var sphereTrimesh_relpos = new Vector3();
    var sphereTrimesh_projected = new Vector3();
    var sphereTrimesh_v = new Vector3();
    var sphereTrimesh_v2 = new Vector3();
    var sphereTrimesh_edgeVertexA = new Vector3();
    var sphereTrimesh_edgeVertexB = new Vector3();
    var sphereTrimesh_edgeVector = new Vector3();
    var sphereTrimesh_edgeVectorUnit = new Vector3();
    var sphereTrimesh_localSpherePos = new Vector3();
    var sphereTrimesh_tmp = new Vector3();
    var sphereTrimesh_va = new Vector3();
    var sphereTrimesh_vb = new Vector3();
    var sphereTrimesh_vc = new Vector3();
    var sphereTrimesh_localSphereAABB = new Box3();
    var sphereTrimesh_triangles = [];

    var point_on_plane_to_sphere = new Vector3();
    var plane_to_sphere_ortho = new Vector3();

    // See http://bulletphysics.com/Bullet/BulletFull/SphereTriangleDetector_8cpp_source.html
    var pointInPolygon_edge = new Vector3();
    var pointInPolygon_edge_x_normal = new Vector3();
    var pointInPolygon_vtp = new Vector3();
    function pointInPolygon(verts: Vector3[], normal: Vector3, p: Vector3)
    {
        var positiveResult = null;
        var N = verts.length;
        for (var i = 0; i !== N; i++)
        {
            var v = verts[i];

            // Get edge to the next vertex
            var edge = pointInPolygon_edge;
            verts[(i + 1) % (N)].subTo(v, edge);

            // Get cross product between polygon normal and the edge
            var edge_x_normal = pointInPolygon_edge_x_normal;
            //var edge_x_normal = new Vector3();
            edge.crossTo(normal, edge_x_normal);

            // Get vector between point and current vertex
            var vertex_to_p = pointInPolygon_vtp;
            p.subTo(v, vertex_to_p);

            // This dot product determines which side of the edge the point is
            var r = edge_x_normal.dot(vertex_to_p);

            // If all such dot products have same sign, we are inside the polygon.
            if (positiveResult === null || (r > 0 && positiveResult === true) || (r <= 0 && positiveResult === false))
            {
                if (positiveResult === null)
                {
                    positiveResult = r > 0;
                }
                continue;
            } else
            {
                return false; // Encountered some other sign. Exit.
            }
        }

        // If we got here, all dot products were of the same sign.
        return true;
    }

    var box_to_sphere = new Vector3();
    var sphereBox_ns = new Vector3();
    var sphereBox_ns1 = new Vector3();
    var sphereBox_ns2 = new Vector3();
    var sphereBox_sides = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    var sphereBox_sphere_to_corner = new Vector3();
    var sphereBox_side_ns = new Vector3();
    var sphereBox_side_ns1 = new Vector3();
    var sphereBox_side_ns2 = new Vector3();

    var convex_to_sphere = new Vector3();
    var sphereConvex_edge = new Vector3();
    var sphereConvex_edgeUnit = new Vector3();
    var sphereConvex_sphereToCorner = new Vector3();
    var sphereConvex_worldCorner = new Vector3();
    var sphereConvex_worldNormal = new Vector3();
    var sphereConvex_worldPoint = new Vector3();
    var sphereConvex_worldSpherePointClosestToPlane = new Vector3();
    var sphereConvex_penetrationVec = new Vector3();
    var sphereConvex_sphereToWorldPoint = new Vector3();

    var planeBox_normal = new Vector3();
    var plane_to_corner = new Vector3();

    var planeConvex_v = new Vector3();
    var planeConvex_normal = new Vector3();
    var planeConvex_relpos = new Vector3();
    var planeConvex_projected = new Vector3();

    var convexConvex_sepAxis = new Vector3();
    var convexConvex_q = new Vector3();

    var particlePlane_normal = new Vector3();
    var particlePlane_relpos = new Vector3();
    var particlePlane_projected = new Vector3();

    var particleSphere_normal = new Vector3();

    // WIP
    var cqj = new Quaternion();
    var convexParticle_local = new Vector3();
    var convexParticle_normal = new Vector3();
    var convexParticle_penetratedFaceNormal = new Vector3();
    var convexParticle_vertexToParticle = new Vector3();
    var convexParticle_worldPenetrationVec = new Vector3();

    var convexHeightfield_tmp1 = new Vector3();
    var convexHeightfield_tmp2 = new Vector3();
    var convexHeightfield_faceList = [0];

    var sphereHeightfield_tmp1 = new Vector3();
    var sphereHeightfield_tmp2 = new Vector3();


    Narrowphase.prototype[Shape.types.BOX | Shape.types.BOX] = Narrowphase.prototype.boxBox;
    Narrowphase.prototype[Shape.types.BOX | Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.boxConvex;
    Narrowphase.prototype[Shape.types.BOX | Shape.types.PARTICLE] = Narrowphase.prototype.boxParticle;
    Narrowphase.prototype[Shape.types.SPHERE] = Narrowphase.prototype.sphereSphere;
    Narrowphase.prototype[Shape.types.PLANE | Shape.types.TRIMESH] = Narrowphase.prototype.planeTrimesh;
    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.TRIMESH] = Narrowphase.prototype.sphereTrimesh;

    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.PLANE] = Narrowphase.prototype.spherePlane;

    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.BOX] = Narrowphase.prototype.sphereBox;
    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.sphereConvex;

    Narrowphase.prototype[Shape.types.PLANE | Shape.types.BOX] = Narrowphase.prototype.planeBox;

    Narrowphase.prototype[Shape.types.PLANE | Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.planeConvex;

    Narrowphase.prototype[Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.convexConvex;

    Narrowphase.prototype[Shape.types.PLANE | Shape.types.PARTICLE] = Narrowphase.prototype.planeParticle;

    Narrowphase.prototype[Shape.types.PARTICLE | Shape.types.SPHERE] = Narrowphase.prototype.sphereParticle;

    Narrowphase.prototype[Shape.types.PARTICLE | Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.convexParticle;

    Narrowphase.prototype[Shape.types.BOX | Shape.types.HEIGHTFIELD] = Narrowphase.prototype.boxHeightfield;
    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.HEIGHTFIELD] = Narrowphase.prototype.sphereHeightfield;

    Narrowphase.prototype[Shape.types.CONVEXPOLYHEDRON | Shape.types.HEIGHTFIELD] = Narrowphase.prototype.convexHeightfield;


}