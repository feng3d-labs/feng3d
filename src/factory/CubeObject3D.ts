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
        constructor(width = 100, name = "cube")
        {
            super(name);
            var mesh = this.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = new CubeGeometry(width, width, width);
            this.getOrCreateComponentByClass(MeshRenderer).material = new StandardMaterial();
        }
    }
}