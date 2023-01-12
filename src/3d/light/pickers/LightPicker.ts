import { Mesh3D } from '../../../3d/Mesh3D';
import { Texture2D } from '../../../textures/Texture2D';
import { Matrix4x4 } from '../../../math/geom/Matrix4x4';
import { RenderAtomic } from '../../../renderer/data/RenderAtomic';
import { DirectionalLight3D } from '../DirectionalLight3D';
import { PointLight3D } from '../PointLight3D';
import { ShadowType } from '../shadow/ShadowType';
import { SpotLight3D } from '../SpotLight3D';

export class LightPicker
{
    private _model: Mesh3D;

    constructor(model: Mesh3D)
    {
        this._model = model;
    }

    beforeRender(renderAtomic: RenderAtomic)
    {
        let pointLights: PointLight3D[] = [];
        let directionalLights: DirectionalLight3D[] = [];
        let spotLights: SpotLight3D[] = [];

        const scene = this._model.node3d.scene;
        if (scene)
        {
            pointLights = scene.getComponentsInChildren('PointLight3D').filter((pl) => pl.isVisibleAndEnabled);
            directionalLights = scene.getComponentsInChildren('DirectionalLight').filter((dl) => dl.isVisibleAndEnabled);
            spotLights = scene.getComponentsInChildren('SpotLight3D').filter((sp) => (sp.isVisibleAndEnabled));
        }

        renderAtomic.shaderMacro.NUM_LIGHT = pointLights.length + directionalLights.length + spotLights.length;

        // 设置点光源数据
        const castShadowPointLights: PointLight3D[] = [];
        const unCastShadowPointLights: PointLight3D[] = [];
        const pointShadowMaps: Texture2D[] = [];
        pointLights.forEach((element) =>
        {
            if (!element.isVisibleAndEnabled) return;
            if (element.shadowType !== ShadowType.No_Shadows && this._model.receiveShadows)
            {
                castShadowPointLights.push(element);
                pointShadowMaps.push(element.shadowMap);
            }
            else
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

        // 设置聚光灯光源数据
        const castShadowSpotLights: SpotLight3D[] = [];
        const unCastShadowSpotLights: SpotLight3D[] = [];
        const spotShadowMaps: Texture2D[] = [];
        const spotShadowMatrix: Matrix4x4[] = [];
        spotLights.forEach((element) =>
        {
            if (!element.isVisibleAndEnabled) return;
            if (element.shadowType !== ShadowType.No_Shadows && this._model.receiveShadows)
            {
                castShadowSpotLights.push(element);
                spotShadowMatrix.push(element.shadowCamera.viewProjection);
                spotShadowMaps.push(element.shadowMap);
            }
            else
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
        const castShadowDirectionalLights: DirectionalLight3D[] = [];
        const unCastShadowDirectionalLights: DirectionalLight3D[] = [];
        const directionalShadowMatrix: Matrix4x4[] = [];
        const directionalShadowMaps: Texture2D[] = [];
        directionalLights.forEach((element) =>
        {
            if (!element.isVisibleAndEnabled) return;
            if (element.shadowType !== ShadowType.No_Shadows && this._model.receiveShadows)
            {
                castShadowDirectionalLights.push(element);
                directionalShadowMatrix.push(element.shadowCamera.viewProjection);
                directionalShadowMaps.push(element.shadowMap);
            }
            else
            {
                unCastShadowDirectionalLights.push(element);
            }
        });

        renderAtomic.shaderMacro.NUM_DIRECTIONALLIGHT = unCastShadowDirectionalLights.length;
        renderAtomic.shaderMacro.NUM_DIRECTIONALLIGHT_CASTSHADOW = castShadowDirectionalLights.length;
        //
        renderAtomic.uniforms.u_directionalLights = unCastShadowDirectionalLights;
        renderAtomic.uniforms.u_castShadowDirectionalLights = castShadowDirectionalLights;
        renderAtomic.uniforms.u_directionalShadowMatrices = directionalShadowMatrix;
        renderAtomic.uniforms.u_directionalShadowMaps = directionalShadowMaps;
    }
}
