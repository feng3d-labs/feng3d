/**
 * WebGL中Uniform类型对应数值
 */
export class WebGLUniformType
{
    constructor(gl: WebGLRenderingContext)
    {
        uniformTypeWebGL1.forEach((e) =>
        {
            this._cache(e, gl[e]);
        });
        uniformTypeWebGL2.forEach((e) =>
        {
            this._cache(e, gl[e]);
        });
    }

    /**
     * 获取Unifrom类型名称
     *
     * @param value WebGL中Unifrom类型对应的值。
     * @returns Unifrom类型名称
     */
    getType(value: number): keyof WebGLUniformType
    {
        const result = this[value];
        console.assert(!!result);

        return result;
    }

    /**
     * 获取WebGL中Unifrom类型对应的值。
     *
     * @param type Unifrom类型名称
     * @returns WebGL中Unifrom类型对应的值。
     */
    getValue(type: keyof WebGLUniformType): number
    {
        const result = this[type];
        console.assert(!!result);

        return result as any;
    }

    /**
     * 判断是否为纹理Unifrom类型。
     *
     * @param type Unifrom类型名称
     * @returns 是否为纹理Unifrom类型。
     */
    isTexture(type: keyof WebGLUniformType): boolean
    {
        if (samplers.includes(type))
        {
            return true;
        }

        return false;
    }

    private _cache(type: string, value: number)
    {
        console.assert(this[type] === undefined);
        console.assert(this[value] === undefined);
        this[type] = value;
        this[value] = type;
    }
}

const samplers = [
    'SAMPLER_2D',
    'SAMPLER_CUBE',
    'SAMPLER_3D',
    'SAMPLER_2D_SHADOW',
    'SAMPLER_2D_ARRAY',
    'SAMPLER_2D_ARRAY_SHADOW',
    'SAMPLER_CUBE_SHADOW',
    'INT_SAMPLER_2D',
    'INT_SAMPLER_3D',
    'INT_SAMPLER_CUBE',
    'INT_SAMPLER_2D_ARRAY',
    'UNSIGNED_INT_SAMPLER_2D',
    'UNSIGNED_INT_SAMPLER_3D',
    'UNSIGNED_INT_SAMPLER_CUBE',
    'UNSIGNED_INT_SAMPLER_2D_ARRAY',
];

const uniformTypeWebGL1 = [
    'FLOAT',
    'FLOAT_VEC2',
    'FLOAT_VEC3',
    'FLOAT_VEC4',
    'INT',
    'INT_VEC2',
    'INT_VEC3',
    'INT_VEC4',
    'BOOL',
    'BOOL_VEC2',
    'BOOL_VEC3',
    'BOOL_VEC4',
    'FLOAT_MAT2',
    'FLOAT_MAT3',
    'FLOAT_MAT4',
    'SAMPLER_2D',
    'SAMPLER_CUBE',
];

const uniformTypeWebGL2 = [
    'UNSIGNED_INT',
    'UNSIGNED_INT_VEC2',
    'UNSIGNED_INT_VEC3',
    'UNSIGNED_INT_VEC4',
    'FLOAT_MAT2x3',
    'FLOAT_MAT2x4',
    'FLOAT_MAT3x2',
    'FLOAT_MAT3x4',
    'FLOAT_MAT4x2',
    'FLOAT_MAT4x3',
    'SAMPLER_3D',
    'SAMPLER_2D_SHADOW',
    'SAMPLER_2D_ARRAY',
    'SAMPLER_2D_ARRAY_SHADOW',
    'SAMPLER_CUBE_SHADOW',
    'INT_SAMPLER_2D',
    'INT_SAMPLER_3D',
    'INT_SAMPLER_CUBE',
    'INT_SAMPLER_2D_ARRAY',
    'UNSIGNED_INT_SAMPLER_2D',
    'UNSIGNED_INT_SAMPLER_3D',
    'UNSIGNED_INT_SAMPLER_CUBE',
    'UNSIGNED_INT_SAMPLER_2D_ARRAY',
];

export interface WebGLUniformType extends UniformTypeWebGL1 { }
export interface UniformTypeWebGL1
{
    FLOAT: number;
    FLOAT_VEC2: number;
    FLOAT_VEC3: number;
    FLOAT_VEC4: number;
    INT: number;
    INT_VEC2: number;
    INT_VEC3: number;
    INT_VEC4: number;
    BOOL: number;
    BOOL_VEC2: number;
    BOOL_VEC3: number;
    BOOL_VEC4: number;
    FLOAT_MAT2: number;
    FLOAT_MAT3: number;
    FLOAT_MAT4: number;
    SAMPLER_2D: number;
    SAMPLER_CUBE: number;
}

export interface WebGLUniformType extends UniformTypeWebGL2 { }
export interface UniformTypeWebGL2
{
    UNSIGNED_INT: number;
    UNSIGNED_INT_VEC2: number;
    UNSIGNED_INT_VEC3: number;
    UNSIGNED_INT_VEC4: number;
    FLOAT_MAT2x3: number;
    FLOAT_MAT2x4: number;
    FLOAT_MAT3x2: number;
    FLOAT_MAT3x4: number;
    FLOAT_MAT4x2: number;
    FLOAT_MAT4x3: number;
    SAMPLER_3D: number;
    SAMPLER_2D_SHADOW: number;
    SAMPLER_2D_ARRAY: number;
    SAMPLER_2D_ARRAY_SHADOW: number;
    SAMPLER_CUBE_SHADOW: number;
    INT_SAMPLER_2D: number;
    INT_SAMPLER_3D: number;
    INT_SAMPLER_CUBE: number;
    INT_SAMPLER_2D_ARRAY: number;
    UNSIGNED_INT_SAMPLER_2D: number;
    UNSIGNED_INT_SAMPLER_3D: number;
    UNSIGNED_INT_SAMPLER_CUBE: number;
    UNSIGNED_INT_SAMPLER_2D_ARRAY: number;
}
