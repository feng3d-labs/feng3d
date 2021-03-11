namespace feng3d
{
    export class LightPicker
    {
        private _model: Renderable

        constructor(model: Renderable)
        {
            this._model = model;
        }

        beforeRender(renderAtomic: RenderAtomic)
        {
            var pointLights: PointLight[] = [];
            var directionalLights: DirectionalLight[] = [];
            var spotLights: SpotLight[] = [];

            var scene = this._model.node3d.scene;
            if (scene)
            {
                pointLights = scene.activePointLights;
                directionalLights = scene.activeDirectionalLights;
                spotLights = scene.activeSpotLights;
            }

            renderAtomic.shaderMacro.NUM_LIGHT = pointLights.length + directionalLights.length + spotLights.length;

            //设置点光源数据
            var castShadowPointLights: PointLight[] = [];
            var unCastShadowPointLights: PointLight[] = [];
            var pointShadowMaps: Texture2D[] = [];
            pointLights.forEach(element =>
            {
                if (!element.isVisibleAndEnabled) return;
                if (element.shadowType != ShadowType.No_Shadows && this._model.receiveShadows)
                {
                    castShadowPointLights.push(element);
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
            renderAtomic.uniforms.u_pointShadowMaps = pointShadowMaps;

            //设置聚光灯光源数据
            var castShadowSpotLights: SpotLight[] = [];
            var unCastShadowSpotLights: SpotLight[] = [];
            var spotShadowMaps: Texture2D[] = [];
            var spotShadowMatrix: Matrix4x4[] = [];
            spotLights.forEach(element =>
            {
                if (!element.isVisibleAndEnabled) return;
                if (element.shadowType != ShadowType.No_Shadows && this._model.receiveShadows)
                {
                    castShadowSpotLights.push(element);
                    spotShadowMatrix.push(element.shadowCamera.viewProjection);
                    spotShadowMaps.push(element.shadowMap);
                } else
                {
                    unCastShadowSpotLights.push(element);
                }
            });
            renderAtomic.shaderMacro.NUM_SPOT_LIGHTS = unCastShadowSpotLights.length;
            renderAtomic.shaderMacro.NUM_SPOT_LIGHTS_CASTSHADOW = castShadowSpotLights.length;
            //
            renderAtomic.uniforms.u_spotLights = unCastShadowSpotLights;
            renderAtomic.uniforms.u_castShadowSpotLights = castShadowSpotLights;
            renderAtomic.uniforms.u_spotShadowMatrix = spotShadowMatrix;
            renderAtomic.uniforms.u_spotShadowMaps = spotShadowMaps;

            // 设置方向光源数据
            var castShadowDirectionalLights: DirectionalLight[] = [];
            var unCastShadowDirectionalLights: DirectionalLight[] = [];
            var directionalShadowMatrix: Matrix4x4[] = [];
            var directionalShadowMaps: Texture2D[] = [];
            directionalLights.forEach(element =>
            {
                if (!element.isVisibleAndEnabled) return;
                if (element.shadowType != ShadowType.No_Shadows && this._model.receiveShadows)
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
            renderAtomic.uniforms.u_directionalShadowMatrixs = directionalShadowMatrix;
            renderAtomic.uniforms.u_directionalShadowMaps = directionalShadowMaps;
        }
    }
}