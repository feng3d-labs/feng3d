import { reactive, registerLogic } from '@feng3d/reactivity';
import { RenderPipeline } from '@feng3d/webgpu';
import { getNormalShaderWGSL } from '../shaders/tsl/normalMaterial';
import { Material, MaterialLogic, materialLogic, writeMaterialBase } from './Material';

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
export interface NormalMaterialLogic extends MaterialLogic
{
}

/**
 * 工厂函数：NormalMaterialLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 材质数据（raw）
 */
export function normalMaterialLogic(data: NormalMaterial): NormalMaterialLogic
{
    // 经响应式代理读取（本材质此前不读任何数据字段，为 depthWrite 引入）
    const r_material = reactive(data);
    const depthWrite = () => r_material.depthWrite ?? true; // 缺省沿用该材质原默认值（issue #157）

    // TSL 构建的着色器（首次调用时构建并缓存，见 shaders/tsl/normalMaterial.ts）
    const shaderWGSL = getNormalShaderWGSL();

    const renderPipeline = reactive({
        vertex: { wgsl: shaderWGSL.vertex },
        fragment: { wgsl: shaderWGSL.fragment, targets: [{}] },
        primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'ccw' },
        depthStencil: { depthWriteEnabled: depthWrite(), depthCompare: 'less' },
    }) as RenderPipeline;

    // 组合基类工厂：未覆写的成员显式委托（不要用 ...base 展开——会把 getter 立刻求值）
    const base = materialLogic(data);

    const logic: NormalMaterialLogic = {
        get isTransparent() { return base.isTransparent; },
        get isPrimitivesTopology() { return base.isPrimitivesTopology; },
        get isLoaded() { return base.isLoaded; },
        beforeRender(renderObject) { writeMaterialBase(renderObject, renderPipeline, () => ({})); },
    };

    return logic;
}

registerLogic('NormalMaterial', normalMaterialLogic);
