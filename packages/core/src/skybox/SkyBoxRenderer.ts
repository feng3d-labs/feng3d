import { BindingResource, RenderObject, RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
import { Camera } from '../cameras/Camera';
import { Scene } from '../scene/Scene';
import { SkyBox } from './SkyBox';

/**
 * 天空盒顶点着色器 WGSL（最小桩）。
 *
 * 把立方体顶点直接投影到裁剪空间（取 xyww 让最远处绘制），采样立方体纹理。
 * TODO: 后续完善为完整天空盒着色器。
 */
const skyboxVert = `
struct VertexInput {
    @location(0) a_position: vec3<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) dir: vec3<f32>,
}

struct CameraUniforms {
    u_projectionMatrix: mat4x4<f32>,
    u_viewProjection: mat4x4<f32>,
    u_viewMatrix: mat4x4<f32>,
    u_cameraMatrix: mat4x4<f32>,
    u_cameraPos: vec3<f32>,
    u_skyBoxSize: f32,
    u_scaleByDepth: f32,
}

@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    // 去掉视图矩阵的平移分量，让天空盒跟随相机
    let viewNoTrans = mat4x4<f32>(
        vec4<f32>(cameraUniforms.u_viewMatrix[0].xyz, 0.0),
        vec4<f32>(cameraUniforms.u_viewMatrix[1].xyz, 0.0),
        vec4<f32>(cameraUniforms.u_viewMatrix[2].xyz, 0.0),
        vec4<f32>(0.0, 0.0, 0.0, 1.0),
    );
    let viewProjectionNoTrans = cameraUniforms.u_projectionMatrix * viewNoTrans;
    let pos = viewProjectionNoTrans * vec4<f32>(input.a_position, 1.0);
    output.position = pos.xyww;
    output.dir = input.a_position;
    return output;
}
`;

/**
 * 天空盒片段着色器 WGSL（最小桩）。
 */
const skyboxFrag = `
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) dir: vec3<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

@group(1) @binding(0) var s_skyboxTextureSampler: sampler;
@group(1) @binding(1) var s_skyboxTexture: texture_cube<f32>;

@fragment
fn main(input: VertexOutput) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = textureSample(s_skyboxTexture, s_skyboxTextureSampler, input.dir);
    return output;
}
`;


/**
 * 天空盒渲染器
 */
export class SkyBoxRenderer
{
    private renderObject: RenderObject = {
        pipeline: {
            vertex: { wgsl: skyboxVert, entryPoint: 'main' },
            fragment: { wgsl: skyboxFrag, entryPoint: 'main' },
            primitive: { cullFace: 'none' },
            depthStencil: { depthWriteEnabled: false, depthCompare: 'less-equal' }
        },
        vertices: {
            a_position: {
                data: new Float32Array([ //
                    -1, 1, -1, //
                    1, 1, -1, //
                    1, 1, 1, //
                    -1, 1, 1, //
                    -1, -1, -1, //
                    1, -1, -1, //
                    1, -1, 1, //
                    -1, -1, 1 //
                ]),
                format: "float32x3"
            },
        },
        indices: new Uint16Array([ //
            0, 1, 2, 2, 3, 0, //
            6, 5, 4, 4, 7, 6, //
            2, 6, 7, 7, 3, 2, //
            4, 5, 1, 1, 0, 4, //
            4, 0, 3, 3, 7, 4, //
            2, 1, 5, 5, 6, 2 //
        ]),
    };

    init()
    {
    }

    /**
     * 绘制场景中天空盒
     * @param renderer
     * @param scene 场景
     * @param camera 摄像机
     */
    draw(submit: Submit, scene: Scene, camera: Camera)
    {
        const skybox = scene.activeSkyBoxs[0];
        this.drawSkyBox(submit, skybox, scene, camera);
    }

    /**
     * 绘制天空盒
     * @param renderer
     * @param skybox 天空盒
     * @param camera 摄像机
     */
    drawSkyBox(submit: Submit, skybox: SkyBox, scene: Scene, camera: Camera)
    {
        if (!skybox) return;

        this.init();

        //
        skybox.beforeRender(this.renderObject, scene, camera);

        const cameraUniforms = camera.getUniforms();
        const bindingResources = this.renderObject.bindingResources as { [key: string]: BindingResource };

        bindingResources.cameraUniforms = { value: cameraUniforms };

        //
        (((submit.commandEncoders[0].passEncoders[0] as RenderPass).renderPassObjects as RenderPassObject[])).push(this.renderObject);
    }
}

/**
 * 天空盒渲染器
 */
export const skyboxRenderer = new SkyBoxRenderer();
