namespace feng3d
{

    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    export class RenderContext extends RenderDataHolder
    {
        /**
         * 摄像机
         */
        public get camera()
        {
            return this._camera;
        }
        public set camera(value)
        {
            if(this._camera == value)
            return;
            if(this._camera)
                this.removeRenderDataHolder(this._camera);
            this._camera = value;
            if(this._camera)
                this.addRenderDataHolder(this._camera);
        }
        private _camera: Camera;

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
        public updateRenderData1()
        {
            var pointLights = PointLight.pointLights;
            var directionalLights = DirectionalLight.directionalLights;

            this.createValueMacro("NUM_LIGHT", Light.lights.length);
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
            this.createValueMacro("NUM_POINTLIGHT", pointLights.length);
            if (pointLights.length > 0)
            {
                this.createAddMacro("A_NORMAL_NEED", 1);
                this.createAddMacro("V_NORMAL_NEED", 1);
                this.createAddMacro("V_GLOBAL_POSITION_NEED", 1);
                this.createAddMacro("U_CAMERAMATRIX_NEED", 1);
                //
                this.createUniformData("u_pointLightPositions", pointLightPositions);
                this.createUniformData("u_pointLightColors", pointLightColors);
                this.createUniformData("u_pointLightIntensitys", pointLightIntensitys);
                this.createUniformData("u_pointLightRanges", pointLightRanges);
            }
            var directionalLightDirections: Vector3D[] = [];
            var directionalLightColors: Vector3D[] = [];
            var directionalLightIntensitys: number[] = [];
            for (var i = 0; i < directionalLights.length; i++)
            {
                var directionalLight = directionalLights[i];
                directionalLightDirections.push(directionalLight.sceneDirection);
                directionalLightColors.push(directionalLight.color);
                directionalLightIntensitys.push(directionalLight.intensity);
            }
            this.createValueMacro("NUM_DIRECTIONALLIGHT", directionalLights.length);
            if (directionalLights.length > 0)
            {
                this.createAddMacro("A_NORMAL_NEED", 1);
                this.createAddMacro("V_NORMAL_NEED", 1);
                this.createAddMacro("U_CAMERAMATRIX_NEED", 1);
                //
                this.createUniformData("u_directionalLightDirections", directionalLightDirections);
                this.createUniformData("u_directionalLightColors", directionalLightColors);
                this.createUniformData("u_directionalLightIntensitys", directionalLightIntensitys);
            }

            this.createUniformData("u_sceneAmbientColor", this.scene3d.ambientColor);
            this.createUniformData("u_scaleByDepth", this.view3D.getScaleByDepth(1));
        }
    }
}