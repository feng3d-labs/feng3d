module feng3d
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
        @oav()
        get diffuseMethod()
        {
            return this._diffuseMethod;
        }
        set diffuseMethod(value)
        {
            if (this._diffuseMethod == value)
                return;
            super.removeMethod(this._diffuseMethod);
            this._diffuseMethod = value;
            super.addMethod(this._diffuseMethod);
        }
        private _diffuseMethod: DiffuseMethod;
        /**
         * 法线函数
         */
        @oav()
        get normalMethod()
        {
            return this._normalMethod;
        }
        set normalMethod(value)
        {
            if (this._normalMethod == value)
                return;
            super.removeMethod(this._normalMethod);
            this._normalMethod = value;
            super.addMethod(this._normalMethod);
        }
        private _normalMethod: NormalMethod;

        /**
         * 镜面反射函数
         */
        @oav()
        get specularMethod()
        {
            return this._specularMethod;
        }
        set specularMethod(value)
        {
            if (this._specularMethod == value)
                return;
            super.removeMethod(this._specularMethod);
            this._specularMethod = value;
            super.addMethod(this._specularMethod);
        }
        private _specularMethod: SpecularMethod;

        /**
         * 环境反射函数
         */
        @oav()
        get ambientMethod()
        {
            return this._ambientMethod;
        }
        set ambientMethod(value)
        {
            if (this._ambientMethod == value)
                return;
            super.removeMethod(this._ambientMethod);
            this._ambientMethod = value;
            super.addMethod(this._ambientMethod);
        }
        private _ambientMethod: AmbientMethod;

        /**
         * 添加方法
         */
        addMethod(method: RenderDataHolder)
        {
            if (method instanceof DiffuseMethod)
            {
                this.diffuseMethod = method;
            }
            if (method instanceof NormalMethod)
            {
                this.normalMethod = method;
            }
            if (method instanceof SpecularMethod)
            {
                this.specularMethod = method;
            }
            if (method instanceof AmbientMethod)
            {
                this.ambientMethod = method;
            }
            super.addMethod(method);
        }

        /**
         * 删除方法
         */
        removeMethod(method: RenderDataHolder)
        {
            if (method == this.diffuseMethod)
            {
                this.diffuseMethod = <any>null;
            }
            if (method == this.normalMethod)
            {
                this.normalMethod = <any>null;
            }
            if (method == this.specularMethod)
            {
                this.specularMethod = <any>null;
            }
            if (method == this.ambientMethod)
            {
                this.ambientMethod = <any>null;
            }
            super.removeMethod(method);
        }

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

            //
            this.diffuseMethod = new DiffuseMethod(diffuseUrl);
            this.normalMethod = new NormalMethod(normalUrl);
            this.specularMethod = new SpecularMethod(specularUrl);
            this.ambientMethod = new AmbientMethod(ambientUrl);
        }

        private onmethodchange(host, property, oldvalue)
        {
            this.removeMethod(oldvalue);
            this.addMethod(this[property]);
        }
    }
}