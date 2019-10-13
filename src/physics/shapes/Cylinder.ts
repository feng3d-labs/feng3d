namespace CANNON
{
    /**
     * 圆柱体
     */
    export class Cylinder extends ConvexPolyhedron
    {
        /**
         * @param radiusTop 顶部半径
         * @param radiusBottom 底部半径
         * @param height 高度
         * @param numSegments 圆周分段数
         */
        constructor(radiusTop: number, radiusBottom: number, height: number, numSegments: number)
        {
            var N = numSegments;
            var verts: feng3d.Vector3[] = [];
            var axes: feng3d.Vector3[] = [];
            var faces: number[][] = [];
            var bottomface: number[] = [];
            var topface: number[] = [];
            var cos = Math.cos;
            var sin = Math.sin;

            // 第一个底部顶点
            verts.push(new feng3d.Vector3(radiusBottom * cos(0),
                radiusBottom * sin(0),
                -height * 0.5));
            bottomface.push(0);

            // 第一个顶部顶点
            verts.push(new feng3d.Vector3(radiusTop * cos(0),
                radiusTop * sin(0),
                height * 0.5));
            topface.push(1);

            for (var i = 0; i < N; i++)
            {
                var theta = 2 * Math.PI / N * (i + 1);
                var thetaN = 2 * Math.PI / N * (i + 0.5);
                if (i < N - 1)
                {
                    // Bottom
                    verts.push(new feng3d.Vector3(radiusBottom * cos(theta),
                        radiusBottom * sin(theta),
                        -height * 0.5));
                    bottomface.push(2 * i + 2);
                    // Top
                    verts.push(new feng3d.Vector3(radiusTop * cos(theta),
                        radiusTop * sin(theta),
                        height * 0.5));
                    topface.push(2 * i + 3);

                    // Face
                    faces.push([2 * i + 2, 2 * i + 3, 2 * i + 1, 2 * i]);
                } else
                {
                    faces.push([0, 1, 2 * i + 1, 2 * i]); // Connect
                }

                // Axis: we can cut off half of them if we have even number of segments
                if (N % 2 === 1 || i < N / 2)
                {
                    axes.push(new feng3d.Vector3(cos(thetaN), sin(thetaN), 0));
                }
            }
            faces.push(topface);
            axes.push(new feng3d.Vector3(0, 0, 1));

            // Reorder bottom face
            var temp = [];
            for (var i = 0; i < bottomface.length; i++)
            {
                temp.push(bottomface[bottomface.length - i - 1]);
            }
            faces.push(temp);

            super(verts, faces, axes);
        }

    }
}