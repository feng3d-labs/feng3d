module feng3d
{

    /**
     * 圆柱体3D对象
     * @author feng 2017-02-06
     */
    export class CylinderObject3D extends Object3D
    {

        /**
         * 构建3D对象
         */
        constructor(name = "cylinder", topRadius = 50, bottomRadius = 50, height = 100, segmentsW = 16, segmentsH = 1, topClosed = true, bottomClosed = true, surfaceClosed = true, yUp = true)
        {

            super(name);
            var mesh = this.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = new CylinderGeometry(topRadius, bottomRadius, height, segmentsW, segmentsH, topClosed, bottomClosed, surfaceClosed, yUp);
            this.getOrCreateComponentByClass(MeshRenderer);
        }
    }
}