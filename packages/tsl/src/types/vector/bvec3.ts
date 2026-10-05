import { IElement, ShaderValue } from '../../core/IElement';

/**
 * BVec3 类，用于表示 bvec3 类型（布尔向量）
 * @internal 库外部不应直接使用 `new BVec3()`，应使用 `bvec3()` 函数
 */
export class BVec3 implements ShaderValue
{
    readonly glslType = 'bvec3';
    readonly wgslType = 'vec3<bool>';
    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor()
    {
        this.dependencies = [];
    }
}

/**
 * bvec3 构造函数
 */
export function bvec3(): BVec3
{
    return new BVec3();
}

