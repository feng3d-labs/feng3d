module feng3d
{
    /**
     * 天空盒3D对象
     * @author feng 2017-02-06
     */
    export class SkyBoxObject3D extends Object3D
    {

        /**
         * 构建3D对象
         */
        constructor(images: HTMLImageElement[], name = "skyBox")
        {
            super(name);
            this.getOrCreateComponentByClass(Model).geometry = new SkyBoxGeometry();
            this.getOrCreateComponentByClass(Model).material = new SkyBoxMaterial(images);
        }
    }
}