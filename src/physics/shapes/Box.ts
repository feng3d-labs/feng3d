namespace CANNON
{
    /**
     * 长方体
     */
    export class Box extends ConvexPolyhedron
    {
        halfExtents: feng3d.Vector3;

        /**
         * 
         * @param halfExtents
         * @author schteppe
         */
        constructor(halfExtents: feng3d.Vector3)
        {
            var g = new feng3d.CubeGeometry();
            g.width = halfExtents.x * 2;
            g.height = halfExtents.y * 2;
            g.depth = halfExtents.z * 2;

            var vertices: feng3d.Vector3[] = []
            for (let i = 0, n = g.positions.length; i < n; i += 3)
            {
                vertices.push(new feng3d.Vector3(g.positions[i], g.positions[i + 1], g.positions[i + 2]));
            }

            var indices: number[][] = [];
            for (let i = 0, n = g.indices.length; i < n; i += 3)
            {
                indices.push([g.indices[i], g.indices[i + 1], g.indices[i + 2]]);
            }

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
         * 得到长方体6面的法线
         * 
         * @param sixTargetVectors 一个由6个向量组成的数组，用来存储产生的面法线。
         * @param quat             将方向应用于法向量。如果没有提供，向量将是关于局部坐标系的。
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
                    quat.rotatePoint(sides[i], sides[i]);
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