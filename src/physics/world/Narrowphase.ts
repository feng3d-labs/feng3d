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
        currentContactMaterial: any;
        enableFrictionReduction: boolean;

        /**
         * 
         * @param world 
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

        createFrictionEquationsFromContact(contactEquation: any, outArray: FrictionEquation[])
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


            var averageNormal = new feng3d.Vector3();
            var averageContactPointA = new feng3d.Vector3();
            var averageContactPointB = new feng3d.Vector3();

            var bodyA = c.bi;
            var bodyB = c.bj;
            for (var i = 0; i !== numContacts; i++)
            {
                c = this.result[this.result.length - 1 - i];
                if (c.bi !== bodyA)
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

            var qi = new feng3d.Quaternion();
            var qj = new feng3d.Quaternion();
            var xi = new feng3d.Vector3();
            var xj = new feng3d.Vector3();

            for (var k = 0, N = p1.length; k !== N; k++)
            {
                // Get current collision bodies
                var bi = p1[k],
                    bj = p2[k];

                // Get contact material
                var bodyContactMaterial = null;
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
                    bi.quaternion.rotatePoint(bi.shapeOffsets[i], xi);
                    xi.addTo(bi.position, xi);
                    var si = bi.shapes[i];

                    for (var j = 0; j < bj.shapes.length; j++)
                    {

                        // Compute world transform of shapes
                        bj.quaternion.multTo(bj.shapeOrientations[j], qj);
                        bj.quaternion.rotatePoint(bj.shapeOffsets[j], xj);
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
                        var shapeContactMaterial = null;
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
                                retval = resolver.call(this, si, sj, new Transform(xi, qi), new Transform(xj, qj), bi, bj, si, sj, justTest);
                            } else
                            {
                                retval = resolver.call(this, sj, si, new Transform(xj, qj), new Transform(xi, qi), bj, bi, si, sj, justTest);
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

        sphereSphere(si: Sphere, sj: Sphere, xi: feng3d.Vector3, xj: feng3d.Vector3, qi: feng3d.Quaternion, qj: feng3d.Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean)
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
            planeTransform: Transform,
            trimeshTransform: Transform,
            planeBody: Body,
            trimeshBody: Body,
            rsi: Shape,
            rsj: Shape,
            justTest: boolean
        )
        {
            // Make contacts!
            var v = new feng3d.Vector3();
            var planePos = planeTransform.position;

            var relpos = new feng3d.Vector3();
            var projected = new feng3d.Vector3();

            var normal = new feng3d.Vector3(0, 1, 0);
            planeTransform.quaternion.rotatePoint(normal, normal); // Turn normal according to plane

            for (var i = 0; i < trimeshShape.vertices.length / 3; i++)
            {
                // Get world vertex from trimesh
                trimeshShape.getVertex(i, v);

                // Safe up
                var v2 = new feng3d.Vector3();
                v2.copy(v);
                trimeshTransform.pointToWorldFrame(v2, v);

                // Check plane side
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
            sphereTransform: Transform,
            trimeshTransform: Transform,
            sphereBody: Body,
            trimeshBody: Body,
            rsi: Shape,
            rsj: Shape,
            justTest: boolean
        )
        {
            var spherePos = sphereTransform.position;
            //
            var edgeVertexA = new feng3d.Vector3();
            var edgeVertexB = new feng3d.Vector3();
            var edgeVector = new feng3d.Vector3();
            var edgeVectorUnit = new feng3d.Vector3();
            var localSpherePos = new feng3d.Vector3();
            var tmp = new feng3d.Vector3();
            var localSphereAABB = new feng3d.AABB();
            var v2 = new feng3d.Vector3();
            var relpos = new feng3d.Vector3();
            var triangles: number[] = [];

            // Convert sphere position to local in the trimesh
            trimeshTransform.pointToLocalFrame(spherePos, localSpherePos);

            // Get the aabb of the sphere locally in the trimesh
            var sphereRadius = sphereShape.radius;
            localSphereAABB.min.init(
                localSpherePos.x - sphereRadius,
                localSpherePos.y - sphereRadius,
                localSpherePos.z - sphereRadius
            );
            localSphereAABB.max.init(
                localSpherePos.x + sphereRadius,
                localSpherePos.y + sphereRadius,
                localSpherePos.z + sphereRadius
            );

            trimeshShape.getTrianglesInAABB(localSphereAABB, triangles);

            // Vertices
            var v = new feng3d.Vector3();
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
                        trimeshTransform.pointToWorldFrame(v2, v);

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

                            trimeshTransform.pointToWorldFrame(tmp, tmp);
                            tmp.subTo(trimeshBody.position, r.rj);

                            trimeshTransform.vectorToWorldFrame(r.ni, r.ni);
                            trimeshTransform.vectorToWorldFrame(r.ri, r.ri);

                            this.result.push(r);
                            this.createFrictionEquationsFromContact(r, this.frictionResult);
                        }
                    }
                }
            }

            // Triangle faces
            var va = new feng3d.Vector3();
            var vb = new feng3d.Vector3();
            var vc = new feng3d.Vector3();

            var normal = new feng3d.Vector3();
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
                if (Ray.pointInTriangle(tmp, va, vb, vc) && dist < sphereShape.radius)
                {
                    if (justTest)
                    {
                        return true;
                    }
                    var r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);

                    tmp.subTo(localSpherePos, r.ni);
                    r.ni.normalize();
                    r.ni.scaleNumberTo(sphereShape.radius, r.ri);

                    trimeshTransform.pointToWorldFrame(tmp, tmp);
                    tmp.subTo(trimeshBody.position, r.rj);

                    trimeshTransform.vectorToWorldFrame(r.ni, r.ni);
                    trimeshTransform.vectorToWorldFrame(r.ri, r.ri);

                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                }
            }

            triangles.length = 0;
        }

        spherePlane(si: Sphere, sj: Plane, transformi: Transform, transformj: Transform, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            var xi = transformi.position, xj = transformj.position, qi = transformi.quaternion, qj = transformj.quaternion;

            // We will have one contact in this case
            var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);

            // Contact normal
            r.ni.init(0, 1, 0);
            qj.rotatePoint(r.ni, r.ni);
            r.ni.negateTo(r.ni); // body i is the sphere, flip normal
            r.ni.normalize(); // Needed?

            // Vector from sphere center to contact point
            r.ni.scaleNumberTo(si.radius, r.ri);

            // Project down sphere on plane
            var point_on_plane_to_sphere = xi.subTo(xj);
            var plane_to_sphere_ortho = r.ni.scaleNumberTo(r.ni.dot(point_on_plane_to_sphere));
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

        planeParticle(sj: Plane, si: Particle, xj: feng3d.Vector3, xi: feng3d.Vector3, qj: feng3d.Quaternion, qi: feng3d.Quaternion, bj: Body, bi: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            var normal = new feng3d.Vector3();
            normal.init(0, 1, 0);
            bj.quaternion.rotatePoint(normal, normal); // Turn normal according to plane orientation
            var relpos = new feng3d.Vector3();
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
                r.ri.init(0, 0, 0); // Center of particle

                // Get particle position projected on plane
                var projected = new feng3d.Vector3();
                normal.scaleNumberTo(normal.dot(xi), projected);
                xi.subTo(projected, projected);
                //projected.addTo(bj.position,projected);

                // rj is now the projected world position minus plane position
                r.rj.copy(projected);
                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
            }
        }

        sphereParticle(sj: Shape, si: Shape, xj: feng3d.Vector3, xi: feng3d.Vector3, qj: feng3d.Quaternion, qi: feng3d.Quaternion, bj: Body, bi: Body, rsi: Shape, rsj: Shape, justTest: boolean)
        {
            // The normal is the unit vector from sphere center to particle center
            var normal = new feng3d.Vector3(0, 1, 0);
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
                r.ri.init(0, 0, 0); // Center of particle
                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
            }
        }
    }

    Narrowphase.prototype[ShapeType.SPHERE] = Narrowphase.prototype.sphereSphere;
    Narrowphase.prototype[ShapeType.PLANE | ShapeType.TRIMESH] = Narrowphase.prototype.planeTrimesh;
    Narrowphase.prototype[ShapeType.SPHERE | ShapeType.TRIMESH] = Narrowphase.prototype.sphereTrimesh;

    Narrowphase.prototype[ShapeType.SPHERE | ShapeType.PLANE] = Narrowphase.prototype.spherePlane;

    Narrowphase.prototype[ShapeType.PLANE | ShapeType.PARTICLE] = Narrowphase.prototype.planeParticle;

    Narrowphase.prototype[ShapeType.PARTICLE | ShapeType.SPHERE] = Narrowphase.prototype.sphereParticle;


}