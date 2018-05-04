namespace feng3d
{

    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    export class RenderContext extends EventDispatcher
    {
        NUM_POINTLIGHT = 4;
        NUM_DIRECTIONALLIGHT = 2;

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
            var pointLightColors: Color3[] = [];
            var pointLightIntensitys: number[] = [];
            var pointLightRanges: number[] = [];
            for (var i = 0; i < this.NUM_POINTLIGHT; i++)
            {
                var pointLight = pointLights[i];
                if (pointLight)
                {
                    pointLightPositions.push(pointLight.transform.scenePosition);
                    pointLightColors.push(pointLight.color);
                    pointLightIntensitys.push(pointLight.intensity);
                    pointLightRanges.push(pointLight.range);
                } else
                {
                    pointLightPositions.push(new Vector3());
                    pointLightColors.push(new Color3());
                    pointLightIntensitys.push(0);
                    pointLightRanges.push(0);
                }
            }
            //设置点光源数据

            //
            renderAtomic.uniforms.u_pointLightPositions = pointLightPositions;
            renderAtomic.uniforms.u_pointLightColors = pointLightColors;
            renderAtomic.uniforms.u_pointLightIntensitys = pointLightIntensitys;
            renderAtomic.uniforms.u_pointLightRanges = pointLightRanges;
            //
            var directionalLightDirections: Vector3[] = [];
            var directionalLightColors: Color3[] = [];
            var directionalLightIntensitys: number[] = [];
            for (var i = 0; i < this.NUM_DIRECTIONALLIGHT; i++)
            {
                var directionalLight = directionalLights[i];
                if (directionalLight)
                {
                    directionalLightDirections.push(directionalLight.transform.localToWorldMatrix.forward);
                    directionalLightColors.push(directionalLight.color);
                    directionalLightIntensitys.push(directionalLight.intensity);
                } else
                {
                    directionalLightDirections.push(new Vector3());
                    directionalLightColors.push(new Color3());
                    directionalLightIntensitys.push(0);
                }
            }
            //
            renderAtomic.uniforms.u_directionalLightDirections = directionalLightDirections;
            renderAtomic.uniforms.u_directionalLightColors = directionalLightColors;
            renderAtomic.uniforms.u_directionalLightIntensitys = directionalLightIntensitys;

            renderAtomic.uniforms.u_sceneAmbientColor = this.scene3d.ambientColor;
        }
    }
}