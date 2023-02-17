import { Matrix4x4 } from '../../../math/geom/Matrix4x4';
import { Vector3 } from '../../../math/geom/Vector3';
import { RenderAtomic } from '../../../renderer/data/RenderAtomic';
import { Texture2D } from '../../../textures/Texture2D';
import { Mesh3D } from '../../core/Mesh3D';
import { DirectionalLight3D } from '../DirectionalLight3D';
import { Light3D } from '../Light3D';
import { PointLight3D } from '../PointLight3D';
import { ShadowType } from '../shadow/ShadowType';
import { SpotLight3D } from '../SpotLight3D';

declare module '../../../renderer/data/Uniforms'
{
    interface Uniforms
    {
        /**
         * 方向光源数组
         */
        u_directionalLights: UDirectionalLight[];

        /**
         * 生成投影的方向光源
         */
        u_castShadowDirectionalLights: UCastShadowDirectionalLight[];

        /**
         * 方向光源投影矩阵列表
         */
        u_directionalShadowMatrices: Matrix4x4[];

        /**
         * 方向光源阴影图
         */
        u_directionalShadowMaps: Texture2D[];

        /**
         * 聚光灯光源
         */
        u_spotLights: USpotLight[];

        /**
         * 生成投影的聚光灯光源
         */
        u_castShadowSpotLights: UCastShadowSpotLight[]

        u_spotShadowMatrix: Matrix4x4[];

        /**
         * 点光源阴影图
         */
        u_spotShadowMaps: Texture2D[];

        /**
         * 点光源
         */
        u_pointLights: UPointLight[];

        /**
         * 生成投影的点光源
         */
        u_castShadowPointLights: UCastShadowPointLight[]

        /**
         * 点光源阴影图
         */
        u_pointShadowMaps: Texture2D[];
    }

    interface UniformTypeMap
    {
        DirectionalLightArray: UDirectionalLight[];
        UCastShadowDirectionalLightArray: UCastShadowDirectionalLight[];

        SpotLightArray: USpotLight[];
        CastShadowSpotLightArray: UCastShadowSpotLight[];

        PointLightArray: UPointLight[];
        CastShadowPointLightArray: UCastShadowPointLight[];
    }
}

/**
 * 光源拾取器。
 *
 * 用于收集照射到对象上的光源。
 */
export class LightPicker
{
    beforeRender(renderAtomic: RenderAtomic, model: Mesh3D)
    {
        let pointLights: PointLight3D[] = [];
        let directionalLights: DirectionalLight3D[] = [];
        let spotLights: SpotLight3D[] = [];

        const tempVec3 = new Vector3();

        const scene = model.node3d.scene;
        if (scene)
        {
            pointLights = scene.getComponentsInChildren('PointLight3D').filter((pl) => pl.isVisibleAndEnabled);
            directionalLights = scene.getComponentsInChildren('DirectionalLight3D').filter((dl) => dl.isVisibleAndEnabled);
            spotLights = scene.getComponentsInChildren('SpotLight3D').filter((sp) => (sp.isVisibleAndEnabled));
        }

        renderAtomic.shaderMacro.NUM_LIGHT = pointLights.length + directionalLights.length + spotLights.length;

        // 设置点光源数据
        const castShadowPointLights: UCastShadowPointLight[] = [];
        const unCastShadowPointLights: UPointLight[] = [];
        const pointShadowMaps: Texture2D[] = [];
        pointLights.forEach((element) =>
        {
            if (!element.isVisibleAndEnabled) return;

            const position = element.node3d.globalPosition;
            const color = element.color;

            if (element.shadowType !== ShadowType.No_Shadows && model.receiveShadows)
            {
                const shadowMap = Light3D.getShadowMap(element);
                const shadowMapSize = shadowMap.getSize();

                const vpWidth = shadowMapSize.x / 4;
                const vpHeight = shadowMapSize.y / 2;

                castShadowPointLights.push({
                    position: [position.x, position.y, position.z],
                    color: [color.r, color.g, color.b],
                    intensity: element.intensity,
                    range: element.range,
                    shadowType: element.shadowType,
                    shadowBias: element.shadowBias,
                    shadowRadius: element.shadowRadius,
                    shadowMapSize: [vpWidth, vpHeight],
                    shadowCameraNear: element.shadowCameraNear,
                    shadowCameraFar: element.shadowCameraFar,
                });

                pointShadowMaps.push(shadowMap);
            }
            else
            {
                unCastShadowPointLights.push({
                    position: [position.x, position.y, position.z],
                    color: [color.r, color.g, color.b],
                    intensity: element.intensity,
                    range: element.range,
                });
            }
        });
        renderAtomic.shaderMacro.NUM_POINTLIGHT = unCastShadowPointLights.length;
        renderAtomic.shaderMacro.NUM_POINTLIGHT_CASTSHADOW = castShadowPointLights.length;
        //
        renderAtomic.uniforms.u_pointLights = unCastShadowPointLights;
        renderAtomic.uniforms.u_castShadowPointLights = castShadowPointLights;
        renderAtomic.uniforms.u_pointShadowMaps = pointShadowMaps;

        // 设置聚光灯光源数据
        const castShadowSpotLights: UCastShadowSpotLight[] = [];
        const unCastShadowSpotLights: USpotLight[] = [];
        const spotShadowMaps: Texture2D[] = [];
        const spotShadowMatrix: Matrix4x4[] = [];
        spotLights.forEach((element) =>
        {
            if (!element.isVisibleAndEnabled) return;

            const direction = element.node3d.globalMatrix.getAxisZ(tempVec3).normalize();
            const position = element.node3d.globalPosition;
            const color = element.color;

            if (element.shadowType !== ShadowType.No_Shadows && model.receiveShadows)
            {
                const shadowMap = Light3D.getShadowMap(element);
                const shadowMapSize = shadowMap.getSize();

                castShadowSpotLights.push({
                    position: [position.x, position.y, position.z],
                    color: [color.r, color.g, color.b],
                    intensity: element.intensity,
                    range: element.range,
                    direction: [direction.x, direction.y, direction.z],
                    coneCos: element.coneCos,
                    penumbraCos: element.penumbraCos,
                    shadowType: element.shadowType,
                    shadowBias: element.shadowBias,
                    shadowRadius: element.shadowRadius,
                    shadowMapSize: [shadowMapSize.x, shadowMapSize.y],
                    shadowCameraNear: element.shadowCameraNear,
                    shadowCameraFar: element.shadowCameraFar,
                });
                spotShadowMatrix.push(element._shadowCameraViewProjection);
                spotShadowMaps.push(shadowMap);
            }
            else
            {
                unCastShadowSpotLights.push({
                    position: [position.x, position.y, position.z],
                    color: [color.r, color.g, color.b],
                    intensity: element.intensity,
                    range: element.range,
                    direction: [direction.x, direction.y, direction.z],
                    coneCos: element.coneCos,
                    penumbraCos: element.penumbraCos,
                });
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
        const castShadowDirectionalLights: UCastShadowDirectionalLight[] = [];
        const unCastShadowDirectionalLights: UDirectionalLight[] = [];
        const directionalShadowMatrix: Matrix4x4[] = [];
        const directionalShadowMaps: Texture2D[] = [];
        directionalLights.forEach((element) =>
        {
            if (!element.isVisibleAndEnabled) return;

            const direction = element.node3d.globalMatrix.getAxisZ(tempVec3).normalize();
            const color = element.color;

            if (element.shadowType !== ShadowType.No_Shadows && model.receiveShadows)
            {
                const shadowCameraPosition = element.shadowCameraPosition;
                const shadowMap = Light3D.getShadowMap(element);
                const shadowMapSize = shadowMap.getSize();
                //
                castShadowDirectionalLights.push({
                    direction: [direction.x, direction.y, direction.z],
                    color: [color.r, color.g, color.b],
                    intensity: element.intensity,
                    shadowType: element.shadowType,
                    shadowBias: element.shadowBias,
                    shadowRadius: element.shadowRadius,
                    shadowMapSize: [shadowMapSize.x, shadowMapSize.y],
                    position: [shadowCameraPosition.x, shadowCameraPosition.y, shadowCameraPosition.z],
                    shadowCameraNear: element.shadowCameraNear,
                    shadowCameraFar: element.shadowCameraFar,
                });
                directionalShadowMatrix.push(element._shadowCameraViewProjection);
                directionalShadowMaps.push(shadowMap);
            }
            else
            {
                unCastShadowDirectionalLights.push({
                    direction: [direction.x, direction.y, direction.z],
                    color: [color.r, color.g, color.b],
                    intensity: element.intensity,
                });
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

// 方向光源
interface UDirectionalLight
{
    // 方向
    direction: [number, number, number];
    // 颜色
    color: [number, number, number];
    // 强度
    intensity: number;
}

interface UCastShadowDirectionalLight
{
    // 方向
    direction: [number, number, number];
    // 颜色
    color: [number, number, number];
    // 强度
    intensity: number;
    // 阴影类型
    shadowType: number;
    // 阴影偏差，用来解决判断是否为阴影时精度问题
    shadowBias: number;
    // 阴影半径，边缘宽度
    shadowRadius: number;
    // 阴影图尺寸
    shadowMapSize: [number, number];
    // 光照相机位置
    position: [number, number, number];
    shadowCameraNear: number;
    shadowCameraFar: number;
}

// 聚光灯
interface USpotLight
{
    // 位置
    position: [number, number, number];
    // 颜色
    color: [number, number, number];
    // 强度
    intensity: number;
    // 范围
    range: number;
    // 方向
    direction: [number, number, number];
    // 椎体cos值
    coneCos: number;
    // 半影cos
    penumbraCos: number;
}

// 投影的聚光灯
interface UCastShadowSpotLight extends USpotLight
{
    // 阴影类型
    shadowType: number;
    // 阴影偏差，用来解决判断是否为阴影时精度问题
    shadowBias: number;
    // 阴影半径，边缘宽度
    shadowRadius: number;
    // 阴影图尺寸
    shadowMapSize: [number, number];
    shadowCameraNear: number;
    shadowCameraFar: number;
}

// 点光源
interface UPointLight
{
    // 位置
    position: [number, number, number];
    // 颜色
    color: [number, number, number];
    // 强度
    intensity: number;
    // 范围
    range: number;
}

// 投影的点光源
interface UCastShadowPointLight
{
    // 位置
    position: [number, number, number];
    // 颜色
    color: [number, number, number];
    // 强度
    intensity: number;
    // 范围
    range: number;
    // 阴影类型
    shadowType: number;
    // 阴影偏差，用来解决判断是否为阴影时精度问题
    shadowBias: number;
    // 阴影半径，边缘宽度
    shadowRadius: number;
    // 阴影图尺寸
    shadowMapSize: [number, number];
    shadowCameraNear: number;
    shadowCameraFar: number;
}
