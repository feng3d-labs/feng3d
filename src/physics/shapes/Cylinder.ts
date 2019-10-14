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
            verts.push(new feng3d.Vector3(radiusBottom * cos(0), -height * 0.5, radiusBottom * sin(0)));
            bottomface.push(0);

            // 第一个顶部顶点
            verts.push(new feng3d.Vector3(radiusTop * cos(0), height * 0.5, radiusTop * sin(0)));
            topface.push(1);

            for (var i = 0; i < N; i++)
            {
                var theta = 2 * Math.PI / N * (i + 1);
                var thetaN = 2 * Math.PI / N * (i + 0.5);
                if (i < N - 1)
                {
                    // 底部
                    verts.push(new feng3d.Vector3(radiusBottom * cos(theta), -height * 0.5, radiusBottom * sin(theta)));
                    bottomface.push(2 * i + 2);
                    // 顶部
                    verts.push(new feng3d.Vector3(radiusTop * cos(theta), height * 0.5, radiusTop * sin(theta)));
                    topface.push(2 * i + 3);

                    // 侧面
                    faces.push([2 * i + 2, 2 * i + 3, 2 * i + 1, 2 * i]);
                } else
                {
                    faces.push([0, 1, 2 * i + 1, 2 * i]); // 连接处
                }

                // 如果是偶数段，我们可以切掉一半
                if (N % 2 === 1 || i < N / 2)
                {
                    axes.push(new feng3d.Vector3(cos(thetaN), 0, sin(thetaN)));
                }
            }
            faces.push(topface);
            axes.push(new feng3d.Vector3(0, 1, 0));

            // 反转地面
            var temp = bottomface.reverse();
            faces.push(temp);

            super(verts, faces, axes);
        }

    }
}