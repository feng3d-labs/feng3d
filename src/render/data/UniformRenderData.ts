module feng3d
{
    /**
     * Uniform渲染数据
     */
    export class UniformRenderData
    {
        /**
         * 模型矩阵
         */
        u_modelMatrix: Matrix3D;
        /**
         * 世界投影矩阵
         */
        u_viewProjection: Matrix3D;
        /**
         * 摄像机矩阵
         */
        u_cameraMatrix: Matrix3D;

        u_diffuseInput: Vector3D;
        /**
         * 透明阈值，用于透明检测
         */
        u_alphaThreshold: number;
        /**
         * 漫反射贴图
         */
        s_texture: Texture2D;
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
        u_pointLightColors: Vector3D[];
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
        u_directionalLightColors: Vector3D[];
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
         * 激活常量
         */
        public activeUniforms(gl: GL, uniformInfos: WebGLActiveInfo[])
        {
            _samplerIndex = 0;
            for (var o = 0; o < uniformInfos.length; o++)
            {
                var activeInfo = uniformInfos[o];
                if (activeInfo.uniformBaseName)
                {
                    //处理数组
                    var baseName = activeInfo.uniformBaseName;
                    for (var j = 0; j < activeInfo.size; j++)
                    {
                        this.setContext3DUniform(gl, { name: baseName + `[${j}]`, type: activeInfo.type, uniformLocation: activeInfo.uniformLocation[j] }, this[baseName][j]);
                    }
                } else
                {
                    this.setContext3DUniform(gl, activeInfo, this[activeInfo.name]);
                }
            }
        }

        /**
         * 设置环境Uniform数据
         */
        private setContext3DUniform(gl: GL, activeInfo: { name: string; uniformLocation: WebGLUniformLocation, type: number; }, data)
        {
            var location = activeInfo.uniformLocation;
            switch (activeInfo.type)
            {
                case GL.INT:
                    gl.uniform1i(location, data);
                    break;
                case GL.FLOAT_MAT4:
                    gl.uniformMatrix4fv(location, false, data.rawData);
                    break;
                case GL.FLOAT:
                    gl.uniform1f(location, data);
                    break;
                case GL.FLOAT_VEC2:
                    gl.uniform2f(location, data.x, data.y);
                    break;
                case GL.FLOAT_VEC3:
                    gl.uniform3f(location, data.x, data.y, data.z);
                    break;
                case GL.FLOAT_VEC4:
                    gl.uniform4f(location, data.x, data.y, data.z, data.w);
                    break;
                case GL.SAMPLER_2D:
                case GL.SAMPLER_CUBE:
                    var textureInfo = <TextureInfo>data;
                    //激活纹理编号
                    gl.activeTexture(GL["TEXTURE" + _samplerIndex]);
                    textureInfo.active(gl);
                    //设置纹理所在采样编号
                    gl.uniform1i(location, _samplerIndex);
                    _samplerIndex++;
                    break;
                default:
                    throw `无法识别的uniform类型 ${activeInfo.name} ${data}`;
            }
        }
    }
    var _samplerIndex = 0;
}