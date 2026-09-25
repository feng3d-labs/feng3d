/**
 * 材质渲染状态辅助函数。
 *
 * **迁移背景（重要）**：主仓已把材质渲染状态改为「材质 Logic 内部默认值」——
 * `primitive`（topology / cullFace / frontFace）与 `depthStencil`
 * （depthWriteEnabled / depthCompare）写在各自的 `XxxMaterialLogic` 构造里，
 * **不在纯数据接口上**，也没有对外写入入口（AGENTS §11.2：Logic 对外只读、
 * 不暴露可写字段）。因此这些设置在当前 API 下**无法产生真实效果**。
 *
 * 处理策略：
 * - `setBlendEnabled` 可真实实现——`blend` 是部分材质的**数据字段**（如 TextureMaterial）
 * - 其余四项降级为 **no-op + 一次性告警**，保留签名以免调用方静默失效，
 *   待主仓为材质补充渲染状态数据字段后恢复实现（见 docs/API_MIGRATION.md §8 功能缺口）
 */
import type { Material } from 'feng3d';
import { reactive } from '@feng3d/reactivity';

/** 标准透明混合 BlendState（src-alpha / one-minus-src-alpha，add）。 */
const ALPHA_BLEND = {
    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
} as const;

/** 尚未支持的能力只告警一次，避免刷屏 */
const warned = new Set<string>();

function warnUnsupported(name: string, detail: string): void
{
    if (warned.has(name)) return;
    warned.add(name);
    console.warn(
        `[materialRenderState] ${name} 在当前主仓 API 下不可用：${detail}。`
        + '材质渲染状态已内聚到材质 Logic 的默认值，数据接口未暴露对应字段（AGENTS §11.2）。',
    );
}

/**
 * 开启/关闭 alpha 混合。
 *
 * 仅对**数据接口上声明了 `blend` 字段**的材质有效（如 `TextureMaterial`）；
 * 其余材质（如 `SegmentMaterial`）的混合状态由其 Logic 默认值决定，此处不生效。
 */
export function setBlendEnabled(material: Material, enabled: boolean): void
{
    if (!('blend' in material))
    {
        warnUnsupported('setBlendEnabled', `材质 ${(material as { __type__?: string }).__type__ ?? '?'} 未声明 blend 字段`);

        return;
    }

    reactive(material as Material & { blend?: typeof ALPHA_BLEND }).blend = enabled ? ALPHA_BLEND : undefined;
}

/** 设置图元拓扑（对应原 renderMode）。 */
export function setTopology(_material: Material, _topology: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip'): void
{
    warnUnsupported('setTopology', 'primitive.topology 是材质 Logic 的默认值，数据接口未暴露');
}

/** 设置剔除面。 */
export function setCullFace(_material: Material, _cullFace: 'none' | 'front' | 'back'): void
{
    warnUnsupported('setCullFace', 'primitive.cullFace 是材质 Logic 的默认值，数据接口未暴露');
}

/** 设置是否写入深度（对应原 depthMask）。 */
export function setDepthWrite(_material: Material, _enabled: boolean): void
{
    warnUnsupported('setDepthWrite', 'depthStencil.depthWriteEnabled 是材质 Logic 的默认值，数据接口未暴露');
}

/** 设置是否进行深度测试（对应原 depthtest，关闭时使用 'always'）。 */
export function setDepthTest(_material: Material, _enabled: boolean): void
{
    warnUnsupported('setDepthTest', 'depthStencil.depthCompare 是材质 Logic 的默认值，数据接口未暴露');
}
