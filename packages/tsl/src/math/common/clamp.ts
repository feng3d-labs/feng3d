import { formatNumber } from '../../core/formatNumber';
import { Float } from '../../types/scalar/float';
import { Vec2 } from '../../types/vector/vec2';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';

/**
 * clamp 函数，将值限制在范围内
 */
export function clamp(a: Vec2, min: Vec2, max: Vec2): Vec2;
export function clamp(a: Vec2, min: number, max: number): Vec2;
export function clamp(a: Vec2, min: Vec2, max: number): Vec2;
export function clamp(a: Vec2, min: number, max: Vec2): Vec2;
export function clamp(a: Vec3, min: Vec3, max: Vec3): Vec3;
export function clamp(a: Vec3, min: number, max: number): Vec3;
export function clamp(a: Vec3, min: Vec3, max: number): Vec3;
export function clamp(a: Vec3, min: number, max: Vec3): Vec3;
export function clamp(a: Vec4, min: Vec4, max: Vec4): Vec4;
export function clamp(a: Vec4, min: number, max: number): Vec4;
export function clamp(a: Vec4, min: Vec4, max: number): Vec4;
export function clamp(a: Vec4, min: number, max: Vec4): Vec4;
export function clamp(a: Float | number, min: Float | number, max: Float | number): Float;
export function clamp(a: Float | Vec2 | Vec3 | Vec4 | number, min: Float | Vec2 | Vec3 | Vec4 | number, max: Float | Vec2 | Vec3 | Vec4 | number): Float | Vec2 | Vec3 | Vec4
{
    if (a instanceof Vec2)
    {
        const result = new Vec2();
        result.toGLSL = () => `clamp(${a.toGLSL()}, ${min instanceof Vec2 ? min.toGLSL() : (typeof min === 'number' ? formatNumber(min) : min.toGLSL())}, ${max instanceof Vec2 ? max.toGLSL() : (typeof max === 'number' ? formatNumber(max) : max.toGLSL())})`;
        // WGSL 不支持 clamp(vec2, float, float)，需要转换为 clamp(vec2, vec2(float), vec2(float))
        result.toWGSL = () => `clamp(${a.toWGSL()}, ${min instanceof Vec2 ? min.toWGSL() : `vec2<f32>(${typeof min === 'number' ? formatNumber(min) : min.toWGSL()})`}, ${max instanceof Vec2 ? max.toWGSL() : `vec2<f32>(${typeof max === 'number' ? formatNumber(max) : max.toWGSL()})`})`;
        result.dependencies = [a];
        if (min instanceof Vec2 || min instanceof Float) result.dependencies.push(min);
        if (max instanceof Vec2 || max instanceof Float) result.dependencies.push(max);

        return result;
    }
    if (a instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = () => `clamp(${a.toGLSL()}, ${min instanceof Vec3 ? min.toGLSL() : (typeof min === 'number' ? formatNumber(min) : min.toGLSL())}, ${max instanceof Vec3 ? max.toGLSL() : (typeof max === 'number' ? formatNumber(max) : max.toGLSL())})`;
        // WGSL 不支持 clamp(vec3, float, float)，需要转换为 clamp(vec3, vec3(float), vec3(float))
        result.toWGSL = () => `clamp(${a.toWGSL()}, ${min instanceof Vec3 ? min.toWGSL() : `vec3<f32>(${typeof min === 'number' ? formatNumber(min) : min.toWGSL()})`}, ${max instanceof Vec3 ? max.toWGSL() : `vec3<f32>(${typeof max === 'number' ? formatNumber(max) : max.toWGSL()})`})`;
        result.dependencies = [a];
        if (min instanceof Vec3 || min instanceof Float) result.dependencies.push(min);
        if (max instanceof Vec3 || max instanceof Float) result.dependencies.push(max);

        return result;
    }
    if (a instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = () => `clamp(${a.toGLSL()}, ${min instanceof Vec4 ? min.toGLSL() : (typeof min === 'number' ? formatNumber(min) : min.toGLSL())}, ${max instanceof Vec4 ? max.toGLSL() : (typeof max === 'number' ? formatNumber(max) : max.toGLSL())})`;
        // WGSL 不支持 clamp(vec4, float, float)，需要转换为 clamp(vec4, vec4(float), vec4(float))
        result.toWGSL = () => `clamp(${a.toWGSL()}, ${min instanceof Vec4 ? min.toWGSL() : `vec4<f32>(${typeof min === 'number' ? formatNumber(min) : min.toWGSL()})`}, ${max instanceof Vec4 ? max.toWGSL() : `vec4<f32>(${typeof max === 'number' ? formatNumber(max) : max.toWGSL()})`})`;
        result.dependencies = [a];
        if (min instanceof Vec4 || min instanceof Float) result.dependencies.push(min);
        if (max instanceof Vec4 || max instanceof Float) result.dependencies.push(max);

        return result;
    }
    const result = new Float();
    result.toGLSL = () => `clamp(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toGLSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toGLSL()})`;
    result.toWGSL = () => `clamp(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toWGSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toWGSL()})`;
    result.dependencies = [];
    if (a instanceof Float) result.dependencies.push(a);
    if (min instanceof Float) result.dependencies.push(min);
    if (max instanceof Float) result.dependencies.push(max);

    return result;
}

