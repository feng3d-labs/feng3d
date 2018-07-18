namespace feng3d
{
    export class LightPicker
    {
        private _meshRenderer: MeshRenderer

        constructor(meshRenderer: MeshRenderer)
        {
            this._meshRenderer = meshRenderer;
        }

        preRender(renderAtomic: RenderAtomic)
        {
            var scene3d = this._meshRenderer.gameObject.scene;
            var pointLights = scene3d.collectComponents.pointLights.list;
            var directionalLights = scene3d.collectComponents.directionalLights.list;

            renderAtomic.shaderMacro.NUM_LIGHT = pointLights.length + directionalLights.length;
            //收集点光源数据
            var pointLightPositions: Vector3[] = [];
            var pointLightColors: Color3[] = [];
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

            renderAtomic.shaderMacro.NUM_POINTLIGHT = pointLights.length;
            if (pointLights.length > 0)
            {
                renderAtomic.shaderMacro.A_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.V_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.GLOBAL_POSITION_NEED = 1;
                renderAtomic.shaderMacro.U_CAMERAMATRIX_NEED = 1;
                //
                renderAtomic.uniforms.u_pointLightPositions = pointLightPositions;
                renderAtomic.uniforms.u_pointLightColors = pointLightColors;
                renderAtomic.uniforms.u_pointLightIntensitys = pointLightIntensitys;
                renderAtomic.uniforms.u_pointLightRanges = pointLightRanges;
            }
            var directionalLightDirections: Vector3[] = [];
            var directionalLightColors: Color3[] = [];
            var directionalLightIntensitys: number[] = [];
            for (var i = 0; i < directionalLights.length; i++)
            {
                var directionalLight = directionalLights[i];
                directionalLightDirections.push(directionalLight.transform.localToWorldMatrix.forward);
                directionalLightColors.push(directionalLight.color);
                directionalLightIntensitys.push(directionalLight.intensity);
            }
            renderAtomic.shaderMacro.NUM_DIRECTIONALLIGHT = directionalLights.length;
            if (directionalLights.length > 0)
            {
                renderAtomic.shaderMacro.A_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.V_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.U_CAMERAMATRIX_NEED = 1;
                //
                renderAtomic.uniforms.u_directionalLightDirections = directionalLightDirections;
                renderAtomic.uniforms.u_directionalLightColors = directionalLightColors;
                renderAtomic.uniforms.u_directionalLightIntensitys = directionalLightIntensitys;
            }
        }
    }
}