namespace feng3d
{
    export interface UniformRenderData
    {
        /**
         * 模型矩阵
         */
        u_modelMatrix: Matrix3D | (() => Matrix3D);
        /**
         * 世界投影矩阵
         */
        u_viewProjection: Matrix3D | (() => Matrix3D);
        /**
         * 摄像机矩阵
         */
        u_cameraMatrix: Matrix3D | (() => Matrix3D);

        u_diffuseInput: Vector3D | (() => Vector3D);
        /**
         * 透明阈值，用于透明检测
         */
        u_alphaThreshold: number | (() => number);
        /**
         * 漫反射贴图
         */
        s_texture: Texture2D | (() => Texture2D);
        /**
         * 漫反射贴图
         */
        s_diffuse: Texture2D | (() => Texture2D);
        /**
         * 环境贴图
         */
        s_ambient: Texture2D | (() => Texture2D);
        /**
         * 法线贴图
         */
        s_normal: Texture2D | (() => Texture2D);
        /**
         * 镜面反射光泽图
         */
        s_specular: Texture2D | (() => Texture2D);
        /**
         * 天空盒纹理
         */
        s_skyboxTexture: TextureCube | (() => TextureCube);
        /**
         * 天空盒尺寸
         */
        u_skyBoxSize: number | (() => number);

        /**
         * 地形混合贴图
         */
        s_blendTexture: Texture2D | (() => Texture2D);

        /**
         * 地形块贴图1
         */
        s_splatTexture1: Texture2D | (() => Texture2D);
        /**
         * 地形块贴图2
         */
        s_splatTexture2: Texture2D | (() => Texture2D);
        /**
         * 地形块贴图3
         */
        s_splatTexture3: Texture2D | (() => Texture2D);
        /**
         * 地形块混合贴图
         */
        s_splatMergeTexture: Texture2D | (() => Texture2D);
        /**
         * 地形块重复次数
         */
        u_splatRepeats: Vector3D | (() => Vector3D);
        /**
         * 地形混合贴图尺寸
         */
        u_splatMergeTextureSize: Point | (() => Point);
        /**
         * 图片尺寸
         */
        u_imageSize: Point | (() => Point);
        /**
         * 地形块尺寸
         */
        u_tileSize: Point | (() => Point);
        /**
         * 地形块偏移
         */
        u_tileOffset: Vector3D[] | (() => Vector3D[]);
        /**
         * 最大lod
         */
        u_maxLod: number | (() => number);
        /**
         * uv与坐标比
         */
        u_uvPositionScale: number | (() => number);
        /**
         * lod0时在贴图中的uv缩放偏移向量
         */
        u_lod0vec: Vector3D | (() => Vector3D);
        /******************************************************/
        //                  点光源
        /******************************************************/
        /**
         * 点光源位置数组
         */
        u_pointLightPositions: Vector3D[] | (() => Vector3D[]);
        /**
         * 点光源颜色数组
         */
        u_pointLightColors: Vector3D[] | (() => Vector3D[]);
        /**
         * 点光源光照强度数组
         */
        u_pointLightIntensitys: number[] | (() => number[]);
        /**
         * 点光源光照范围数组
         */
        u_pointLightRanges: number[] | (() => number[]);
        /******************************************************/
        //                  方向光源
        /******************************************************/
        /**
         * 方向光源方向数组
         */
        u_directionalLightDirections: Vector3D[] | (() => Vector3D[]);
        /**
         * 方向光源颜色数组
         */
        u_directionalLightColors: Vector3D[] | (() => Vector3D[]);
        /**
         * 方向光源光照强度数组
         */
        u_directionalLightIntensitys: number[] | (() => number[]);

        /**
         * 场景环境光
         */
        u_sceneAmbientColor: Color | (() => Color);
        /**
         * 基本颜色
         */
        u_diffuse: Color | (() => Color);
        /**
         * 镜面反射颜色
         */
        u_specular: Color | (() => Color);
        /**
         * 环境颜色
         */
        u_ambient: Color | (() => Color);
        /**
         * 高光系数
         */
        u_glossiness: number | (() => number);

        /**
         * 反射率
         */
        u_reflectance: number | (() => number);

        /**
         * 粗糙度
         */
        u_roughness: number | (() => number);

        /**
         * 金属度
         */
        u_metalic: number | (() => number);

        /**
         * 粒子时间
         */
        u_particleTime: number | (() => number);

        /**
         * 点大小
         */
        u_PointSize: number | (() => number);

        /**
         * 骨骼全局矩阵
         */
        u_skeletonGlobalMatriices: Matrix3D[] | (() => Matrix3D[]);

        /**
         * 3D对象编号
         */
        u_objectID: number | (() => number);

        /**
         * 雾颜色
         */
        u_fogColor: Color | (() => Color);
        /**
         * 雾最近距离
         */
        u_fogMinDistance: number | (() => number);
        /**
         * 雾最远距离
         */
        u_fogMaxDistance: number | (() => number);
        /**
         * 雾浓度
         */
        u_fogDensity: number | (() => number);
        /**
         * 雾模式
         */
        u_fogMode: number | (() => number);

        /**
         * 环境反射纹理
         */
        s_envMap: TextureCube | (() => TextureCube);
		/**
		 * 反射率
		 */
        u_reflectivity: number | (() => number);
        /**
         * 单位深度映射到屏幕像素值
         */
        u_scaleByDepth: number | (() => number);
    }
}