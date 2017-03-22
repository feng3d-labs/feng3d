module feng3d
{

    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    export class RenderContext
    {
        /**
         * 摄像机
         */
        public camera: Camera;

        /**
         * 灯光
         */
        public lights: Light[];

        /**
         * 场景环境光强度
         */
        public sceneAmbientColor;

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderAtomic: RenderAtomic)
        {
            var pointLights: PointLight[] = [];
            this.camera.updateRenderData(this, renderAtomic);
            var light: Light;
            for (var i = 0; i < this.lights.length; i++)
            {
                light = this.lights[i];
                light.updateRenderData(this, renderAtomic);
                if (light instanceof PointLight)
                    pointLights.push(light);
            }
            //收集点光源数据
            var pointLightPositions: Vector3D[] = [];
            var pointLightDiffuses: Vector3D[] = [];
            var pointLightIntensitys: number[] = [];
            var pointLightRadiuss: number[] = [];
            for (var i = 0; i < pointLights.length; i++)
            {
                var pointLight = pointLights[i];
                pointLightPositions.push(pointLight.position);
                pointLightDiffuses.push(pointLight.color);
                pointLightIntensitys.push(pointLight.intensity);
                pointLightRadiuss.push(pointLight.range);
            }
            //设置点光源数据
            renderAtomic.shaderMacro.valueMacros.NUM_POINTLIGHT = pointLights.length;
            if (pointLights.length > 0)
            {
                renderAtomic.shaderMacro.addMacros.A_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.addMacros.V_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.addMacros.V_GLOBAL_POSITION_NEED = 1;
                renderAtomic.shaderMacro.addMacros.U_CAMERAmATRIX_NEED = 1;
                //
                renderAtomic.uniforms[RenderDataID.u_pointLightPositions] = pointLightPositions;
                renderAtomic.uniforms[RenderDataID.u_pointLightColors] = pointLightDiffuses;
                renderAtomic.uniforms[RenderDataID.u_pointLightIntensitys] = pointLightIntensitys;
                renderAtomic.uniforms[RenderDataID.u_pointLightRanges] = pointLightRadiuss;
            }
            renderAtomic.uniforms[RenderDataID.u_sceneAmbientColor] = this.sceneAmbientColor;
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