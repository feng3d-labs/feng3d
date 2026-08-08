import { Light, lightLogic } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic } from "@feng3d/reactivity";
import { Box3, Matrix4x4, Vector3 } from '@feng3d/math';
import type { Camera } from '../cameras/Camera';
import type { Renderable } from '../core/Renderable';
import type { Scene } from '../scene/Scene';
import type { Texture } from '@feng3d/webgpu';
import type { LightLogic } from './Light';

import './DirectionalLight';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        DirectionalLight: DirectionalLight;
    }
}

/**
 * DirectionalLight（纯数据接口）。
 */
export interface DirectionalLight extends Light
{
    readonly __type__: 'DirectionalLight';
    readonly lightType: LightType.Directional;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        DirectionalLight: DirectionalLightLogic;
    }
}

/**
 * DirectionalLight 逻辑处理接口。
 *
 * 组合 LightLogic，额外提供：
 * - shadowDepthTexture：方向光阴影深度纹理（depth24plus，depth-only Pass 写入 + 主 Pass 采样）
 * - updateShadowByCamera：根据场景包围盒算出阴影 viewProjection 矩阵（直接拼矩阵，不再经过 Camera/lens）
 * - debugShadowTexture：返回 shadowDepthTexture 供 debug 平面材质使用
 */
export interface DirectionalLightLogic extends LightLogic
{
    /** 方向光阴影深度纹理，懒创建（尺寸 1024×1024 depth24plus） */
    get shadowDepthTexture(): Texture;
    /**
     * 根据场景投射阴影物体的包围盒，算出阴影 viewProjection 矩阵。
     */
    updateShadowByCamera(scene: Scene, viewCamera: Camera, models: Renderable[]): void;
}

/**
 * 创建 DirectionalLightLogic 实例（工厂函数，组合 lightLogic 基础行为）。
 */
export function directionalLightLogic(light: DirectionalLight): DirectionalLightLogic
{
    const base = lightLogic(light);

    /**
     * 方向光阴影深度纹理（depth24plus）。
     *
     * 既作为阴影 Pass 的 depthStencilAttachment（深度由光栅化写入），
     * 又作为主渲染 Pass 的采样纹理（片元着色器用 texture_depth_2d +
     * sampler_comparison 比较采样，硬件 PCF）。
     * 替代旧的 rgba8unorm + packDepthToRGBA 编码方案。
     */
    let _shadowDepthTexture: Texture | null = null;

    /** 懒创建并返回方向光阴影深度纹理 */
    function getShadowDepthTexture(): Texture
    {
        if (!_shadowDepthTexture)
        {
            const size = base.shadowMapSize;
            // 直接用 webgpu 的 Texture 接口构造纯数据对象（无 __type__ 要求），
            // 与 PointLight 的 depth cubemap 同范式。
            _shadowDepthTexture = {
                descriptor: {
                    label: 'DirectionalLightShadowDepth',
                    size: [size.x, size.y, 1],
                    format: 'depth32float',
                },
            } as Texture;
        }

        return _shadowDepthTexture;
    }

    // 用 defineProperties 定义访问器（Object.assign 会调用 getter 一次后存为静态值，故不能用于访问器）
    Object.defineProperties(base, {
        /** 方向光阴影深度纹理，懒创建（尺寸 1024×1024 depth24plus） */
        shadowDepthTexture: {
            get(): Texture { return getShadowDepthTexture(); },
            enumerable: true,
            configurable: true,
        },
        debugShadowTexture: {
            get(): Texture | null { return getShadowDepthTexture(); },
            enumerable: true,
            configurable: true,
        },
    });

    /**
     * 根据场景投射阴影物体的包围盒，算出阴影 viewProjection 矩阵。
     *
     * 完全照搬 packages/webgpu/examples/src/webgpu/shadowMapping/index.ts 的算法：
     * - 用 wgpu-matrix 风格的 mat4.lookAt / mat4.ortho / mat4.multiply 构建 VP
     * - ortho 把 z 映射到 [0,1]（WebGPU 风格，与 OpenGL 的 [-1,1] 不同）
     * - lookAt 是右手系，相机看向 -Z（与 feng3d Matrix4x4.lookAt 的 +Z 约定相反）
     *
     * WGSL 端配合：shadowPos.z 不做 *0.5+0.5（已与 depth buffer 同空间 [0,1]）。
     * 结果写入 `shadowViewProjection`，ShadowRenderer 与 ForwardRenderer 读取。
     */
    (base as unknown as DirectionalLightLogic).updateShadowByCamera = function (scene: Scene, viewCamera: Camera, models: Renderable[]): void
    {
        // 1. 计算所有相关物体（投射 + 接收阴影）的世界包围盒
        const worldBounds: Box3 = models.reduce((pre: Box3, i) =>
        {
            const box = getLogic(getLogic(i).entity).boundingBox.worldBounds;
            if (!pre)
            {
                return box.clone();
            }
            pre.union(box);

            return pre;
        }, null) || new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

        // 2. 光源位置：沿光源反方向退到包围盒外足够远处，朝向包围盒中心
        const center = worldBounds.getCenter(new Vector3());
        const lightDir = base.direction; // 光源方向（世界空间单位向量）
        // 包围盒尺寸，用于决定相机后退距离与正交视锥大小
        const sizeVec = worldBounds.max.subTo(worldBounds.min);
        const radius = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
        const distance = radius * 2 + 5; // 后退距离，确保整个场景在视锥内
        const lightPosition = center.addTo(lightDir.clone().scaleNumber(-distance));

        // 3. wgpu-matrix 风格 view/projection 矩阵
        const upVector = Math.abs(lightDir.y) > 0.99
            ? vec3FromValues(1, 0, 0)
            : vec3FromValues(0, 1, 0);

        const lightViewMatrix = mat4LookAt(
            vec3FromValues(lightPosition.x, lightPosition.y, lightPosition.z),
            vec3FromValues(center.x, center.y, center.z),
            upVector,
        );

        // 用包围盒在光源空间的范围做正交视锥（left/right/bottom/top）
        // 把世界包围盒 8 角点用 lightViewMatrix 投影到光源空间，求 x/y 范围与 z 范围
        const corners: number[][] = [];
        for (let i = 0; i < 8; i++)
        {
            const wx = (i & 1) ? worldBounds.max.x : worldBounds.min.x;
            const wy = (i & 2) ? worldBounds.max.y : worldBounds.min.y;
            const wz = (i & 4) ? worldBounds.max.z : worldBounds.min.z;
            corners.push(mat4TransformPoint(lightViewMatrix, [wx, wy, wz]));
        }
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        for (const c of corners)
        {
            if (c[0] < minX) minX = c[0]; if (c[0] > maxX) maxX = c[0];
            if (c[1] < minY) minY = c[1]; if (c[1] > maxY) maxY = c[1];
            if (c[2] < minZ) minZ = c[2]; if (c[2] > maxZ) maxZ = c[2];
        }
        // 加 margin 确保边缘不被裁剪
        const MARGIN = 1;
        const left = minX - MARGIN;
        const right = maxX + MARGIN;
        const bottom = minY - MARGIN;
        const top = maxY + MARGIN;
        // near/far 用光源空间 z 范围。wgpu-matrix lookAt：z 轴 = normalize(eye-target)，
        // 相机看 -Z，物体在 -Z 方向故光源空间 z 为负。near = 距最近物体距离 (|maxZ|)，
        // far = 距最远物体距离 (|minZ|)。
        const near = Math.max(0.1, -maxZ);
        const far = Math.max(near + 1, -minZ + MARGIN);

        const lightProjectionMatrix = mat4Ortho(left, right, bottom, top, near, far);
        const lightViewProjMatrix = mat4Multiply(lightProjectionMatrix, lightViewMatrix);

        // 写入 shadowViewProjection（转为 feng3d Matrix4x4，列主序 Float32Array 兼容）
        const m = new Matrix4x4();
        for (let i = 0; i < 16; i++) m.elements[i] = lightViewProjMatrix[i];
        base.updateShadowParams(m, near, far);
    };

    return base as unknown as DirectionalLightLogic;
}

// ============================================================================
// wgpu-matrix 风格 mat4 工具函数（WebGPU 约定：z→[0,1]，列主序，右手 lookAt 看 -Z）
//
// 与 packages/webgpu/examples/src/webgpu/shadowMapping/index.ts 使用的 wgpu-matrix
// 库完全等价，确保阴影 VP 矩阵与参考实现一致。feng3d 的 Matrix4x4 用 OpenGL 约定
// （z→[-1,1]，lookAt 看 +Z），不能直接用于阴影（WebGPU depth buffer 是 [0,1]）。
// ============================================================================

type Vec3 = [number, number, number];
type Mat4 = Float32Array;

function vec3FromValues(x: number, y: number, z: number): Vec3
{
    return [x, y, z];
}

/** wgpu-matrix 风格 vec3 操作 */
function vec3Normalize(v: Vec3): Vec3
{
    const len = Math.hypot(v[0], v[1], v[2]);
    const inv = len > 0 ? 1 / len : 0;

    return [v[0] * inv, v[1] * inv, v[2] * inv];
}

function vec3Cross(a: Vec3, b: Vec3): Vec3
{
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
}

function vec3Sub(a: Vec3, b: Vec3): Vec3
{
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vec3Dot(a: Vec3, b: Vec3): number
{
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * wgpu-matrix 风格 lookAt（右手系，相机看 -Z）。
 *
 * zAxis = normalize(eye - target)（相机朝向的反向，即相机本地 +Z）
 * xAxis = normalize(cross(up, zAxis))
 * yAxis = cross(zAxis, xAxis)
 *
 * 返回列主序 mat4，相机变换（world→camera），平移 = -dot(axis, eye)。
 */
function mat4LookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4
{
    const zAxis = vec3Normalize(vec3Sub(eye, target));
    let xAxis = vec3Normalize(vec3Cross(up, zAxis));
    if (vec3Dot(xAxis, xAxis) < 1e-6)
    {
        // up 与 zAxis 平行退化，改用备用 up
        xAxis = vec3Normalize(vec3Cross([1, 0, 0], zAxis));
    }
    const yAxis = vec3Cross(zAxis, xAxis);

    // 列主序：列 0 = xAxis, 列 1 = yAxis, 列 2 = zAxis, 列 3 = -dot·eye
    return new Float32Array([
        xAxis[0], xAxis[1], xAxis[2], 0,
        yAxis[0], yAxis[1], yAxis[2], 0,
        zAxis[0], zAxis[1], zAxis[2], 0,
        -vec3Dot(xAxis, eye), -vec3Dot(yAxis, eye), -vec3Dot(zAxis, eye), 1,
    ]);
}

/**
 * wgpu-matrix 风格 ortho（WebGPU 约定，z→[0,1]）。
 *
 * 与 OpenGL 的 setOrtho（z→[-1,1]）区别：
 *   m[10] = 1 / (near - far) = -1 / (far - near)
 *   m[14] = -near / (near - far) = near / (far - near)
 * 其余与 OpenGL 一致。
 */
function mat4Ortho(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4
{
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);

    return new Float32Array([
        -2 * lr, 0, 0, 0,
        0, -2 * bt, 0, 0,
        0, 0, nf, 0,
        (left + right) * lr, (top + bottom) * bt, near * nf, 1,
    ]);
}

/** wgpu-matrix 风格 mat4.multiply(a, b) = a × b（列主序：列 0 = elements[0..3]） */
function mat4Multiply(a: Mat4, b: Mat4): Mat4
{
    const dst = new Float32Array(16);
    // result 的第 j 列 = A × (B 的第 j 列)
    for (let j = 0; j < 4; j++)
    {
        const bj0 = b[j * 4 + 0];
        const bj1 = b[j * 4 + 1];
        const bj2 = b[j * 4 + 2];
        const bj3 = b[j * 4 + 3];
        dst[j * 4 + 0] = a[0] * bj0 + a[4] * bj1 + a[8] * bj2 + a[12] * bj3;
        dst[j * 4 + 1] = a[1] * bj0 + a[5] * bj1 + a[9] * bj2 + a[13] * bj3;
        dst[j * 4 + 2] = a[2] * bj0 + a[6] * bj1 + a[10] * bj2 + a[14] * bj3;
        dst[j * 4 + 3] = a[3] * bj0 + a[7] * bj1 + a[11] * bj2 + a[15] * bj3;
    }

    return dst;
}

/** wgpu-matrix 风格 mat4 变换点（齐次坐标 w=1） */
function mat4TransformPoint(m: Mat4, p: [number, number, number]): number[]
{
    const v0 = p[0], v1 = p[1], v2 = p[2];
    const d0 = m[0] * v0 + m[4] * v1 + m[8] * v2 + m[12];
    const d1 = m[1] * v0 + m[5] * v1 + m[9] * v2 + m[13];
    const d2 = m[2] * v0 + m[6] * v1 + m[10] * v2 + m[14];
    const d3 = m[3] * v0 + m[7] * v1 + m[11] * v2 + m[15];

    return d3 !== 1 ? [d0 / d3, d1 / d3, d2 / d3] : [d0, d1, d2];
}

/** wgpu-matrix 风格 mat4 变换 vec4（返回 [x,y,z,w]） */
function mat4TransformPoint4(m: Mat4, p: [number, number, number]): number[]
{
    const v0 = p[0], v1 = p[1], v2 = p[2];
    const d0 = m[0] * v0 + m[4] * v1 + m[8] * v2 + m[12];
    const d1 = m[1] * v0 + m[5] * v1 + m[9] * v2 + m[13];
    const d2 = m[2] * v0 + m[6] * v1 + m[10] * v2 + m[14];
    const d3 = m[3] * v0 + m[7] * v1 + m[11] * v2 + m[15];

    return [d0, d1, d2, d3];
}

// 注册到 componentLogic 分发表
registerLogic('DirectionalLight', directionalLightLogic);
