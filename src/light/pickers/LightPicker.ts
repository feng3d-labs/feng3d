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
            var pointLights: PointLight[] = [];
            var directionalLights: DirectionalLight[] = [];

            var scene3d = this._meshRenderer.gameObject.scene;
            if (scene3d)
            {
                pointLights = scene3d.collectComponents.pointLights.list;
                directionalLights = scene3d.collectComponents.directionalLights.list;
            }

            renderAtomic.shaderMacro.NUM_LIGHT = pointLights.length + directionalLights.length;
            //设置点光源数据

            renderAtomic.uniforms.pointLights = pointLights;
            renderAtomic.shaderMacro.NUM_POINTLIGHT = pointLights.length;
            renderAtomic.shaderMacro.NUM_DIRECTIONALLIGHT = directionalLights.length;
            renderAtomic.uniforms.directionalLights = directionalLights;

            if (pointLights.length > 0)
            {
                renderAtomic.shaderMacro.A_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.V_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.GLOBAL_POSITION_NEED = 1;
                renderAtomic.shaderMacro.U_CAMERAMATRIX_NEED = 1;
            }
            
            if (directionalLights.length > 0)
            {
                renderAtomic.shaderMacro.A_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.V_NORMAL_NEED = 1;
                renderAtomic.shaderMacro.U_CAMERAMATRIX_NEED = 1;
            }
        }
    }
}