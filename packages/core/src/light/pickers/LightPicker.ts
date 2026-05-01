import { Matrix4x4 } from '@feng3d/math';
import { RenderObject } from '@feng3d/webgpu';
import { Renderable } from '../../core/Renderable';
import { Texture2D } from '../../textures/Texture2D';
import { DirectionalLight } from '../DirectionalLight';
import { PointLight } from '../PointLight';
import { ShadowType } from '../shadow/ShadowType';
import { SpotLight } from '../SpotLight';

export class LightPicker
{
    private _model: Renderable;

    constructor(model: Renderable)
    {
        this._model = model;
    }

    beforeRender(renderObject: RenderObject)
    {
        let pointLights: PointLight[] = [];
        let directionalLights: DirectionalLight[] = [];
        let spotLights: SpotLight[] = [];

        const scene = this._model.gameObject.scene;
        if (scene)
        {
            pointLights = scene.activePointLights;
            directionalLights = scene.activeDirectionalLights;
            spotLights = scene.activeSpotLights;
        }

        renderObject.shaderMacro.NUM_LIGHT = pointLights.length + directionalLights.length + spotLights.length;

        // 设置点光源数据
        const castShadowPointLights: PointLight[] = [];
        const unCastShadowPointLights: PointLight[] = [];
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
        renderObject.shaderMacro.NUM_POINTLIGHT = unCastShadowPointLights.length;
        renderObject.shaderMacro.NUM_POINTLIGHT_CASTSHADOW = castShadowPointLights.length;
        //
        renderObject.uniforms.u_pointLights = unCastShadowPointLights;
        renderObject.uniforms.u_castShadowPointLights = castShadowPointLights;
        renderObject.uniforms.u_pointShadowMaps = pointShadowMaps;

        // 设置聚光灯光源数据
        const castShadowSpotLights: SpotLight[] = [];
        const unCastShadowSpotLights: SpotLight[] = [];
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
        renderObject.shaderMacro.NUM_SPOT_LIGHTS = unCastShadowSpotLights.length;
        renderObject.shaderMacro.NUM_SPOT_LIGHTS_CASTSHADOW = castShadowSpotLights.length;
        //
        renderObject.uniforms.u_spotLights = unCastShadowSpotLights;
        renderObject.uniforms.u_castShadowSpotLights = castShadowSpotLights;
        renderObject.uniforms.u_spotShadowMatrix = spotShadowMatrix;
        renderObject.uniforms.u_spotShadowMaps = spotShadowMaps;

        // 设置方向光源数据
        const castShadowDirectionalLights: DirectionalLight[] = [];
        const unCastShadowDirectionalLights: DirectionalLight[] = [];
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

        renderObject.shaderMacro.NUM_DIRECTIONALLIGHT = unCastShadowDirectionalLights.length;
        renderObject.shaderMacro.NUM_DIRECTIONALLIGHT_CASTSHADOW = castShadowDirectionalLights.length;
        //
        renderObject.uniforms.u_directionalLights = unCastShadowDirectionalLights;
        renderObject.uniforms.u_castShadowDirectionalLights = castShadowDirectionalLights;
        renderObject.uniforms.u_directionalShadowMatrixs = directionalShadowMatrix;
        renderObject.uniforms.u_directionalShadowMaps = directionalShadowMaps;
    }
}
