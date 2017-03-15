module feng3d
{

    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    export class RenderContext
    {
        public get renderData() { return this._renderData; }
        protected _renderData = new RenderData();
        /**
         * 摄像机
         */
        public camera: Camera;

        /**
         * 灯光
         */
        public lights: Light[] = [];

        /**
		 * 更新渲染数据
		 */
        public updateRenderData()
        {
            this._renderData = new RenderData();

            var pointLights: Light[] = [];
            this.camera.updateRenderData(this, this._renderData);
            var light: Light;
            for (var i = 0; i < this.lights.length; i++)
            {
                light = this.lights[i];
                light.updateRenderData(this, this._renderData);
                if (light.lightType == LightType.Point)
                    pointLights.push(light);
            }
            //收集点光源数据
            var pointLightPositions: Vector3D[] = [];
            var pointLightDiffuses: Vector3D[] = [];
            var pointLightIntensitys: number[] = [];
            for (var i = 0; i < pointLights.length; i++)
            {
                light = pointLights[i];
                pointLightPositions.push(light.position);
                pointLightDiffuses.push(light.color.toVector3D());
                pointLightIntensitys.push(light.intensity);
            }
            //设置点光源数据
            this._renderData.shaderMacro.valueMacros.NUM_POINTLIGHT = pointLights.length;
            if (pointLights.length > 0)
            {
                this._renderData.shaderMacro.addMacros.A_NORMAL_NEED = 1;
                this._renderData.shaderMacro.addMacros.V_NORMAL_NEED = 1;
                this._renderData.shaderMacro.addMacros.V_GLOBAL_POSITION_NEED = 1;
                this._renderData.shaderMacro.addMacros.U_CAMERAmATRIX_NEED = 1;
                //
                this._renderData.uniforms[RenderDataID.u_pointLightPositions] = pointLightPositions;
                this._renderData.uniforms[RenderDataID.u_pointLightColors] = pointLightDiffuses;
                this._renderData.uniforms[RenderDataID.u_pointLightIntensitys] = pointLightIntensitys;
            }
        }

        /**
         * 清理
         */
        public clear()
        {
            this.camera = null;
            this.lights = [];
        }
    }
}