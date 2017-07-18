namespace feng3d
{

    /**
     * 标准材质
     * @author feng 2016-05-02
     */
    export class StandardMaterial extends Material
    {
        /**
         * 漫反射函数
         */
        get diffuseMethod()
        {
            return this._diffuseMethod;
        }
        set diffuseMethod(value)
        {
            this._diffuseMethod = value;
            if (this._diffuseMethod)
                this.addMethod(this._diffuseMethod);
        }
        private _diffuseMethod: DiffuseMethod;

        /**
         * 法线函数
         */
        get normalMethod()
        {
            return this._normalMethod;
        }
        set normalMethod(value)
        {
            this._normalMethod = value;
            if (this._normalMethod)
                this.addMethod(this._normalMethod);
        }
        private _normalMethod: NormalMethod;

        /**
         * 镜面反射函数
         */
        get specularMethod()
        {
            return this._specularMethod;
        }
        set specularMethod(value)
        {
            this._specularMethod = value;
            if (this._specularMethod)
                this.addMethod(this._specularMethod);
        }
        private _specularMethod: SpecularMethod;

        /**
         * 环境反射函数
         */
        get ambientMethod()
        {
            return this._ambientMethod;
        }
        set ambientMethod(value)
        {
            this._ambientMethod = value;
            if (this._ambientMethod)
                this.addMethod(this._ambientMethod);
        }
        private _ambientMethod: AmbientMethod;

        // /**
        //  * 反射率
        //  */
        // reflectance = 1.0;

        // /**
        //  * 粗糙度
        //  */
        // roughness = 1.0;

        // /**
        //  * 金属度
        //  */
        // metalic = 1.0;

        /**
         * 是否开启混合
         */
        get enableBlend()
        {
            return this._enableBlend || this.diffuseMethod.color.a != 1.0;
        }

        set enableBlend(value: boolean)
        {
            this._enableBlend = value;
        }

        /**
         * 构建
         */
        constructor(diffuseUrl = "", normalUrl = "", specularUrl = "", ambientUrl = "")
        {
            super();
            this.shaderName = "standard";

            this.diffuseMethod = new DiffuseMethod(diffuseUrl);
            this.normalMethod = new NormalMethod(normalUrl);
            this.specularMethod = new SpecularMethod(specularUrl);
            this.ambientMethod = new AmbientMethod(ambientUrl);
        }
    }
}