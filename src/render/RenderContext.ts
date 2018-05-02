namespace feng3d
{

    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    export class RenderContext extends EventDispatcher
    {
        /**
         * 摄像机
         */
        get camera()
        {
            return this._camera;
        }
        set camera(value)
        {
            if (this._camera == value)
                return;
            this._camera = value;
        }
        private _camera: Camera;

        /**
         * 场景
         */
        scene3d: Scene3D;

        /**
         * WebGL实例
         */
        gl: GL;

        preRender(renderAtomic: RenderAtomic)
        {
            this.camera.preRender(renderAtomic);

            var pointLights = this.scene3d.collectComponents.pointLights.list;
            var directionalLights = this.scene3d.collectComponents.directionalLights.list;

            //收集点光源数据
            var pointLightPositions: Vector3[] = [];
            var pointLightColors: Color[] = [];
            var pointLightIntensitys: number[] = [];
            var pointLightRanges: number[] = [];
            for (var i = 0; i < pointLights.length; i++)
            {
                var pointLight = pointLights[i];
                pointLightPositions.push(pointLight.transform.scenePosition);
                pointLightColors.push(pointLight.color);
                pointLightIntensitys.push(pointLight.intensity);
                pointLightRanges.push(pointLight.range);
            }
            //设置点光源数据

            if (pointLights.length > 0)
            {
                //
                renderAtomic.uniforms.u_pointLightPositions = pointLightPositions;
                renderAtomic.uniforms.u_pointLightColors = pointLightColors;
                renderAtomic.uniforms.u_pointLightIntensitys = pointLightIntensitys;
                renderAtomic.uniforms.u_pointLightRanges = pointLightRanges;
            }
            var directionalLightDirections: Vector3[] = [];
            var directionalLightColors: Color[] = [];
            var directionalLightIntensitys: number[] = [];
            for (var i = 0; i < directionalLights.length; i++)
            {
                var directionalLight = directionalLights[i];
                directionalLightDirections.push(directionalLight.transform.localToWorldMatrix.forward);
                directionalLightColors.push(directionalLight.color);
                directionalLightIntensitys.push(directionalLight.intensity);
            }
            if (directionalLights.length > 0)
            {
                //
                renderAtomic.uniforms.u_directionalLightDirections = directionalLightDirections;
                renderAtomic.uniforms.u_directionalLightColors = directionalLightColors;
                renderAtomic.uniforms.u_directionalLightIntensitys = directionalLightIntensitys;
            }

            renderAtomic.uniforms.u_sceneAmbientColor = this.scene3d.ambientColor;
        }
    }
}