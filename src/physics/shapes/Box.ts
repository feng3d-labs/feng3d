namespace CANNON
{
    export class Box extends ConvexPolyhedron
    {

        halfExtents: feng3d.Vector3;

        /**
         * A 3d box shape.
         * @param halfExtents
         * @author schteppe
         */
        constructor(halfExtents: feng3d.Vector3)
        {
            var sx = halfExtents.x;
            var sy = halfExtents.y;
            var sz = halfExtents.z;
            var V = feng3d.Vector3;

            var vertices = [
                new V(-sx, -sy, -sz),
                new V(sx, -sy, -sz),
                new V(sx, sy, -sz),
                new V(-sx, sy, -sz),
                new V(-sx, -sy, sz),
                new V(sx, -sy, sz),
                new V(sx, sy, sz),
                new V(-sx, sy, sz)
            ];

            var indices = [
                [3, 2, 1, 0], // -z
                [4, 5, 6, 7], // +z
                [5, 4, 0, 1], // -y
                [2, 3, 7, 6], // +y
                [0, 4, 7, 3], // -x
                [1, 2, 6, 5], // +x
            ];

            super(vertices, indices);
            this.type = ShapeType.BOX;

            this.halfExtents = halfExtents;

            this.updateBoundingSphereRadius();
        }

        calculateLocalInertia(mass: number, target = new feng3d.Vector3())
        {
            Box.calculateInertia(this.halfExtents, mass, target);
            return target;
        }

        static calculateInertia(halfExtents: feng3d.Vector3, mass: number, target: feng3d.Vector3)
        {
            var e = halfExtents;
            target.x = 1.0 / 12.0 * mass * (2 * e.y * 2 * e.y + 2 * e.z * 2 * e.z);
            target.y = 1.0 / 12.0 * mass * (2 * e.x * 2 * e.x + 2 * e.z * 2 * e.z);
            target.z = 1.0 / 12.0 * mass * (2 * e.y * 2 * e.y + 2 * e.x * 2 * e.x);
        }

        /**
         * Get the box 6 side normals
         * @param sixTargetVectors An array of 6 vectors, to store the resulting side normals in.
         * @param quat             Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
         */
        getSideNormals(sixTargetVectors: feng3d.Vector3[], quat: feng3d.Quaternion)
        {
            var sides = sixTargetVectors;
            var ex = this.halfExtents;
            sides[0].init(ex.x, 0, 0);
            sides[1].init(0, ex.y, 0);
            sides[2].init(0, 0, ex.z);
            sides[3].init(-ex.x, 0, 0);
            sides[4].init(0, -ex.y, 0);
            sides[5].init(0, 0, -ex.z);

            if (quat !== undefined)
            {
                for (var i = 0; i !== sides.length; i++)
                {
                    quat.vmult(sides[i], sides[i]);
                }
            }

            return sides;
        }

        volume()
        {
            return 8.0 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z;
        }
    }
}