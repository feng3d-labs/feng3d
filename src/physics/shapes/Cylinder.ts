namespace CANNON
{
    /**
     * 圆柱体
     */
    export class Cylinder extends Trimesh
    {
        // type = ShapeType.CYLINDER;

        /**
         * @param radiusTop 顶部半径
         * @param radiusBottom 底部半径
         * @param height 高度
         * @param numSegments 圆周分段数
         */
        constructor(radiusTop: number, radiusBottom: number, height: number, numSegments: number)
        {
            var g = new feng3d.CylinderGeometry();
            g.topRadius = radiusTop;
            g.bottomRadius = radiusBottom;
            g.height = height;
            g.segmentsW = numSegments;

            super(g.positions, g.indices);

            this.type = ShapeType.CYLINDER;
        }

    }
}