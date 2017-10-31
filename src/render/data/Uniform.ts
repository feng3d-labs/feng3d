module feng3d
{
    export type Lazy<T> = T | (() => T);

    export var lazy = { getvalue: getvalue };

    function getvalue<T>(lazyItem: Lazy<T>)
    {
        if (typeof lazyItem == "function")
            return lazyItem();
        return lazyItem;
    }

    export interface Uniforms
    {
        /**
         * 模型矩阵
         */
        u_modelMatrix: Lazy<Matrix3D>;
        /**
         * （view矩阵）摄像机逆矩阵
         */
        u_viewMatrix: Lazy<Matrix3D>;
        /**
         * 投影矩阵
         */
        u_projectionMatrix: Lazy<Matrix3D>;
        /**
         * 摄像机矩阵
         */
        u_cameraMatrix: Lazy<Matrix3D>;
        /**
         * 模型-摄像机 矩阵
         */
        u_mvMatrix: Lazy<Matrix3D>;
        /**
         * 模型逆转置矩阵,用于计算全局法线
         * 参考：http://blog.csdn.net/christina123y/article/details/5963679
         */
        u_ITModelMatrix: Lazy<Matrix3D>;
        /**
         * 模型-摄像机 逆转置矩阵，用于计算摄像机空间法线
         */
        u_ITMVMatrix: Lazy<Matrix3D>;
        /**
         * 世界投影矩阵
         */
        u_viewProjection: Lazy<Matrix3D>;

        u_diffuseInput: Lazy<Color>;
        /**
         * 透明阈值，用于透明检测
         */
        u_alphaThreshold: Lazy<number>;
        /**
         * 漫反射贴图
         */
        s_texture: Lazy<TextureInfo>;
        /**
         * 漫反射贴图
         */
        s_diffuse: Lazy<Texture2D>;
        /**
         * 环境贴图
         */
        s_ambient: Lazy<Texture2D>;
        /**
         * 法线贴图
         */
        s_normal: Lazy<Texture2D>;
        /**
         * 镜面反射光泽图
         */
        s_specular: Lazy<Texture2D>;
        /**
         * 天空盒纹理
         */
        s_skyboxTexture: Lazy<TextureCube>;
        /**
         * 天空盒尺寸
         */
        u_skyBoxSize: Lazy<number>;

        /**
         * 地形混合贴图
         */
        s_blendTexture: Lazy<Texture2D>;

        /**
         * 地形块贴图1
         */
        s_splatTexture1: Lazy<Texture2D>;
        /**
         * 地形块贴图2
         */
        s_splatTexture2: Lazy<Texture2D>;
        /**
         * 地形块贴图3
         */
        s_splatTexture3: Lazy<Texture2D>;
        /**
         * 地形块混合贴图
         */
        s_splatMergeTexture: Lazy<Texture2D>;
        /**
         * 地形块重复次数
         */
        u_splatRepeats: Lazy<Vector3D>;
        /**
         * 地形混合贴图尺寸
         */
        u_splatMergeTextureSize: Lazy<Point>;
        /**
         * 图片尺寸
         */
        u_imageSize: Lazy<Point>;
        /**
         * 地形块尺寸
         */
        u_tileSize: Lazy<Point>;
        /**
         * 地形块偏移
         */
        u_tileOffset: Lazy<Vector3D[]>;
        /**
         * 最大lod
         */
        u_maxLod: Lazy<number>;
        /**
         * uv与坐标比
         */
        u_uvPositionScale: Lazy<number>;
        /**
         * lod0时在贴图中的uv缩放偏移向量
         */
        u_lod0vec: Lazy<Vector3D>;
        /******************************************************/
        //                  点光源
        /******************************************************/
        /**
         * 点光源位置数组
         */
        u_pointLightPositions: Lazy<Vector3D[]>;
        /**
         * 点光源颜色数组
         */
        u_pointLightColors: Lazy<Color[]>;
        /**
         * 点光源光照强度数组
         */
        u_pointLightIntensitys: Lazy<number[]>;
        /**
         * 点光源光照范围数组
         */
        u_pointLightRanges: Lazy<number[]>;
        /******************************************************/
        //                  方向光源
        /******************************************************/
        /**
         * 方向光源方向数组
         */
        u_directionalLightDirections: Lazy<Vector3D[]>;
        /**
         * 方向光源颜色数组
         */
        u_directionalLightColors: Lazy<Color[]>;
        /**
         * 方向光源光照强度数组
         */
        u_directionalLightIntensitys: Lazy<number[]>;

        /**
         * 场景环境光
         */
        u_sceneAmbientColor: Lazy<Color>;
        /**
         * 基本颜色
         */
        u_diffuse: Lazy<Color>;
        /**
         * 镜面反射颜色
         */
        u_specular: Lazy<Color>;
        /**
         * 环境颜色
         */
        u_ambient: Lazy<Color>;
        /**
         * 高光系数
         */
        u_glossiness: Lazy<number>;

        /**
         * 反射率
         */
        u_reflectance: Lazy<number>;

        /**
         * 粗糙度
         */
        u_roughness: Lazy<number>;

        /**
         * 金属度
         */
        u_metalic: Lazy<number>;

        /**
         * 粒子时间
         */
        u_particleTime: Lazy<number>;

        /**
         * 点大小
         */
        u_PointSize: Lazy<number>;

        /**
         * 骨骼全局矩阵
         */
        u_skeletonGlobalMatriices: Lazy<Matrix3D[]>;

        /**
         * 3D对象编号
         */
        u_objectID: Lazy<number>;

        /**
         * 雾颜色
         */
        u_fogColor: Lazy<Color>;
        /**
         * 雾最近距离
         */
        u_fogMinDistance: Lazy<number>;
        /**
         * 雾最远距离
         */
        u_fogMaxDistance: Lazy<number>;
        /**
         * 雾浓度
         */
        u_fogDensity: Lazy<number>;
        /**
         * 雾模式
         */
        u_fogMode: Lazy<number>;

        /**
         * 环境反射纹理
         */
        s_envMap: Lazy<TextureCube>;
		/**
		 * 反射率
		 */
        u_reflectivity: Lazy<number>;
        /**
         * 单位深度映射到屏幕像素值
         */
        u_scaleByDepth: Lazy<number>;

        /**
         * 线框颜色
         */
        u_wireframeColor: Lazy<Color>;
    }
}