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
         * 场景
         */
        public scene3d: Scene3D;

        /**
         * 3D视窗
         */
        public view3D: View3D;

        /**
         * WebGL实例
         */
        public gl: GL;

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderAtomic: RenderAtomic)
        {
            var pointLights: PointLight[] = [];
            var directionalLights: DirectionalLight[] = [];
            this.camera.updateRenderData(this, renderAtomic);
            var lights = this.scene3d.lights;
            var light: Light;
            for (var i = 0; i < lights.length; i++)
            {
                light = lights[i];
                light.updateRenderData(this, renderAtomic);
                if (light instanceof PointLight)
                    pointLights.push(light);
                if (light instanceof DirectionalLight)
                    directionalLights.push(light);
            }
            renderAtomic.shaderMacro.valueMacros.NUM_LIGHT = lights.length;
            //收集点光源数据
            var pointLightPositions: Vector3D[] = [];
            var pointLightColors: Vector3D[] = [];
            var pointLightIntensitys: number[] = [];
            var pointLightRanges: number[] = [];
            for (var i = 0; i < pointLights.length; i++)
            {
                var pointLight = pointLights[i];
                pointLightPositions.push(pointLight.position);
                pointLightColors.push(pointLight.color);
                pointLightIntensitys.push(pointLight.intensity);
                pointLightRanges.push(pointLight.range);
            }
            //设置点光源数据
            renderAtomic.shaderMacro.valueMacros.NUM_POINTLIGHT = pointLights.length;
            if (pointLights.length > 0)
            {
                renderAtomic.shaderMacro.addMacros.A_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.addMacros.V_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.addMacros.V_GLOBAL_POSITION_NEED = 1;
                renderAtomic.shaderMacro.addMacros.U_CAMERAMATRIX_NEED = 1;
                //
                renderAtomic.uniforms[RenderDataID.u_pointLightPositions] = pointLightPositions;
                renderAtomic.uniforms[RenderDataID.u_pointLightColors] = pointLightColors;
                renderAtomic.uniforms[RenderDataID.u_pointLightIntensitys] = pointLightIntensitys;
                renderAtomic.uniforms[RenderDataID.u_pointLightRanges] = pointLightRanges;
            }
            var directionalLightDirections: Vector3D[] = [];
            var directionalLightColors: Vector3D[] = [];
            var directionalLightIntensitys: number[] = [];
            for (var i = 0; i < directionalLights.length; i++)
            {
                var directionalLight = directionalLights[i];
                directionalLightDirections.push(directionalLight.direction);
                directionalLightColors.push(directionalLight.color);
                directionalLightIntensitys.push(directionalLight.intensity);
            }
            renderAtomic.shaderMacro.valueMacros.NUM_DIRECTIONALLIGHT = directionalLights.length;
            if (directionalLights.length > 0)
            {
                renderAtomic.shaderMacro.addMacros.A_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.addMacros.V_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.addMacros.U_CAMERAMATRIX_NEED = 1;
                //
                renderAtomic.uniforms[RenderDataID.u_directionalLightDirections] = directionalLightDirections;
                renderAtomic.uniforms[RenderDataID.u_directionalLightColors] = directionalLightColors;
                renderAtomic.uniforms[RenderDataID.u_directionalLightIntensitys] = directionalLightIntensitys;
            }

            renderAtomic.uniforms[RenderDataID.u_sceneAmbientColor] = this.scene3d.ambientColor;
        }
    }
}