import { Texture2D } from '../../textures/Texture2D';
import { TextureCube } from '../../textures/TextureCube';

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

export type Mat3 = [
    number, number, number,
    number, number, number,
    number, number, number,
];

export type Mat4 = [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
];

/**
 * Uniform 类型映射
 *
 * 用于扩展 Uniform 支持的类型
 */
export interface UniformTypeMap
{
    float: number;
    int: number;
    vec2: Vec2;
    vec3: Vec3;
    vec4: Vec4;
    mat3: Mat3;
    mat4: Mat4;
    texture2D: Texture2D;
    textureCube: TextureCube;

    floatArray: number[];
    intArray: number[];
    vec2Array: Vec2[];
    vec3Array: Vec3[];
    vec4Array: Vec4[];
    mat3Array: Mat3[];
    mat4Array: Mat4[];

    texture2DArray: Texture2D[];
}

/**
 * Uniform 类型
 */
export type UniformType = UniformTypeMap[keyof UniformTypeMap];

/**
 * Uniform 数据
 */
export interface Uniforms
{
    [key: string]: UniformType;
}
