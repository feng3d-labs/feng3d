import { getBuildParam } from '../../core/buildShader';
import { Sampler } from '../sampler/sampler';
import { Vec2 } from '../../types/vector/vec2';
import { Vec4 } from '../../types/vector/vec4';

/**
 * texture2D 函数，用于采样纹理
 * @param sampler 采样器（在 GLSL 中是 sampler2D，在 WGSL 中需要 texture 和 sampler）
 * @param coord 纹理坐标（vec2）
 * @returns 采样结果（vec4）
 */
export function texture2D(sampler: Sampler, coord: Vec2): Vec4
{
    const result = new Vec4();
    result.toGLSL = () =>
    {
        const buildParam = getBuildParam();
        const version = buildParam.version;
        // 在 WebGL 2.0 中，必须使用 texture 而不是 texture2D
        const textureFunc = version === 2 ? 'texture' : 'texture2D';

        return `${textureFunc}(${sampler.uniform.name}, ${coord.toGLSL()})`;
    };
    // 在 WGSL 中，texture 和 sampler 是分离的
    result.toWGSL = () => `textureSample(${sampler.uniform.name}_texture, ${sampler.uniform.name}, ${coord.toWGSL()})`;
    result.dependencies = [sampler, coord];

    return result;
}

