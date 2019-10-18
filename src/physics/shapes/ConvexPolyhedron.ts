namespace CANNON
{
    /**
     * 凸多面体
     */
    export class ConvexPolyhedron extends Shape
    {
        type = ShapeType.CONVEXPOLYHEDRON;

        /**
         * 顶点数组
         */
        vertices: feng3d.Vector3[];
        /**
         * 世界空间顶点数组
         */
        worldVertices: feng3d.Vector3[];
        /**
         * 是否需要更新世界空间顶点数组
         */
        worldVerticesNeedsUpdate: boolean;

        /**
         * Array of integer arrays, indicating which vertices each face consists of
         */
        faces: number[][];

        /**
         * 面法线数组
         */
        faceNormals: feng3d.Vector3[];

        worldFaceNormalsNeedsUpdate: boolean;
        /**
         * 世界空间面法线数组
         */
        worldFaceNormals: feng3d.Vector3[];

        /**
         * 边数组
         */
        uniqueEdges: feng3d.Vector3[];

        /**
         * If given, these locally defined, normalized axes are the only ones being checked when doing separating axis check.
         */
        uniqueAxes: feng3d.Vector3[];

        /**
         * A set of polygons describing a convex shape.
         * @class ConvexPolyhedron
         * @constructor
         * @extends Shape
         * @description The shape MUST be convex for the code to work properly. No polygons may be coplanar (contained
         * in the same 3D plane), instead these should be merged into one polygon.
         *
         * @param {array} points An array of Vec3's
         * @param {array} faces Array of integer arrays, describing which vertices that is included in each face.
         *
         * @author qiao / https://github.com/qiao (original author, see https://github.com/qiao/three.js/commit/85026f0c769e4000148a67d45a9e9b9c5108836f)
         * @author schteppe / https://github.com/schteppe
         * @see http://www.altdevblogaday.com/2011/05/13/contact-generation-between-3d-convex-meshes/
         * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
         *
         * @todo Move the clipping functions to ContactGenerator?
         * @todo Automatically merge coplanar polygons in constructor.
         */
        constructor(points?: feng3d.Vector3[], faces?: number[][], uniqueAxes?: feng3d.Vector3[])
        {
            super();

            this.vertices = points || [];

            this.worldVertices = [];
            this.worldVerticesNeedsUpdate = true;

            this.faces = <any>faces || [];

            this.faceNormals = [];
            this.computeNormals();

            this.worldFaceNormalsNeedsUpdate = true;
            this.worldFaceNormals = [];

            this.uniqueEdges = [];

            this.uniqueAxes = uniqueAxes ? uniqueAxes.slice() : null;

            this.computeEdges();
            this.updateBoundingSphereRadius();
        }

        /**
         * 计算边数组
         */
        computeEdges()
        {
            var faces = this.faces;
            var vertices = this.vertices;
            var edges = this.uniqueEdges;

            edges.length = 0;

            var edge = new feng3d.Vector3();

            for (var i = 0; i !== faces.length; i++)
            {
                var face = faces[i];
                var numVertices = face.length;
                for (var j = 0; j !== numVertices; j++)
                {
                    var k = (j + 1) % numVertices;
                    vertices[face[j]].subTo(vertices[face[k]], edge);
                    edge.normalize();
                    var found = false;
                    for (var p = 0; p !== edges.length; p++)
                    {
                        if (edges[p].equals(edge) || edges[p].equals(edge))
                        {
                            found = true;
                            break;
                        }
                    }

                    if (!found)
                    {
                        edges.push(edge.clone());
                    }
                }
            }
        }

        /**
         * 计算这些面的法线。将重用. facenormals数组中现有的Vec3对象(如果它们存在的话)。
         */
        computeNormals()
        {
            this.faceNormals.length = this.faces.length;

            for (var i = 0; i < this.faces.length; i++)
            {
                // Check so all vertices exists for this face
                for (var j = 0; j < this.faces[i].length; j++)
                {
                    if (!this.vertices[this.faces[i][j]])
                    {
                        throw new Error("Vertex " + this.faces[i][j] + " not found!");
                    }
                }

                var n = this.faceNormals[i] || new feng3d.Vector3();
                this.getFaceNormal(i, n);
                this.faceNormals[i] = n;
                var vertex = this.vertices[this.faces[i][0]];
                if (n.dot(vertex) < 0)
                {
                    console.error(".faceNormals[" + i + "] = Vec3(" + n.toString() + ") looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.");
                    for (var j = 0; j < this.faces[i].length; j++)
                    {
                        console.warn(".vertices[" + this.faces[i][j] + "] = Vec3(" + this.vertices[this.faces[i][j]].toString() + ")");
                    }
                }
            }
        }

        /**
         * 得到3个顶点的法向量
         * 
         * @param va 
         * @param vb 
         * @param vc 
         * @param target 
         */
        static computeNormal(va: feng3d.Vector3, vb: feng3d.Vector3, vc: feng3d.Vector3, target: feng3d.Vector3)
        {
            var cb = new feng3d.Vector3();
            var ab = new feng3d.Vector3();
            vb.subTo(va, ab);
            vc.subTo(vb, cb);
            cb.crossTo(ab, target);
            if (!target.isZero())
            {
                target.normalize();
            }
        }

        /**
         * 从顶点计算面法线
         * 
         * @param i 
         * @param target 
         */
        getFaceNormal(i: number, target: feng3d.Vector3)
        {
            var f = this.faces[i];
            var va = this.vertices[f[0]];
            var vb = this.vertices[f[1]];
            var vc = this.vertices[f[2]];
            return ConvexPolyhedron.computeNormal(va, vb, vc, target);
        }

        /**
         * @param posA
         * @param quatA
         * @param hullB
         * @param posB
         * @param quatB
         * @param separatingNormal
         * @param minDist Clamp distance
         * @param maxDist
         * @param result The an array of contact point objects, see clipFaceAgainstHull
         * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
         */
        clipAgainstHull(posA: feng3d.Vector3, quatA: feng3d.Quaternion, hullB: ConvexPolyhedron, posB: feng3d.Vector3, quatB: feng3d.Quaternion, separatingNormal: feng3d.Vector3, minDist: number, maxDist: number, result: { point: feng3d.Vector3; normal: feng3d.Vector3; depth: number; }[])
        {
            var WorldNormal = new feng3d.Vector3();
            var closestFaceB = -1;
            var dmax = -Number.MAX_VALUE;
            for (var face = 0; face < hullB.faces.length; face++)
            {
                WorldNormal.copy(hullB.faceNormals[face]);
                quatB.rotatePoint(WorldNormal, WorldNormal);
                //posB.vadd(WorldNormal,WorldNormal);
                var d = WorldNormal.dot(separatingNormal);
                if (d > dmax)
                {
                    dmax = d;
                    closestFaceB = face;
                }
            }
            var worldVertsB1 = [];
            var polyB = hullB.faces[closestFaceB];
            var numVertices = polyB.length;
            for (var e0 = 0; e0 < numVertices; e0++)
            {
                var b = hullB.vertices[polyB[e0]];
                var worldb = new feng3d.Vector3();
                worldb.copy(b);
                quatB.rotatePoint(worldb, worldb);
                posB.addTo(worldb, worldb);
                worldVertsB1.push(worldb);
            }

            if (closestFaceB >= 0)
            {
                this.clipFaceAgainstHull(separatingNormal, posA, quatA, worldVertsB1, minDist, maxDist, result);
            }
        }

        /**
         * Find the separating axis between this hull and another
         * 
         * @param hullB 
         * @param transformA
         * @param transformB
         * @param target The target vector to save the axis in
         * @param faceListA 
         * @param faceListB 
         * @returns Returns false if a separation is found, else true
         */
        findSeparatingAxis(hullB: ConvexPolyhedron, transformA: Transform, transformB: Transform, target: feng3d.Vector3, faceListA: number[], faceListB: number[])
        {
            var faceANormalWS3 = new feng3d.Vector3(),
                Worldnormal1 = new feng3d.Vector3(),
                deltaC = new feng3d.Vector3(),
                worldEdge0 = new feng3d.Vector3(),
                worldEdge1 = new feng3d.Vector3(),
                Cross = new feng3d.Vector3();

            var dmin = Number.MAX_VALUE;
            var hullA = this;
            var curPlaneTests = 0;

            if (!hullA.uniqueAxes)
            {
                var numFacesA = faceListA ? faceListA.length : hullA.faces.length;

                // Test face normals from hullA
                for (var i = 0; i < numFacesA; i++)
                {
                    var fi = faceListA ? faceListA[i] : i;

                    // Get world face normal
                    faceANormalWS3.copy(hullA.faceNormals[fi]);
                    transformA.quaternion.rotatePoint(faceANormalWS3, faceANormalWS3);

                    var d = hullA.testSepAxis(faceANormalWS3, hullB, transformA, transformB);
                    if (d === false)
                    {
                        return false;
                    }

                    if (d < dmin)
                    {
                        dmin = d;
                        target.copy(faceANormalWS3);
                    }
                }

            } else
            {
                // Test unique axes
                for (var i = 0; i !== hullA.uniqueAxes.length; i++)
                {

                    // Get world axis
                    transformA.quaternion.rotatePoint(hullA.uniqueAxes[i], faceANormalWS3);

                    var d = hullA.testSepAxis(faceANormalWS3, hullB, transformA, transformB);
                    if (d === false)
                    {
                        return false;
                    }

                    if (d < dmin)
                    {
                        dmin = d;
                        target.copy(faceANormalWS3);
                    }
                }
            }

            if (!hullB.uniqueAxes)
            {

                // Test face normals from hullB
                var numFacesB = faceListB ? faceListB.length : hullB.faces.length;
                for (var i = 0; i < numFacesB; i++)
                {

                    var fi = faceListB ? faceListB[i] : i;

                    Worldnormal1.copy(hullB.faceNormals[fi]);
                    transformB.quaternion.rotatePoint(Worldnormal1, Worldnormal1);
                    curPlaneTests++;
                    var d = hullA.testSepAxis(Worldnormal1, hullB, transformA, transformB);
                    if (d === false)
                    {
                        return false;
                    }

                    if (d < dmin)
                    {
                        dmin = d;
                        target.copy(Worldnormal1);
                    }
                }
            } else
            {

                // Test unique axes in B
                for (var i = 0; i !== hullB.uniqueAxes.length; i++)
                {
                    transformB.quaternion.rotatePoint(hullB.uniqueAxes[i], Worldnormal1);

                    curPlaneTests++;
                    var d = hullA.testSepAxis(Worldnormal1, hullB, transformA, transformB);
                    if (d === false)
                    {
                        return false;
                    }

                    if (d < dmin)
                    {
                        dmin = d;
                        target.copy(Worldnormal1);
                    }
                }
            }

            // Test edges
            for (var e0 = 0; e0 !== hullA.uniqueEdges.length; e0++)
            {

                // Get world edge
                transformA.quaternion.rotatePoint(hullA.uniqueEdges[e0], worldEdge0);

                for (var e1 = 0; e1 !== hullB.uniqueEdges.length; e1++)
                {

                    // Get world edge 2
                    transformB.quaternion.rotatePoint(hullB.uniqueEdges[e1], worldEdge1);
                    worldEdge0.crossTo(worldEdge1, Cross);

                    if (!Cross.almostZero())
                    {
                        Cross.normalize();
                        var dist = hullA.testSepAxis(Cross, hullB, transformA, transformB);
                        if (dist === false)
                        {
                            return false;
                        }
                        if (dist < dmin)
                        {
                            dmin = dist;
                            target.copy(Cross);
                        }
                    }
                }
            }

            transformB.position.subTo(transformA.position, deltaC);
            if ((deltaC.dot(target)) > 0.0)
            {
                target.negateTo(target);
            }

            return true;
        }

        /**
         * Test separating axis against two hulls. Both hulls are projected onto the axis and the overlap size is returned if there is one.
         * 
         * @param axis
         * @param hullB
         * @param transformA
         * @param transformB
         * @return The overlap depth, or FALSE if no penetration.
         */
        testSepAxis(axis: feng3d.Vector3, hullB: ConvexPolyhedron, transformA: Transform, transformB: Transform)
        {
            var hullA = this;
            var maxminA: number[] = [], maxminB: number[] = [];
            ConvexPolyhedron.project(hullA, axis, transformA, maxminA);
            ConvexPolyhedron.project(hullB, axis, transformB, maxminB);
            var maxA = maxminA[0];
            var minA = maxminA[1];
            var maxB = maxminB[0];
            var minB = maxminB[1];
            if (maxA < minB || maxB < minA)
            {
                return false; // Separated
            }
            var d0 = maxA - minB;
            var d1 = maxB - minA;
            var depth = d0 < d1 ? d0 : d1;
            return depth;
        }

        /**
         * 
         * @param mass
         * @param target
         */
        calculateLocalInertia(mass: number, target: feng3d.Vector3)
        {
            // Approximate with box inertia
            // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
            var cli_aabbmin = new feng3d.Vector3();
            var cli_aabbmax = new feng3d.Vector3();
            this.computeLocalAABB(cli_aabbmin, cli_aabbmax);
            var x = cli_aabbmax.x - cli_aabbmin.x,
                y = cli_aabbmax.y - cli_aabbmin.y,
                z = cli_aabbmax.z - cli_aabbmin.z;
            target.x = 1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * z * 2 * z);
            target.y = 1.0 / 12.0 * mass * (2 * x * 2 * x + 2 * z * 2 * z);
            target.z = 1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * x * 2 * x);
        }

        /**
         * 
         * @param face_i Index of the face
         */
        getPlaneConstantOfFace(face_i: number)
        {
            var f = this.faces[face_i];
            var n = this.faceNormals[face_i];
            var v = this.vertices[f[0]];
            var c = -n.dot(v);
            return c;
        }

        /**
         * Clip a face against a hull.
         * 
         * @param separatingNormal
         * @param posA
         * @param quatA
         * @param worldVertsB1 An array of Vec3 with vertices in the world frame.
         * @param minDist Distance clamping
         * @param maxDist
         * @param result Array to store resulting contact points in. Will be objects with properties: point, depth, normal. These are represented in world coordinates.
         */
        clipFaceAgainstHull(separatingNormal: feng3d.Vector3, posA: feng3d.Vector3, quatA: feng3d.Quaternion, worldVertsB1: feng3d.Vector3[], minDist: number, maxDist: number, result: { point: feng3d.Vector3; normal: feng3d.Vector3; depth: number; }[])
        {
            var faceANormalWS = new feng3d.Vector3();
            var edge0 = new feng3d.Vector3();
            var WorldEdge0 = new feng3d.Vector3();
            var worldPlaneAnormal1 = new feng3d.Vector3();
            var planeNormalWS1 = new feng3d.Vector3();
            var worldA1 = new feng3d.Vector3();
            var localPlaneNormal = new feng3d.Vector3();
            var planeNormalWS = new feng3d.Vector3();

            var hullA = this;
            var worldVertsB2 = [];
            var pVtxIn = worldVertsB1;
            var pVtxOut = worldVertsB2;
            // Find the face with normal closest to the separating axis
            var closestFaceA = -1;
            var dmin = Number.MAX_VALUE;
            for (var face = 0; face < hullA.faces.length; face++)
            {
                faceANormalWS.copy(hullA.faceNormals[face]);
                quatA.rotatePoint(faceANormalWS, faceANormalWS);
                //posA.vadd(faceANormalWS,faceANormalWS);
                var d = faceANormalWS.dot(separatingNormal);
                if (d < dmin)
                {
                    dmin = d;
                    closestFaceA = face;
                }
            }
            if (closestFaceA < 0)
            {
                // console.log("--- did not find any closest face... ---");
                return;
            }
            //console.log("closest A: ",closestFaceA);
            // Get the face and construct connected faces
            var polyA = hullA.faces[closestFaceA];
            var connectedFaces: number[] = [];
            for (var i = 0; i < hullA.faces.length; i++)
            {
                for (var j = 0; j < hullA.faces[i].length; j++)
                {
                    if (polyA.indexOf(hullA.faces[i][j]) !== -1 /* Sharing a vertex*/ && i !== closestFaceA /* Not the one we are looking for connections from */ && connectedFaces.indexOf(i) === -1 /* Not already added */)
                    {
                        connectedFaces.push(i);
                    }
                }
            }
            // Clip the polygon to the back of the planes of all faces of hull A, that are adjacent to the witness face
            var numVerticesA = polyA.length;
            for (var e0 = 0; e0 < numVerticesA; e0++)
            {
                var a = hullA.vertices[polyA[e0]];
                var b = hullA.vertices[polyA[(e0 + 1) % numVerticesA]];
                a.subTo(b, edge0);
                WorldEdge0.copy(edge0);
                quatA.rotatePoint(WorldEdge0, WorldEdge0);
                posA.addTo(WorldEdge0, WorldEdge0);
                worldPlaneAnormal1.copy(this.faceNormals[closestFaceA]);//transA.getBasis()* btVector3(polyA.m_plane[0],polyA.m_plane[1],polyA.m_plane[2]);
                quatA.rotatePoint(worldPlaneAnormal1, worldPlaneAnormal1);
                posA.addTo(worldPlaneAnormal1, worldPlaneAnormal1);
                WorldEdge0.crossTo(worldPlaneAnormal1, planeNormalWS1);
                planeNormalWS1.negateTo(planeNormalWS1);
                worldA1.copy(a);
                quatA.rotatePoint(worldA1, worldA1);
                posA.addTo(worldA1, worldA1);

                var otherFace = connectedFaces[e0];
                localPlaneNormal.copy(this.faceNormals[otherFace]);
                var localPlaneEq = this.getPlaneConstantOfFace(otherFace);

                planeNormalWS.copy(localPlaneNormal);
                quatA.rotatePoint(planeNormalWS, planeNormalWS);
                //posA.vadd(planeNormalWS,planeNormalWS);
                var planeEqWS = localPlaneEq - planeNormalWS.dot(posA);

                // Clip face against our constructed plane
                this.clipFaceAgainstPlane(pVtxIn, pVtxOut, planeNormalWS, planeEqWS);

                // Throw away all clipped points, but save the reamining until next clip
                while (pVtxIn.length)
                {
                    pVtxIn.shift();
                }
                while (pVtxOut.length)
                {
                    pVtxIn.push(pVtxOut.shift());
                }
            }

            //console.log("Resulting points after clip:",pVtxIn);

            // only keep contact points that are behind the witness face
            localPlaneNormal.copy(this.faceNormals[closestFaceA]);

            var localPlaneEq = this.getPlaneConstantOfFace(closestFaceA);
            planeNormalWS.copy(localPlaneNormal);
            quatA.rotatePoint(planeNormalWS, planeNormalWS);

            var planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
            for (var i = 0; i < pVtxIn.length; i++)
            {
                var depth = planeNormalWS.dot(pVtxIn[i]) + planeEqWS; //???
                if (depth <= minDist)
                {
                    console.log("clamped: depth=" + depth + " to minDist=" + (minDist + ""));
                    depth = minDist;
                }

                if (depth <= maxDist)
                {
                    var point = pVtxIn[i];
                    if (depth <= 0)
                    {
                        var p = { point: point, normal: planeNormalWS, depth: depth, };
                        result.push(p);
                    }
                }
            }
        }

        /**
         * Clip a face in a hull against the back of a plane.
         * 
         * @param inVertices
         * @param outVertices
         * @param planeNormal
         * @param planeConstant The constant in the mathematical plane equation
         */
        clipFaceAgainstPlane(inVertices: feng3d.Vector3[], outVertices: feng3d.Vector3[], planeNormal: feng3d.Vector3, planeConstant: number)
        {
            var n_dot_first, n_dot_last;
            var numVerts = inVertices.length;

            if (numVerts < 2)
            {
                return outVertices;
            }

            var firstVertex = inVertices[inVertices.length - 1],
                lastVertex = inVertices[0];

            n_dot_first = planeNormal.dot(firstVertex) + planeConstant;

            for (var vi = 0; vi < numVerts; vi++)
            {
                lastVertex = inVertices[vi];
                n_dot_last = planeNormal.dot(lastVertex) + planeConstant;
                if (n_dot_first < 0)
                {
                    if (n_dot_last < 0)
                    {
                        // Start < 0, end < 0, so output lastVertex
                        var newv = new feng3d.Vector3();
                        newv.copy(lastVertex);
                        outVertices.push(newv);
                    } else
                    {
                        // Start < 0, end >= 0, so output intersection
                        var newv = new feng3d.Vector3();
                        firstVertex.lerpNumberTo(lastVertex,
                            n_dot_first / (n_dot_first - n_dot_last),
                            newv);
                        outVertices.push(newv);
                    }
                } else
                {
                    if (n_dot_last < 0)
                    {
                        // Start >= 0, end < 0 so output intersection and end
                        var newv = new feng3d.Vector3();
                        firstVertex.lerpNumberTo(lastVertex,
                            n_dot_first / (n_dot_first - n_dot_last),
                            newv);
                        outVertices.push(newv);
                        outVertices.push(lastVertex);
                    }
                }
                firstVertex = lastVertex;
                n_dot_first = n_dot_last;
            }
            return outVertices;
        }

        /**
         * 计算世界空间顶点数组
         * 
         * @param position 
         * @param quat 
         */
        computeWorldVertices(position: feng3d.Vector3, quat: feng3d.Quaternion)
        {
            var N = this.vertices.length;
            while (this.worldVertices.length < N)
            {
                this.worldVertices.push(new feng3d.Vector3());
            }

            var verts = this.vertices,
                worldVerts = this.worldVertices;
            for (var i = 0; i !== N; i++)
            {
                quat.rotatePoint(verts[i], worldVerts[i]);
                position.addTo(worldVerts[i], worldVerts[i]);
            }

            this.worldVerticesNeedsUpdate = false;
        }

        computeLocalAABB(aabbmin: feng3d.Vector3, aabbmax: feng3d.Vector3)
        {
            var n = this.vertices.length;
            var vertices = this.vertices;

            aabbmin.init(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            aabbmax.init(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

            for (var i = 0; i < n; i++)
            {
                var v = vertices[i];
                if (v.x < aabbmin.x)
                {
                    aabbmin.x = v.x;
                } else if (v.x > aabbmax.x)
                {
                    aabbmax.x = v.x;
                }
                if (v.y < aabbmin.y)
                {
                    aabbmin.y = v.y;
                } else if (v.y > aabbmax.y)
                {
                    aabbmax.y = v.y;
                }
                if (v.z < aabbmin.z)
                {
                    aabbmin.z = v.z;
                } else if (v.z > aabbmax.z)
                {
                    aabbmax.z = v.z;
                }
            }
        }

        /**
         * Updates .worldVertices and sets .worldVerticesNeedsUpdate to false.
         * 
         * @param quat
         */
        computeWorldFaceNormals(quat: feng3d.Quaternion)
        {
            var N = this.faceNormals.length;
            while (this.worldFaceNormals.length < N)
            {
                this.worldFaceNormals.push(new feng3d.Vector3());
            }

            var normals = this.faceNormals,
                worldNormals = this.worldFaceNormals;
            for (var i = 0; i !== N; i++)
            {
                quat.rotatePoint(normals[i], worldNormals[i]);
            }

            this.worldFaceNormalsNeedsUpdate = false;
        };

        updateBoundingSphereRadius()
        {
            // Assume points are distributed with local (0,0,0) as center
            var max2 = 0;
            var verts = this.vertices;
            for (var i = 0, N = verts.length; i !== N; i++)
            {
                var norm2 = verts[i].lengthSquared;
                if (norm2 > max2)
                {
                    max2 = norm2;
                }
            }
            this.boundingSphereRadius = Math.sqrt(max2);
        }

        /**
         * 
         * @param  pos
         * @param quat
         * @param min
         * @param max
         */
        calculateWorldAABB(pos: feng3d.Vector3, quat: feng3d.Quaternion, min: feng3d.Vector3, max: feng3d.Vector3)
        {
            var n = this.vertices.length, verts = this.vertices;
            var minx: number, miny: number, minz: number, maxx: number, maxy: number, maxz: number;

            var tempWorldVertex = new feng3d.Vector3();
            for (var i = 0; i < n; i++)
            {
                tempWorldVertex.copy(verts[i]);
                quat.rotatePoint(tempWorldVertex, tempWorldVertex);
                pos.addTo(tempWorldVertex, tempWorldVertex);
                var v = tempWorldVertex;
                if (v.x < minx || minx === undefined)
                {
                    minx = v.x;
                } else if (v.x > maxx || maxx === undefined)
                {
                    maxx = v.x;
                }

                if (v.y < miny || miny === undefined)
                {
                    miny = v.y;
                } else if (v.y > maxy || maxy === undefined)
                {
                    maxy = v.y;
                }

                if (v.z < minz || minz === undefined)
                {
                    minz = v.z;
                } else if (v.z > maxz || maxz === undefined)
                {
                    maxz = v.z;
                }
            }
            min.init(minx, miny, minz);
            max.init(maxx, maxy, maxz);
        }

        /**
         * Get approximate convex volume
         */
        volume()
        {
            return 4.0 * Math.PI * this.boundingSphereRadius / 3.0;
        }

        /**
         * Get an average of all the vertices positions
         * 
         * @param target
         */
        getAveragePointLocal(target: feng3d.Vector3)
        {
            target = target || new feng3d.Vector3();
            var n = this.vertices.length,
                verts = this.vertices;
            for (var i = 0; i < n; i++)
            {
                target.addTo(verts[i], target);
            }
            target.scaleNumberTo(1 / n, target);
            return target;
        }

        /**
         * Transform all local points. Will change the .vertices
         * 
         * @param  offset
         * @param quat
         */
        transformAllPoints(offset: feng3d.Vector3, quat: feng3d.Quaternion)
        {
            var n = this.vertices.length,
                verts = this.vertices;

            // Apply rotation
            if (quat)
            {
                // Rotate vertices
                for (var i = 0; i < n; i++)
                {
                    var v = verts[i];
                    quat.rotatePoint(v, v);
                }
                // Rotate face normals
                for (var i = 0; i < this.faceNormals.length; i++)
                {
                    var v = this.faceNormals[i];
                    quat.rotatePoint(v, v);
                }
                /*
                // Rotate edges
                for(var i=0; i<this.uniqueEdges.length; i++){
                    var v = this.uniqueEdges[i];
                    quat.vmult(v,v);
                }*/
            }

            // Apply offset
            if (offset)
            {
                for (var i = 0; i < n; i++)
                {
                    var v = verts[i];
                    v.addTo(offset, v);
                }
            }
        }

        /**
         * Checks whether p is inside the polyhedra. Must be in local coords. The point lies outside of the convex hull of the other points if and only if the direction of all the vectors from it to those other points are on less than one half of a sphere around it.
         * 
         * @param p      A point given in local coordinates
         */
        pointIsInside(p: feng3d.Vector3)
        {
            var vToP = new feng3d.Vector3();
            var vToPointInside = new feng3d.Vector3();
            //
            var verts = this.vertices;
            var faces = this.faces;
            var normals = this.faceNormals;
            var positiveResult = null;
            var N = this.faces.length;
            var pointInside = new feng3d.Vector3();
            this.getAveragePointLocal(pointInside);
            for (var i = 0; i < N; i++)
            {
                var n0 = normals[i];
                var v = verts[faces[i][0]]; // We only need one point in the face

                // This dot product determines which side of the edge the point is
                p.subTo(v, vToP);
                var r1 = n0.dot(vToP);

                pointInside.subTo(v, vToPointInside);
                var r2 = n0.dot(vToPointInside);

                if ((r1 < 0 && r2 > 0) || (r1 > 0 && r2 < 0))
                {
                    return false; // Encountered some other sign. Exit.
                } else
                {
                }
            }

            // If we got here, all dot products were of the same sign.
            return positiveResult ? 1 : -1;
        }

        /**
         * Get max and min dot product of a convex hull at position (pos,quat) projected onto an axis. Results are saved in the array maxmin.
         * 
         * @param hull
         * @param axis
         * @param pos
         * @param quat
         * @param result result[0] and result[1] will be set to maximum and minimum, respectively.
         */
        static project(hull: ConvexPolyhedron, axis: feng3d.Vector3, transform: Transform, result: number[])
        {
            var n = hull.vertices.length;
            var localAxis = new feng3d.Vector3();
            var max = 0;
            var min = 0;
            var localOrigin = new feng3d.Vector3();
            var vs = hull.vertices;

            localOrigin.setZero();

            // Transform the axis to local
            transform.vectorToLocalFrame(axis, localAxis);
            transform.pointToLocalFrame(localOrigin, localOrigin);
            var add = localOrigin.dot(localAxis);

            min = max = vs[0].dot(localAxis);

            for (var i = 1; i < n; i++)
            {
                var val = vs[i].dot(localAxis);

                if (val > max)
                {
                    max = val;
                }

                if (val < min)
                {
                    min = val;
                }
            }

            min -= add;
            max -= add;

            if (min > max)
            {
                // Inconsistent - swap
                var temp = min;
                min = max;
                max = temp;
            }
            // Output
            result[0] = max;
            result[1] = min;
        };
    }

}