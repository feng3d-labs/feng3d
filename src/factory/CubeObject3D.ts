module feng3d
{

    /**
     * 立方体3D对象
     * @author feng 2017-02-06
     */
    export class CubeObject3D extends Object3D
    {

        /**
         * 构建3D对象
         */
        constructor(name = "cube")
        {

            super(name);
            var mesh = this.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = new CubeGeometry();
            this.getOrCreateComponentByClass(MeshRenderer);
        }
    }
}