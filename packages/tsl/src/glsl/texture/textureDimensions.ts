import { Uvec2 } from '../../types/vector/uvec2';
import { UInt } from '../../types/scalar/uint';
import { Sampler } from '../sampler/sampler';
import { StorageTexture2D } from './storageTexture2D';
import { StorageTexture3D } from './storageTexture3D';
import { Uvec3 } from '../../types/vector/uvec3';

/**
 * 查询纹理尺寸：`textureDimensions(<tex>)`（可带 mip 层级）。
 *
 * compute 里做像素坐标边界判断与 UV 归一化时会用到（如
 * `vec2<f32>(invocation_id.xy) / vec2<f32>(textureDimensions(framebuffer))`）。
 *
 * @param texture 纹理（普通采样器或存储纹理）
 * @param level mip 层级（可选）
 * @returns 尺寸（uvec2）
 */
export function textureDimensions(texture: StorageTexture3D, level?: UInt | number): Uvec3;
export function textureDimensions(texture: Sampler | StorageTexture2D, level?: UInt | number): Uvec2;
export function textureDimensions(texture: Sampler | StorageTexture2D | StorageTexture3D, level?: UInt | number): Uvec2 | Uvec3
{
    // 3D 返回 uvec3
    if (texture instanceof StorageTexture3D)
    {
        const result3 = new Uvec3();
        const name3 = () => texture.uniform.name;
        const level3 = () => (level === undefined ? '' : `, ${typeof level === 'number' ? level : level.toWGSL()}`);

        result3.toGLSL = () => `textureSize(${name3()}${level3()})`;
        result3.toWGSL = () => `textureDimensions(${name3()}${level3()})`;
        result3.dependencies = level === undefined || typeof level === 'number' ? [texture] : [texture, level];

        return result3;
    }

    const result = new Uvec2();

    const nameOf = () => texture.uniform.name;

    // 存储纹理的声明名就是 uniform 名；其余（普通 sampler / 裸纹理）按 Sampler 的展开规则带 _texture 后缀
    const texName = () => (texture instanceof StorageTexture2D ? texture.uniform.name : `${texture.uniform.name}_texture`);
    const levelText = () => (level === undefined ? '' : `, ${typeof level === 'number' ? level : level.toWGSL()}`);

    result.toGLSL = () => `textureSize(${nameOf()}${levelText()})`;
    result.toWGSL = () => `textureDimensions(${texName()}${levelText()})`;
    result.dependencies = level === undefined || typeof level === 'number' ? [texture] : [texture, level];

    return result;
}
