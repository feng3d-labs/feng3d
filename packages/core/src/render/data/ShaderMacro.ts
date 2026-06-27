/**
 * 着色器宏定义。
 *
 * 原属 @feng3d/renderer，现迁移到 core 内部。在 WebGPU 路径下，宏通过 WGSL
 * `override` 常量（pipeline.vertex.constants）或运行时分支实现。
 */
export interface ShaderMacro
{
    /** UV 中的 U 缩放。 */
    SCALEU: number;
    /** UV 中的 V 缩放。 */
    SCALEV: number;
    /** 光源数量。 */
    NUM_LIGHT: number;
    /** 点光源数量。 */
    NUM_POINTLIGHT: number;
    /** 方向光源数量。 */
    NUM_DIRECTIONALLIGHT: number;
    /** 生成投影的方向光源数量。 */
    NUM_DIRECTIONALLIGHT_CASTSHADOW: number;
    /** 生成投影的点光源数量。 */
    NUM_POINTLIGHT_CASTSHADOW: number;
    /** 聚光灯光源数量。 */
    NUM_SPOT_LIGHTS: number;
    /** 生成投影的聚光灯光源数量。 */
    NUM_SPOT_LIGHTS_CASTSHADOW: number;
    /** 骨骼关节数量。 */
    NUM_SKELETONJOINT: number;
    /** 旋转顺序。 */
    RotationOrder: number;
    /** 是否有漫反射贴图。 */
    HAS_DIFFUSE_SAMPLER: boolean;
    /** 是否有法线贴图。 */
    HAS_NORMAL_SAMPLER: boolean;
    /** 是否有镜面反射光泽图。 */
    HAS_SPECULAR_SAMPLER: boolean;
    /** 是否有环境贴图。 */
    HAS_AMBIENT_SAMPLER: boolean;
    /** 是否有骨骼动画。 */
    HAS_SKELETON_ANIMATION: boolean;
    /** 是否有粒子动画。 */
    HAS_PARTICLE_ANIMATOR: boolean;
    /** 是否为点渲染模式。 */
    IS_POINTS_MODE: boolean;
    /** 是否有地形方法。 */
    HAS_TERRAIN_METHOD: boolean;
    /** 使用合并地形贴图。 */
    USE_TERRAIN_MERGE: boolean;
    /** 环境映射函数。 */
    HAS_ENV_METHOD: boolean;
    /** 是否卡通渲染。 */
    IS_CARTOON: boolean;
    /** 是否抗锯齿。 */
    cartoon_Anti_aliasing: boolean;
    /** 是否启用粒子系统纹理表动画模块。 */
    ENABLED_PARTICLE_SYSTEM_textureSheetAnimation: boolean;
    /** 是否有颜色顶点数据。 */
    HAS_a_color: boolean;
    /** 是否有粒子系统（ParticleSystem 新增）。 */
    HAS_PARTICLE_SYSTEM?: boolean;
}
