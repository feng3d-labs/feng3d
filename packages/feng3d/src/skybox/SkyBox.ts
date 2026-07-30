import { computed, logic, reactive, registerLogic } from "@feng3d/reactivity";
import { RenderObject, Texture, TextureView } from "@feng3d/webgpu";
import { cameraUniformsWGSL, Camera } from "../cameras/Camera";
import type { Component3D } from '../component/Component';
import { Component3DLogic, componentLogic } from '../component/Component';
import { Scene } from "../scene/Scene";

declare module '../component/Component'
{
    export interface ComponentMap
    {
        SkyBox: SkyBox;
    }
}

/**
 * SkyBox（纯数据接口）。
 */
export interface SkyBox extends Component3D
{
    readonly __type__: 'SkyBox';
    readonly s_skyboxTexture: Texture;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SkyBox: SkyBoxLogic;
    }
}

/**
 * SkyBox 逻辑处理接口。
 *
 * beforeRender 将天空盒纹理写入 renderObject.bindingResources。
 */
export interface SkyBoxLogic extends Component3DLogic
{
}

/**
 * 创建 SkyBoxLogic 实例（工厂函数，组合 componentLogic 基础行为）。
 */
export function skyBoxLogic(skybox: SkyBox): SkyBoxLogic
{
    const base = componentLogic(skybox);

    return Object.assign(base, {
    }) as unknown as SkyBoxLogic;
}

// 注册到 componentLogic 分发表
registerLogic('SkyBox', skyBoxLogic);

export function skyboxRenderObject(input: { readonly scene: Scene, readonly camera: Camera })
{
    const r_input = reactive(input);

    let cameraUniforms: {
        readonly value: CameraUniforms;
    };

    let s_skyboxTexture: TextureView;

    const renderObject: RenderObject = {
        pipeline: {
            vertex: { wgsl: skyboxWGSL, },
            fragment: { wgsl: skyboxWGSL },
            primitive: { cullFace: 'none' },
            depthStencil: { depthWriteEnabled: false, depthCompare: 'less-equal' }
        },
        draw: { __type__: 'DrawVertex' as const, vertexCount: 36, instanceCount: 1, firstVertex: 0, firstInstance: 0 },
        bindingResources: {
            cameraUniforms: cameraUniforms = { value: null as CameraUniforms },
            s_skyboxTextureSampler: {},
            s_skyboxTexture: s_skyboxTexture = { texture: null, dimension: 'cube', arrayLayerCount: 6, }
        },
    };

    const renderObjectComput = computed(() =>
    {
        //
        r_input.scene;
        r_input.camera;

        //
        const scene = input.scene;
        const camera = input.camera;

        const activeSkyBoxs = logic(scene).activeSkyBoxs;
        const skybox = activeSkyBoxs[0];

        // 无激活天空盒：返回空数组（保持引用稳定）
        if (!skybox) return null;

        // 旧版 TextureCube 有嵌套 .texture 字段（Texture 类型）；改为统一 Texture 接口后，
        // s_skyboxTexture 本身就是 TextureLike，直接赋给 TextureView.texture。
        reactive(s_skyboxTexture).texture = skybox.s_skyboxTexture as unknown as TextureView['texture'];
        reactive(cameraUniforms).value = logic(camera).uniforms;

        return renderObject;
    });


    return {
        get renderObject() { return renderObjectComput.value; }
    };
}

/**
 * 天空盒顶点着色器代码
 *
 * CameraUniforms 由 cameraUniformsWGSL 拼接，避免重复声明
 * （struct 定义在数据源 Camera.ts 中维护）。天空盒不使用 TransformUniforms。
 */
const skyboxWGSL = `
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) dir: vec3<f32>,
}
` + cameraUniformsWGSL + `
// 硬编码立方体 36 个顶点（6 个面 × 2 三角形 × 3 顶点，按索引展开）
var<private> pos: array<vec3<f32>, 36> = array<vec3<f32>, 36>(
    // +Z face
    vec3<f32>(-1,  1,  1), vec3<f32>( 1,  1,  1), vec3<f32>( 1, -1,  1),
    vec3<f32>( 1, -1,  1), vec3<f32>(-1, -1,  1), vec3<f32>(-1,  1,  1),
    // -Z face
    vec3<f32>( 1,  1, -1), vec3<f32>(-1,  1, -1), vec3<f32>(-1, -1, -1),
    vec3<f32>(-1, -1, -1), vec3<f32>( 1, -1, -1), vec3<f32>( 1,  1, -1),
    // +X face
    vec3<f32>( 1,  1,  1), vec3<f32>( 1,  1, -1), vec3<f32>( 1, -1, -1),
    vec3<f32>( 1, -1, -1), vec3<f32>( 1, -1,  1), vec3<f32>( 1,  1,  1),
    // -X face
    vec3<f32>(-1,  1, -1), vec3<f32>(-1,  1,  1), vec3<f32>(-1, -1,  1),
    vec3<f32>(-1, -1,  1), vec3<f32>(-1, -1, -1), vec3<f32>(-1,  1, -1),
    // +Y face
    vec3<f32>(-1,  1, -1), vec3<f32>( 1,  1, -1), vec3<f32>( 1,  1,  1),
    vec3<f32>( 1,  1,  1), vec3<f32>(-1,  1,  1), vec3<f32>(-1,  1, -1),
    // -Y face
    vec3<f32>(-1, -1,  1), vec3<f32>( 1, -1,  1), vec3<f32>( 1, -1, -1),
    vec3<f32>( 1, -1, -1), vec3<f32>(-1, -1, -1), vec3<f32>(-1, -1,  1),
);

@vertex
fn vertex(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var output: VertexOutput;
    let p = pos[vertexIndex];
    // 去掉视图矩阵的平移分量，让天空盒跟随相机
    let viewNoTrans = mat4x4<f32>(
        vec4<f32>(cameraUniforms.u_viewMatrix[0].xyz, 0.0),
        vec4<f32>(cameraUniforms.u_viewMatrix[1].xyz, 0.0),
        vec4<f32>(cameraUniforms.u_viewMatrix[2].xyz, 0.0),
        vec4<f32>(0.0, 0.0, 0.0, 1.0),
    );
    let viewProjectionNoTrans = cameraUniforms.u_projectionMatrix * viewNoTrans;
    let clipPos = viewProjectionNoTrans * vec4<f32>(p, 1.0);
    output.position = clipPos.xyww;
    output.dir = p;
    return output;
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

@group(1) @binding(0) var s_skyboxTextureSampler: sampler;
@group(1) @binding(1) var s_skyboxTexture: texture_cube<f32>;

@fragment
fn fragment(input: VertexOutput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = textureSample(s_skyboxTexture, s_skyboxTextureSampler, input.dir);
    return output;
}
`;

