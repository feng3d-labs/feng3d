declare namespace feng3d {
    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    class SkyBoxMaterial extends Material {
        texture: TextureCube;
        private _texture;
        constructor(images?: string[]);
    }
}
