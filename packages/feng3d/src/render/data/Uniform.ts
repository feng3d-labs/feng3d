import { Color3, Matrix3x3, Matrix4x4, Vector2, Vector3, Vector4 } from '@feng3d/math';
import type { BufferBinding, Texture } from '@feng3d/webgpu';
import type { Color4 } from '../../core/Color4';
import { DirectionalLight } from '../../light/DirectionalLight';
import { LightType } from '../../light/LightType';
import { PointLight } from '../../light/PointLight';
import { SpotLight } from '../../light/SpotLight';

export { };

declare global
{
    export interface GlobalUniforms
    {
        /**
         * 场景环境光
         */
        u_sceneAmbientColor: Color4;
        /**
         * 渲染目标（画布）像素尺寸（width, height），供 billboard/屏幕空间展开类着色器使用
         * （如 PointMaterial 按像素尺寸展开方形点）。
         */
        u_Viewport: Vector2;
    }

    export interface SkinnedUniforms
    {
        /**
         * 骨骼全局矩阵
         */
        u_skeletonGlobalMatriices?: Matrix4x4[];
    }

    export interface MixinsUniforms
    {


        /**
         * 模型-摄像机 矩阵
         */
        u_mvMatrix: Matrix4x4;
        /**
         * 模型-摄像机 逆转置矩阵，用于计算摄像机空间法线
         */
        u_ITMVMatrix: Matrix4x4;

        u_diffuseInput: Color4;
        /**
         * 透明阈值，用于透明检测
         */
        u_alphaThreshold: number;
        /**
         * 漫反射贴图
         */
        s_texture: Texture;
        /**
         * 漫反射贴图
         */
        s_diffuse: Texture;
        /**
         * 环境贴图
         */
        s_ambient: Texture;
        /**
         * 法线贴图
         */
        s_normal: Texture;
        /**
         * 镜面反射光泽图
         */
        s_specular: Texture;
        /**
         * 天空盒纹理
         */
        s_skyboxTexture: Texture;

        /**
         * 地形混合贴图
         */
        s_blendTexture: Texture;

        /**
         * 地形块贴图1
         */
        s_splatTexture1: Texture;
        /**
         * 地形块贴图2
         */
        s_splatTexture2: Texture;
        /**
         * 地形块贴图3
         */
        s_splatTexture3: Texture;
        /**
         * 地形块混合贴图
         */
        s_splatMergeTexture: Texture;
        /**
         * 地形块重复次数
         */
        u_splatRepeats: Vector4;
        /**
         * 地形混合贴图尺寸
         */
        u_splatMergeTextureSize: Vector2;
        /**
         * 图片尺寸
         */
        u_imageSize: Vector2;
        /**
         * 地形块尺寸
         */
        u_tileSize: Vector2;
        /**
         * 地形块偏移
         */
        u_tileOffset: Vector4[];
        /**
         * 最大lod
         */
        u_maxLod: number;
        /**
         * uv与坐标比
         */
        u_uvPositionScale: number;
        /**
         * lod0时在贴图中的uv缩放偏移向量
         */
        u_lod0vec: Vector4;
        /**
         * 点光源
         */
        u_pointLights: PointLight[];

        /**
         * 生成投影的点光源
         */
        u_castShadowPointLights: PointLight[]

        /**
         * 点光源阴影图
         */
        u_pointShadowMaps: Texture[];

        /**
         * 聚光灯光源
         */
        u_spotLights: SpotLight[];

        /**
         * 生成投影的聚光灯光源
         */
        u_castShadowSpotLights: SpotLight[]

        u_spotShadowMatrix: Matrix4x4[];

        /**
         * 点光源阴影图
         */
        u_spotShadowMaps: Texture[];

        /**
         * 方向光源数组
         */
        u_directionalLights: DirectionalLight[]

        /**
         * 生成投影的方向光源
         */
        u_castShadowDirectionalLights: DirectionalLight[]

        /**
         * 方向光源投影矩阵列表
         */
        u_directionalShadowMatrixs: Matrix4x4[];
        /**
         * 方向光源阴影图
         */
        u_directionalShadowMaps: Texture[];

        /**
         * 基本颜色
         */
        u_diffuse: Color4;
        /**
         * 镜面反射颜色
         */
        u_specular: Color3;
        /**
         * 环境颜色
         */
        u_ambient: Color4;
        /**
         * 高光系数
         */
        u_glossiness: number;

        /**
         * 反射率
         */
        u_reflectance: number;

        /**
         * 粗糙度
         */
        u_roughness: number;

        /**
         * 金属度
         */
        u_metalic: number;

        /**
         * 粒子公告牌矩阵
         */
        u_particle_billboardMatrix: Matrix3x3;

        /**
         * 点大小
         */
        u_PointSize: number;

        /**
         * 3D对象编号
         */
        u_objectID: number;

        /**
         * 雾颜色
         */
        u_fogColor: Color3;
        /**
         * 雾最近距离
         */
        u_fogMinDistance: number;
        /**
         * 雾最远距离
         */
        u_fogMaxDistance: number;
        /**
         * 雾浓度
         */
        u_fogDensity: number;
        /**
         * 雾模式
         */
        u_fogMode: number;

        /**
         * 环境反射纹理
         */
        s_envMap: Texture;
        /**
         * 反射率
         */
        u_reflectivity: number;

        /**
         * 线框颜色
         */
        u_wireframeColor: Color4;

        u_lightType: LightType;
        u_lightPosition: Vector3;
        u_shadowCameraNear: number;
        u_shadowCameraFar: number;
    }
}

// ---- BindingResources 类型扩展（全局 uniforms） ----

declare module '@feng3d/webgpu'
{
    interface BindingResources
    {
        globalUniforms?: BufferBinding<GlobalUniforms>;
        skinned?: BufferBinding<SkinnedUniforms>;
    }
}
