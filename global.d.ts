declare namespace GlobalMixins
{
    type Vector4 = import('@feng3d/math').Vector4;
    type Matrix4x4 = import("@feng3d/math").Matrix4x4;
    type Vector3 = import("@feng3d/math").Vector3;
    type Color4 = import("@feng3d/math").Color4;
    type Vector2 = import("@feng3d/math").Vector2;
    type Color3 = import("@feng3d/math").Color3;
    type Matrix3x3 = import("@feng3d/math").Matrix3x3;

    type Texture2D = import('./src/textures/Texture2D').Texture2D;
    type TextureCube = import('./src/textures/TextureCube').TextureCube;
    type PointLight = import('./src/light/PointLight').PointLight;
    type SpotLight = import('./src/light/SpotLight').SpotLight;
    type DirectionalLight = import('./src/light/DirectionalLight').DirectionalLight;
    type LightType = import('./src/light/LightType').LightType;
    type Camera = import('./src/cameras/Camera').Camera;
    type Material = import('./src/materials/Material').Material;

    type WaterUniforms = import('./src/water/WaterMaterial').WaterUniforms;
    type TextureUniforms = import('./src/materials/TextureMaterial').TextureUniforms;
    type PointUniforms = import('./src/materials/PointMaterial').PointUniforms;
    type SegmentUniforms = import('./src/materials/SegmentMaterial').SegmentUniforms;
    type ColorUniforms = import('./src/materials/ColorMaterial').ColorUniforms;
    type StandardUniforms = import('./src/materials/StandardMaterial').StandardUniforms;

    type Behaviour = import('./src/component/Behaviour').Behaviour;
    type SkeletonComponent = import('./src/animators/skeleton/SkeletonComponent').SkeletonComponent;
    type SkinnedMeshRenderer = import('./src/animators/skeleton/SkinnedMeshRenderer').SkinnedMeshRenderer;
    type AudioSource = import('./src/audio/AudioSource').AudioSource;
    type BillboardComponent = import('./src/component/BillboardComponent').BillboardComponent;
    type HoldSizeComponent = import('./src/component/HoldSizeComponent').HoldSizeComponent;
    type OutLineComponent = import('./src/component/OutLineComponent').OutLineComponent;
    type CartoonComponent = import('./src/component/CartoonComponent').CartoonComponent;
    type WireframeComponent = import('./src/component/WireframeComponent').WireframeComponent;
    type FPSController = import('./src/controllers/FPSController').FPSController;
    type BoundingBox = import('./src/core/BoundingBox').BoundingBox;
    type MeshRenderer = import('./src/core/MeshRenderer').MeshRenderer;
    type RayCastable = import('./src/core/RayCastable').RayCastable;
    type Water = import('./src/water/Water').Water;
    type SkyBox = import('./src/skybox/SkyBox').SkyBox;
    type Scene = import('./src/scene/Scene').Scene;
    type TransformLayout = import('./src/core/TransformLayout').TransformLayout;
    type Transform = import('./src/core/Transform').Transform;
    type ScriptComponent = import('./src/core/ScriptComponent').ScriptComponent;
    type Renderable = import('./src/core/Renderable').Renderable;

    interface UniformsTypes
    {
        water: WaterUniforms;
        texture: TextureUniforms;
        point: PointUniforms;
        segment: SegmentUniforms;
        color: ColorUniforms;
        standard: StandardUniforms;
    }

    interface DefaultMaterial
    {
        "Water-Material": Material;
        "Segment-Material": Material;
        "Default-Material": Material;
    }

    interface GameObjectEventMap
    {
        lensChanged;
    }

    interface ComponentMap
    {
        Camera: Camera;
        Behaviour: Behaviour;
        Animation: Animation;
        SkeletonComponent: SkeletonComponent;
        SkinnedMeshRenderer: SkinnedMeshRenderer;
        AudioListener: AudioListener;
        AudioSource: AudioSource;
        BillboardComponent: BillboardComponent;
        CartoonComponent: CartoonComponent;
        HoldSizeComponent: HoldSizeComponent;
        OutLineComponent: OutLineComponent;
        WireframeComponent: WireframeComponent;
        FPSController: FPSController;
        BoundingBox: BoundingBox;
        MeshRenderer: MeshRenderer;
        RayCastable: RayCastable;
        Water: Water;
        SkyBox: SkyBox;
        Scene: Scene;
        SpotLight: SpotLight;
        PointLight: PointLight;
        DirectionalLight: DirectionalLight;
        TransformLayout: TransformLayout;
        Transform: Transform;
        ScriptComponent: ScriptComponent;
        Renderable: Renderable;
    }

    interface Uniforms
    {
        u_diffuseSegment: Vector4;
        u_diffuseSegmentValue: Vector4;

        u_specularSegment: number;
    }

    interface Uniforms
    {
        /**
         * 描边宽度
         */
        u_outlineSize: number;
        /**
         * 描边颜色
         */
        u_outlineColor: Color4;
        /**
         * 描边形态因子
         * (0.0，1.0):0.0表示延法线方向，1.0表示延顶点方向
         */
        u_outlineMorphFactor: number;
    }

    interface Uniforms
    {
        /**
         * t(单位秒) 是自该初始化开始所经过的时间，4个分量分别是 (t/20, t, t*2, t*3)
         */
        _Time: Vector4;
        /**
         * 模型矩阵
         */
        u_modelMatrix: Matrix4x4;
        /**
         * （view矩阵）摄像机逆矩阵
         */
        u_viewMatrix: Matrix4x4;
        /**
         * 投影矩阵
         */
        u_projectionMatrix: Matrix4x4;
        /**
         * 摄像机矩阵
         */
        u_cameraMatrix: Matrix4x4;
        /**
         * 摄像机位置
         */
        u_cameraPos: Vector3;
        /**
         * 模型-摄像机 矩阵
         */
        u_mvMatrix: Matrix4x4;
        /**
         * 模型逆转置矩阵,用于计算全局法线
         * 参考：http://blog.csdn.net/christina123y/article/details/5963679
         */
        u_ITModelMatrix: Matrix4x4;
        /**
         * 模型-摄像机 逆转置矩阵，用于计算摄像机空间法线
         */
        u_ITMVMatrix: Matrix4x4;
        /**
         * 世界投影矩阵
         */
        u_viewProjection: Matrix4x4;

        u_diffuseInput: Color4;
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
        u_pointShadowMaps: Texture2D[];

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
        u_spotShadowMaps: Texture2D[];

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
        u_directionalShadowMaps: Texture2D[];

        /**
         * 场景环境光
         */
        u_sceneAmbientColor: Color4;
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
        u_skeletonGlobalMatriices: Matrix4x4[];

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
         * 单位深度映射到屏幕像素值
         */
        u_scaleByDepth: number;

        /**
         * 线框颜色
         */
        u_wireframeColor: Color4;

        u_lightType: LightType;
        u_lightPosition: Vector3;
        u_shadowCameraNear: number;
        u_shadowCameraFar: number;
    }


    interface ComponentMap
    {

    }

    interface OAVComponentParamMap
    {
        OAVDefault: OAVDefaultParam;
        OAVArray: OAVArrayParam;
        OAVPick: OAVPickParam;
        OAVEnum: OAVEnumParam;

        OAVCubeMap: { component: "OAVCubeMap", componentParam: Object };
        OAVImage: { component: "OAVImage", componentParam: Object };
        OAVObjectView: { component: "OAVObjectView", componentParam: Object };
        OAVParticleComponentList: { component: "OAVParticleComponentList", componentParam: Object };
        OAVComponentList: { component: "OAVComponentList", componentParam: Object };
        OAVGameObjectName: { component: "OAVGameObjectName", componentParam: Object };
        OAVMaterialName: { component: "OAVMaterialName", componentParam: Object };
        OAVMultiText: { component: "OAVMultiText", componentParam: Object };
        OAVFeng3dPreView: { component: "OAVFeng3dPreView", componentParam: Object };
        OAVAccordionObjectView: { component: "OAVAccordionObjectView", componentParam: Object };
        OAVVector3: OAVVector3Param;
    }

    /**
     * OAVVector3 组件参数
     */
    interface OAVVector3Param
    {
        component: "OAVVector3", componentParam: {
            label?: string,

            /**
             * 步长，精度
             */
            step?: number;

            /**
             * 按下上下方向键时增加的步长数量
             */
            stepDownup?: number;

            /**
             * 移动一个像素时增加的步长数量
             */
            stepScale?: number;

            /**
             * 最小值
             */
            minValue?: number;

            /**
             * 最小值
             */
            maxValue?: number;

            editable?: boolean
        }
    }

    /**
     * OAVDefault 组件参数
     */
    interface OAVDefaultParam
    {
        component: "OAVDefault";

        componentParam: {
            /**
             * 拾取参数
             */
            dragparam?: {
                /**
                 * 可接受数据类型
                 */
                accepttype: string,
                /**
                 * 提供数据类型
                 */
                datatype?: string,
            }
        }
    }

    /**
     * OAVArray 组件参数
     */
    interface OAVArrayParam 
    {
        component: "OAVArray";

        componentParam: {
            /**
             * 拾取参数
             */
            dragparam?: {
                /**
                 * 可接受数据类型
                 */
                accepttype: string,
                /**
                 * 提供数据类型
                 */
                datatype?: string,
            },
            /**
             * 添加item时默认数据，赋值 ()=>any
             */
            defaultItem: any
        }
    }

    /**
     * OAVPick 组件参数
     */
    interface OAVPickParam 
    {
        component: "OAVPick";

        componentParam: {
            /**
             * 可接受数据类型
             */
            accepttype: string,
            /**
             * 提供数据类型
             */
            datatype?: string,
        }
    }

    /**
     * OAVEnum 组件参数
     */
    interface OAVEnumParam 
    {
        component: "OAVEnum";

        componentParam: {
            /**
             * 枚举类型
             */
            enumClass: any,
        }
    }

}