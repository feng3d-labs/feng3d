import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
import { RenderObject } from '@feng3d/webgpu';
import { buildTextureSampler } from '../render/webgpu/MaterialPipeline';
import { skyboxFragmentWGSL } from '../shaders/skybox.fragment.wgsl';
import { skyboxVertexWGSL } from '../shaders/skybox.vertex.wgsl';
import { TextureCube } from '../textures/TextureCube';
import { Material } from './Material';

/**
 * 天空盒材质 uniforms（保留供编辑器等旧代码做类型断言使用）。
 */
@decoratorRegisterClass()
export class SkyBoxUniforms
{
    __class__: 'SkyBoxUniforms';

    @serialize
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyboxTexture = TextureCube.default;
}

/**
 * 天空盒材质。
 *
 * 使用 skybox 着色器（按方向采样立方体纹理），关闭深度写入、深度比较为 less-equal，
 * 在最远处绘制。shader 与渲染状态在构造时填充到 {@link Material.renderPipeline}。
 *
 * 注意：实际场景天空盒目前由 {@link SkyBoxRenderer} 直接使用内联 RenderObject 渲染，
 * 本材质提供等价的 Material 形式，便于作为普通材质使用或后续统一渲染路径。
 */
@decoratorRegisterClass()
export class SkyBoxMaterial extends Material
{
    readonly uniforms: SkyBoxUniforms = new SkyBoxUniforms();

    constructor()
    {
        super();
        reactive(this.renderPipeline.vertex).wgsl = skyboxVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = skyboxFragmentWGSL;
        reactive(this.renderPipeline.primitive).cullFace = 'none';
        reactive(this.renderPipeline.depthStencil).depthWriteEnabled = false;
        reactive(this.renderPipeline.depthStencil).depthCompare = 'less-equal';
    }

    beforeRender(renderObject: RenderObject)
    {
        super.beforeRender(renderObject);

        const ro = renderObject as any;
        const bindingResources = ro.bindingResources ||= {};
        reactive(bindingResources).s_skyboxTexture = buildTextureSampler(this.uniforms.s_skyboxTexture);
    }

    /**
     * 是否加载完成
     */
    override get isLoaded()
    {
        return this.uniforms.s_skyboxTexture.isLoaded;
    }

    /**
     * 已加载完成或者加载完成时立即调用
     */
    override onLoadCompleted(callback: () => void)
    {
        if (this.isLoaded)
        {
            callback();

            return;
        }
        this.uniforms.s_skyboxTexture.on('loadCompleted', callback);
    }
}
