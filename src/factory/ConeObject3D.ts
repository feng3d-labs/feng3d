module feng3d
{

    /**
     * 圆锥体3D对象
     * @author feng 2017-02-06
     */
    export class ConeObject3D extends Object3D
    {
        /**
         * 构建3D对象
         */
        constructor(radius = 50, height = 100, name = "cone")
        {
            super(name);
            var mesh = this.getOrCreateComponentByClass(MeshFilter);
            mesh.geometry = new ConeGeometry(radius, height);
            this.getOrCreateComponentByClass(MeshRenderer).material = new StandardMaterial();
        }
    }
}