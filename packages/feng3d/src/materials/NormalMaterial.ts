import { reactive, registerLogic } from '@feng3d/reactivity';
import { RenderObject, RenderPipeline } from '@feng3d/webgpu';
import { cameraUniformsWGSL } from '../cameras/Camera';
import { transformUniformsWGSL } from '../core/Object3D';
import { Material, MaterialLogic, writeMaterialBase } from './Material';

declare module './Material'
{
    export interface MaterialMap
    {
        NormalMaterial: NormalMaterial;
    }
}

/**
 * 法线可视化材质（纯数据接口）。
 *
 * 片元着色器输出法线方向作为颜色（normalize(normal)*0.5+0.5），无光照计算。
 * 对应 three.js MeshNormalMaterial。
 */
export interface NormalMaterial extends Material
{
    readonly __type__: 'NormalMaterial';
    /**
     * 是否写入深度缓冲（缺省取该材质原默认值）。
     *
     * 关闭后该材质的片元不更新深度，常用于图标 / 辅助线 / 描边等不希望互相遮挡、
     * 也不希望挡住场景的绘制（见 issue #157）。
     */
    readonly depthWrite?: boolean;
}

/**
 * NormalMaterial logic：法线→RGB 着色器。
 */
/**
 * NormalMaterial 逻辑类：法线→RGB 着色器。
 */
export class NormalMaterialLogic extends MaterialLogic
{
    #renderPipeline: RenderPipeline;

    protected constructor(data: NormalMaterial)
    {
        super(data);
        // 经响应式代理读取（本材质此前不读任何数据字段，为 depthWrite 引入）
        const r_material = reactive(data);
        const depthWrite = () => r_material.depthWrite ?? true; // 缺省沿用该材质原默认值（issue #157）

        this.#renderPipeline = reactive({
            vertex: { wgsl: normalVertexWGSL },
            fragment: { wgsl: normalFragmentWGSL, targets: [{}] },
            primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'ccw' },
            depthStencil: { depthWriteEnabled: depthWrite(), depthCompare: 'less' },
        }) as RenderPipeline;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: NormalMaterial): NormalMaterialLogic
    {
        return new NormalMaterialLogic(data);
    }

    beforeRender(renderObject: RenderObject): void
    {
        writeMaterialBase(renderObject, this.#renderPipeline, () => ({}));
    }
}

// 顶点着色器：变换 position + normal
const normalVertexWGSL = `
struct VertexInput {
    @location(0) a_position: vec3<f32>,
    @location(1) a_normal: vec3<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldNormal: vec3<f32>,
}

` + transformUniformsWGSL + cameraUniformsWGSL + `
@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let worldPosition = transform.u_modelMatrix * vec4<f32>(input.a_position, 1.0);
    output.position = cameraUniforms.u_viewProjection * worldPosition;
    let normal = normalize((transform.u_ITModelMatrix * vec4<f32>(input.a_normal, 0.0)).xyz);
    output.worldNormal = normal;
    return output;
}
`;

// 片元着色器：normal → RGB
const normalFragmentWGSL = `
struct FragmentInput {
    @location(0) worldNormal: vec3<f32>,
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    // 法线 [-1,1] → [0,1]
    output.color = vec4<f32>(normalize(input.worldNormal) * 0.5 + vec3<f32>(0.5), 1.0);
    return output;
}
`;

registerLogic('NormalMaterial', NormalMaterialLogic as unknown as new (data: NormalMaterial) => NormalMaterialLogic);
