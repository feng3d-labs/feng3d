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

            //
            var castsShadowDirectionalLights: DirectionalLight[] = [];
            var unCastsShadowDirectionalLights: DirectionalLight[] = [];
            var directionalShadowMatrix: Matrix4x4[] = [];
            // var castsShadows
            directionalLights.forEach(element =>
            {
                if (!element.isVisibleAndEnabled) return;
                if (element.castsShadows)
                {
                    castsShadowDirectionalLights.push(element);
                    directionalShadowMatrix.push(element.shadow.camera.viewProjection);
                } else
                {
                    unCastsShadowDirectionalLights.push(element);
                }
            });

            renderAtomic.shaderMacro.NUM_DIRECTIONALLIGHT = unCastsShadowDirectionalLights.length;
            renderAtomic.uniforms.directionalLights = unCastsShadowDirectionalLights;
            //
            renderAtomic.shaderMacro.NUM_DIRECTIONALLIGHT_CASTSHADOW = castsShadowDirectionalLights.length;
            renderAtomic.uniforms.castsShadowDirectionalLights = castsShadowDirectionalLights;
            renderAtomic.uniforms.u_directionalShadowMatrix = directionalShadowMatrix;
        }
    }
}