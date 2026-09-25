/**
 * 材质渲染状态辅助函数（过渡用）。
 *
 * core 已移除 `Material.renderParams`，渲染状态改为直接写在
 * `material.renderPipeline`（webgpu 原生 RenderPipeline）上。
 * 编辑器部分旧代码仍以 `renderParams.{enableBlend, renderMode, cullFace, ...}`
 * 的方式配置材质，这里提供一组等价辅助函数，便于渐进迁移。
 */
import { Material } from 'feng3d';

/** 标准透明混合 BlendState（src-alpha / one-minus-src-alpha，add）。 */
const ALPHA_BLEND = {
    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
} as const;

/** 开启/关闭 alpha 混合。 */
export function setBlendEnabled(material: Material, enabled: boolean): void
{
    const rp = material.renderPipeline as any;
    rp.fragment.targets = [enabled ? { blend: ALPHA_BLEND } : {}];
}

/** 设置图元拓扑（对应原 renderMode）。 */
export function setTopology(material: Material, topology: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip'): void
{
    const rp = material.renderPipeline as any;
    rp.primitive.topology = topology;
}

/** 设置剔除面。 */
export function setCullFace(material: Material, cullFace: 'none' | 'front' | 'back'): void
{
    const rp = material.renderPipeline as any;
    rp.primitive.cullFace = cullFace;
}

/** 设置是否写入深度（对应原 depthMask）。 */
export function setDepthWrite(material: Material, enabled: boolean): void
{
    const rp = material.renderPipeline as any;
    rp.depthStencil.depthWriteEnabled = enabled;
}

/** 设置是否进行深度测试（对应原 depthtest，关闭时使用 'always'）。 */
export function setDepthTest(material: Material, enabled: boolean): void
{
    const rp = material.renderPipeline as any;
    rp.depthStencil.depthCompare = enabled ? 'less' : 'always';
}
