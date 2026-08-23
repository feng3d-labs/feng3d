/**
 * 示例视觉回归测试清单。
 *
 * 由 `examples/src/files.ts` 的非空分类生成（共 21 个示例）。
 *
 * 每个示例经过两阶段渲染再定格截图（保证异步纹理/管线完成、画面可复现）：
 *   - warmupFrames：自由渲染的预热帧数。让纹理上传、WebGPU 管线编译、
 *     shadow map 初始化等异步过程完成。异步资源多的示例（SkyBox、StandardMaterial
 *     带纹理、阴影）需要更大值。
 *   - freezeFrames：预热后定格前再渲染的帧数。让旋转/变色进入第 N 帧的确定值，
 *     再永久停止动画。多数示例 10~30 即可。
 *
 * 新增示例时在此追加即可，无需修改测试主体。
 */
export interface ExampleSpec
{
    /** 示例所在分类（对应 examples/src 子目录名） */
    readonly category: string;
    /** 示例名（不含扩展名，与 .html / .ts 文件一致） */
    readonly name: string;
    /** 预热帧数：异步资源完成前自由渲染的帧数 */
    readonly warmupFrames: number;
    /** 定格帧数：预热后渲染到第 N 帧再停止动画 */
    readonly freezeFrames: number;
    /** 截图容差：覆盖全局 maxDiffPixelRatio。仅用于无法完全定格的示例
     *  （如用 Date.now() 真实时间驱动动画，定格后仍有帧间抖动）。 */
    readonly maxDiffPixelRatio?: number;
}

/**
 * 所有纳入视觉回归测试的示例。
 */
export const EXAMPLES: readonly ExampleSpec[] = [
    // ---- base ----
    { category: 'base', name: 'Container3DTest', warmupFrames: 30, freezeFrames: 30 },
    { category: 'base', name: 'FPSControllerTest', warmupFrames: 30, freezeFrames: 5 },
    { category: 'base', name: 'BillboardTest', warmupFrames: 30, freezeFrames: 30 },
    { category: 'base', name: 'MousePickTest', warmupFrames: 30, freezeFrames: 5 },
    { category: 'base', name: 'SkyBoxTest', warmupFrames: 90, freezeFrames: 10 },
    { category: 'base', name: 'FogTest', warmupFrames: 30, freezeFrames: 30 },
    { category: 'base', name: 'ScriptTest', warmupFrames: 30, freezeFrames: 30 },
    // PrefabTest：1000 实例首帧构造/上传较重，预热放宽到 60 帧
    { category: 'base', name: 'PrefabTest', warmupFrames: 60, freezeFrames: 30 },
    { category: 'base', name: 'RefTest', warmupFrames: 30, freezeFrames: 30 },

    // ---- material ----
    { category: 'material', name: 'PointMaterialTest', warmupFrames: 30, freezeFrames: 30 },
    { category: 'material', name: 'SegmentMaterialTest', warmupFrames: 30, freezeFrames: 30 },
    { category: 'material', name: 'StandardMaterialTest', warmupFrames: 60, freezeFrames: 30 },
    { category: 'material', name: 'TextureMaterialTest', warmupFrames: 60, freezeFrames: 30 },

    // ---- geometry ----
    { category: 'geometry', name: 'PrimitiveTest', warmupFrames: 30, freezeFrames: 30 },

    // ---- lights ----
    // PointLightTest 用 Date.now() 真实时间驱动光源旋转，定格后光源位置仍有 ~2% 帧间抖动，
    // 放宽容差到 3%（无法通过增加帧数消除，因时间基准不可冻结）。
    { category: 'lights', name: 'PointLightTest', warmupFrames: 30, freezeFrames: 30, maxDiffPixelRatio: 0.03 },

    // ---- advanced ----
    { category: 'advanced', name: 'TerrainTest', warmupFrames: 180, freezeFrames: 10 },

    // ---- away3d ----
    { category: 'away3d', name: 'Basic_View', warmupFrames: 30, freezeFrames: 10 },
    // Basic_SkyBox 有环境反射/天空盒渲染，帧间存在 ~2% 的轻微抖动（相机与反射时序），放宽容差。
    { category: 'away3d', name: 'Basic_SkyBox', warmupFrames: 90, freezeFrames: 10, maxDiffPixelRatio: 0.03 },
    { category: 'away3d', name: 'Basic_Shading', warmupFrames: 60, freezeFrames: 30 },
    { category: 'away3d', name: 'DebugShadowMap', warmupFrames: 60, freezeFrames: 30 },

    // ---- font ----
    { category: 'font', name: 'GeometryFontTest', warmupFrames: 30, freezeFrames: 30 },
];
