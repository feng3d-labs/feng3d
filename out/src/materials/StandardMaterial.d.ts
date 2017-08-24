declare namespace feng3d {
    /**
     * 标准材质
     * @author feng 2016-05-02
     */
    class StandardMaterial extends Material {
        /**
         * 漫反射函数
         */
        diffuseMethod: DiffuseMethod;
        private _diffuseMethod;
        /**
         * 法线函数
         */
        normalMethod: NormalMethod;
        private _normalMethod;
        /**
         * 镜面反射函数
         */
        specularMethod: SpecularMethod;
        private _specularMethod;
        /**
         * 环境反射函数
         */
        ambientMethod: AmbientMethod;
        private _ambientMethod;
        /**
         * 是否开启混合
         */
        enableBlend: boolean;
        /**
         * 构建
         */
        constructor(diffuseUrl?: string, normalUrl?: string, specularUrl?: string, ambientUrl?: string);
    }
}
