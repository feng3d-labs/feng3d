/**
 * WebGL中Uniform类型
 */
export type WebGLUniformType = keyof typeof webGLUniformType;

/**
 * WebGL中Uniform类型对应数值
 */
export class WebGLUniformTypeUtils
{
    /**
     * 获取Unifrom类型名称
     *
     * @param value WebGL中Unifrom类型对应的值。
     * @returns Unifrom类型名称
     */
    static getType(value: number)
    {
        if (!this._cache)
        {
            this._cache = [];
            Object.keys(webGLUniformType).forEach((v) =>
            {
                this._cache[webGLUniformType[v]] = v;
            });
        }

        const result = this._cache[value] as WebGLUniformType;
        console.assert(!!result);

        return result;
    }

    /**
     * 获取WebGL中Unifrom类型对应的值。
     *
     * @param type Unifrom类型名称
     * @returns WebGL中Unifrom类型对应的值。
     */
    static getValue(type: WebGLUniformType): number
    {
        const result = webGLUniformType[type];
        console.assert(!!result);

        return result as any;
    }

    /**
     * 判断是否为纹理Unifrom类型。
     *
     * @param type Unifrom类型名称
     * @returns 是否为纹理Unifrom类型。
     */
    static isTexture(type: WebGLUniformType): boolean
    {
        return samplers[type] !== undefined;
    }

    private static _cache: string[];
}

const samplers = { SAMPLER_2D: 35678, SAMPLER_CUBE: 35680, SAMPLER_3D: 35679, SAMPLER_2D_SHADOW: 35682, SAMPLER_2D_ARRAY: 36289, SAMPLER_2D_ARRAY_SHADOW: 36292, SAMPLER_CUBE_SHADOW: 36293, INT_SAMPLER_2D: 36298, INT_SAMPLER_3D: 36299, INT_SAMPLER_CUBE: 36300, INT_SAMPLER_2D_ARRAY: 36303, UNSIGNED_INT_SAMPLER_2D: 36306, UNSIGNED_INT_SAMPLER_3D: 36307, UNSIGNED_INT_SAMPLER_CUBE: 36308, UNSIGNED_INT_SAMPLER_2D_ARRAY: 36311 };
const webGL1UniformType = { FLOAT: 5126, FLOAT_VEC2: 35664, FLOAT_VEC3: 35665, FLOAT_VEC4: 35666, INT: 5124, INT_VEC2: 35667, INT_VEC3: 35668, INT_VEC4: 35669, BOOL: 35670, BOOL_VEC2: 35671, BOOL_VEC3: 35672, BOOL_VEC4: 35673, FLOAT_MAT2: 35674, FLOAT_MAT3: 35675, FLOAT_MAT4: 35676, SAMPLER_2D: 35678, SAMPLER_CUBE: 35680 };
const webGL2UniformType = { UNSIGNED_INT: 5125, UNSIGNED_INT_VEC2: 36294, UNSIGNED_INT_VEC3: 36295, UNSIGNED_INT_VEC4: 36296, FLOAT_MAT2x3: 35685, FLOAT_MAT2x4: 35686, FLOAT_MAT3x2: 35687, FLOAT_MAT3x4: 35688, FLOAT_MAT4x2: 35689, FLOAT_MAT4x3: 35690, SAMPLER_3D: 35679, SAMPLER_2D_SHADOW: 35682, SAMPLER_2D_ARRAY: 36289, SAMPLER_2D_ARRAY_SHADOW: 36292, SAMPLER_CUBE_SHADOW: 36293, INT_SAMPLER_2D: 36298, INT_SAMPLER_3D: 36299, INT_SAMPLER_CUBE: 36300, INT_SAMPLER_2D_ARRAY: 36303, UNSIGNED_INT_SAMPLER_2D: 36306, UNSIGNED_INT_SAMPLER_3D: 36307, UNSIGNED_INT_SAMPLER_CUBE: 36308, UNSIGNED_INT_SAMPLER_2D_ARRAY: 36311 };
const webGLUniformType = Object.assign({}, webGL1UniformType, webGL2UniformType);
