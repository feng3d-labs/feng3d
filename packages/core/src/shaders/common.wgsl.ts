/**
 * 通用 WGSL 工具函数
 */

/**
 * 通用 WGSL 代码
 */
export const commonWGSL = `
// 数学常量
const PI: f32 = 3.14159265359;
const TWO_PI: f32 = 6.28318530718;
const HALF_PI: f32 = 1.57079632679;
const INV_PI: f32 = 0.31830988618;
const INV_TWO_PI: f32 = 0.15915494309;

// 数学函数
fn saturate(x: f32) -> f32 {
    return clamp(x, 0.0, 1.0);
}

fn pow2(x: f32) -> f32 {
    return x * x;
}

fn pow3(x: f32) -> f32 {
    return x * x * x;
}

fn pow4(x: f32) -> f32 {
    let x2 = x * x;
    return x2 * x2;
}

fn pow5(x: f32) -> f32 {
    let x2 = x * x;
    return x2 * x2 * x;
}

// 向量运算
fn normalizeSafe(v: vec3<f32>) -> vec3<f32> {
    let len = length(v);
    if (len > 0.0001) {
        return v / len;
    }
    return vec3<f32>(0.0, 0.0, 0.0);
}

fn max3(a: f32, b: f32, c: f32) -> f32 {
    return max(max(a, b), c);
}

fn min3(a: f32, b: f32, c: f32) -> f32 {
    return min(min(a, b), c);
}

// 矩阵运算
fn transpose3x3(m: mat3x3<f32>) -> mat3x3<f32> {
    return mat3x3<f32>(
        vec3<f32>(m[0][0], m[1][0], m[2][0]),
        vec3<f32>(m[0][1], m[1][1], m[2][1]),
        vec3<f32>(m[0][2], m[1][2], m[2][2])
    );
}

// 颜色转换
fn linearToSRGB(c: vec3<f32>) -> vec3<f32> {
    return pow(c, vec3<f32>(0.4166666666666667));
}

fn sRGBToLinear(c: vec3<f32>) -> vec3<f32> {
    return pow(c, vec3<f32>(2.2));
}

// 法线计算
fn perturbNormal(normal: vec3<f32>, tangent: vec3<f32>, bitangent: vec3<f32>, mapNormal: vec3<f32>) -> vec3<f32> {
    let TBN = mat3x3<f32>(tangent, bitangent, normal);
    return normalize(TBN * (mapNormal * 2.0 - vec3<f32>(1.0)));
}

fn perturbNormalArbitrary(normal: vec3<f32>, dp1: vec3<f32>, dp2: vec3<f32>, uv1: vec2<f32>, uv2: vec2<f32>, mapNormal: vec3<f32>) -> vec3<f32> {
    let dpdu = dp1 * uv2.y - dp2 * uv1.y;
    let dpdv = dp2 * uv1.x - dp1 * uv2.x;
    let tangent = normalize(dpdu);
    let bitangent = cross(normal, tangent);
    let TBN = mat3x3<f32>(tangent, bitangent, normal);
    return normalize(TBN * (mapNormal * 2.0 - vec3<f32>(1.0)));
}

// 基础结构体
struct Transform {
    modelMatrix: mat4x4<f32>,
    viewMatrix: mat4x4<f32>,
    projectionMatrix: mat4x4<f32>,
    modelViewMatrix: mat4x4<f32>,
    viewProjectionMatrix: mat4x4<f32>,
    modelViewProjectionMatrix: mat4x4<f32>,
    normalMatrix: mat3x3<f32>,
}

struct CameraInfo {
    position: vec3<f32>,
    near: f32,
    far: f32,
}

struct LightInfo {
    position: vec3<f32>,
    direction: vec3<f32>,
    color: vec3<f32>,
    intensity: f32,
    range: f32,
    type: u32,
}
`;

/**
 * 通用 WGSL 导出
 */
export default commonWGSL;