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
            var castShadowPointLights: PointLight[] = [];
            var unCastShadowPointLights: PointLight[] = [];
            var pointShadowMatrix: Matrix4x4[] = [];
            var pointShadowMaps: Texture2D[] = [];
            pointLights.forEach(element =>
            {
                if (!element.isVisibleAndEnabled) return;
                if (element.shadowType != ShadowType.No_Shadows && this._meshRenderer.receiveShadows)
                {
                    castShadowPointLights.push(element);
                    pointShadowMatrix.push(element.shadowCamera.viewProjection);
                    pointShadowMaps.push(element.shadowMap);
                } else
                {
                    unCastShadowPointLights.push(element);
                }
            });
            renderAtomic.shaderMacro.NUM_POINTLIGHT = unCastShadowPointLights.length;
            renderAtomic.shaderMacro.NUM_POINTLIGHT_CASTSHADOW = castShadowPointLights.length;
            //
            renderAtomic.uniforms.u_pointLights = unCastShadowPointLights;
            renderAtomic.uniforms.u_castShadowPointLights = castShadowPointLights;
            renderAtomic.uniforms.u_pointShadowMatrix = pointShadowMatrix;
            renderAtomic.uniforms.u_pointShadowMaps = pointShadowMaps;

            // 设置方向光源数据
            var castShadowDirectionalLights: DirectionalLight[] = [];
            var unCastShadowDirectionalLights: DirectionalLight[] = [];
            var directionalShadowMatrix: Matrix4x4[] = [];
            var directionalShadowMaps: Texture2D[] = [];
            directionalLights.forEach(element =>
            {
                if (!element.isVisibleAndEnabled) return;
                if (element.shadowType != ShadowType.No_Shadows && this._meshRenderer.receiveShadows)
                {
                    castShadowDirectionalLights.push(element);
                    directionalShadowMatrix.push(element.shadowCamera.viewProjection);
                    directionalShadowMaps.push(element.shadowMap);
                } else
                {
                    unCastShadowDirectionalLights.push(element);
                }
            });

            renderAtomic.shaderMacro.NUM_DIRECTIONALLIGHT = unCastShadowDirectionalLights.length;
            renderAtomic.shaderMacro.NUM_DIRECTIONALLIGHT_CASTSHADOW = castShadowDirectionalLights.length;
            //
            renderAtomic.uniforms.u_directionalLights = unCastShadowDirectionalLights;
            renderAtomic.uniforms.u_castShadowDirectionalLights = castShadowDirectionalLights;
            renderAtomic.uniforms.u_directionalShadowMatrix = directionalShadowMatrix;
            renderAtomic.uniforms.u_directionalShadowMaps = directionalShadowMaps;
        }
    }
}