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
        constructor(name = "cylinder")
        {

            super(name);
            var mesh = this.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = new CylinderGeometry();
            this.getOrCreateComponentByClass(MeshRenderer);
        }
    }
}