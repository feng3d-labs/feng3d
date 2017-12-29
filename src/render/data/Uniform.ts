namespace feng3d
{
    export type Lazy<T> = T | (() => T);

    export var lazy = { getvalue: getvalue };

    // export class Lazyy<T>
    // {
    //     lazy: T | (() => T);

    //     get value()
    //     {
    //         if (typeof this.lazy == "function")
    //             return this.lazy();
    //         return this.lazy;
    //     }

    //     constructor(lazy: T | (() => T))
    //     {
    //         this.lazy = lazy;
    //     }
    // }

    function getvalue<T>(lazyItem: Lazy<T>)
    {
        if (typeof lazyItem == "function")
            return lazyItem();
        return lazyItem;
    }

    export type LazyObject<T> = {
        [P in keyof T]: Lazy<T[P]>;
    };

    export type LazyUniforms = LazyObject<Uniforms>;

    export interface Uniforms
    {
        /**
         * 模型矩阵
         */
        u_modelMatrix: Matrix3D;
        /**
         * （view矩阵）摄像机逆矩阵
         */
        u_viewMatrix: Matrix3D;
        /**
         * 投影矩阵
         */
        u_projectionMatrix: Matrix3D;
        /**
         * 摄像机矩阵
         */
        u_cameraMatrix: Matrix3D;
        /**
         * 模型-摄像机 矩阵
         */
        u_mvMatrix: Matrix3D;
        /**
         * 模型逆转置矩阵,用于计算全局法线
         * 参考：http://blog.csdn.net/christina123y/article/details/5963679
         */
        u_ITModelMatrix: Matrix3D;
        /**
         * 模型-摄像机 逆转置矩阵，用于计算摄像机空间法线
         */
        u_ITMVMatrix: Matrix3D;
        /**
         * 世界投影矩阵
         */
        u_viewProjection: Matrix3D;

        u_diffuseInput: Color;
        /**
         * 透明阈值，用于透明检测
         */
        u_alphaThreshold: number;
        /**
         * 漫反射贴图
         */
        s_texture: TextureInfo;
        /**
         * 漫反射贴图
         */
        s_diffuse: Texture2D;
        /**
         * 环境贴图
         */
        s_ambient: Texture2D;
        /**
         * 法线贴图
         */
        s_normal: Texture2D;
        /**
         * 镜面反射光泽图
         */
        s_specular: Texture2D;
        /**
         * 天空盒纹理
         */
        s_skyboxTexture: TextureCube;
        /**
         * 天空盒尺寸
         */
        u_skyBoxSize: number;

        /**
         * 地形混合贴图
         */
        s_blendTexture: Texture2D;

        /**
         * 地形块贴图1
         */
        s_splatTexture1: Texture2D;
        /**
         * 地形块贴图2
         */
        s_splatTexture2: Texture2D;
        /**
         * 地形块贴图3
         */
        s_splatTexture3: Texture2D;
        /**
         * 地形块混合贴图
         */
        s_splatMergeTexture: Texture2D;
        /**
         * 地形块重复次数
         */
        u_splatRepeats: Vector3D;
        /**
         * 地形混合贴图尺寸
         */
        u_splatMergeTextureSize: Point;
        /**
         * 图片尺寸
         */
        u_imageSize: Point;
        /**
         * 地形块尺寸
         */
        u_tileSize: Point;
        /**
         * 地形块偏移
         */
        u_tileOffset: Vector3D[];
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
        u_lod0vec: Vector3D;
        /******************************************************/
        //                  点光源
        /******************************************************/
        /**
         * 点光源位置数组
         */
        u_pointLightPositions: Vector3D[];
        /**
         * 点光源颜色数组
         */
        u_pointLightColors: Color[];
        /**
         * 点光源光照强度数组
         */
        u_pointLightIntensitys: number[];
        /**
         * 点光源光照范围数组
         */
        u_pointLightRanges: number[];
        /******************************************************/
        //                  方向光源
        /******************************************************/
        /**
         * 方向光源方向数组
         */
        u_directionalLightDirections: Vector3D[];
        /**
         * 方向光源颜色数组
         */
        u_directionalLightColors: Color[];
        /**
         * 方向光源光照强度数组
         */
        u_directionalLightIntensitys: number[];

        /**
         * 场景环境光
         */
        u_sceneAmbientColor: Color;
        /**
         * 基本颜色
         */
        u_diffuse: Color;
        /**
         * 镜面反射颜色
         */
        u_specular: Color;
        /**
         * 环境颜色
         */
        u_ambient: Color;
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
         * 粒子时间
         */
        u_particleTime: number;

        /**
         * 点大小
         */
        u_PointSize: number;

        /**
         * 骨骼全局矩阵
         */
        u_skeletonGlobalMatriices: Matrix3D[];

        /**
         * 3D对象编号
         */
        u_objectID: number;

        /**
         * 雾颜色
         */
        u_fogColor: Color;
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
         * 单位深度映射到屏幕像素值
         */
        u_scaleByDepth: number;

        /**
         * 线框颜色
         */
        u_wireframeColor: Color;
    }
}