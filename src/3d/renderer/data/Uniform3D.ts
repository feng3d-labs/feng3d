import { Color3 } from '../../../math/Color3';
import { Color4 } from '../../../math/Color4';
import { Matrix3x3 } from '../../../math/geom/Matrix3x3';
import { Matrix4x4 } from '../../../math/geom/Matrix4x4';
import { Vector3 } from '../../../math/geom/Vector3';
import { TextureCube } from '../../../textures/TextureCube';
import { LightType } from '../../light/LightType';

declare module '../../../renderer/data/Uniforms'
{
    interface Uniforms
    {
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
         * 骨骼全局矩阵
         */
        u_skeletonGlobalMatrices: Matrix4x4[];

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
        s_envMap: TextureCube;
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
