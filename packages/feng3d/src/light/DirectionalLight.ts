import { box3Clone, box3GetCenter, box3Union } from '@feng3d/math';
// `vec3Sub` 与本文件里 wgpu-matrix 风格的本地 `vec3Sub(a: Vec3, b: Vec3)` 同名，导入时起别名
import { Box3, Matrix4x4, Vector2, Vector2Like, vec3Add, vec3ScaleNumber, vec3Sub as mathVec3Sub } from '@feng3d/math';
import { logic as getLogic, reactive, registerLogic } from '@feng3d/reactivity';
import type { Texture } from '@feng3d/webgpu';
import { Camera } from '../cameras/Camera';
import { Light, LightLogic, createLightLogicBase } from './Light';
import type { Renderable } from '../core/Renderable';
import type { Scene } from '../scene/Scene';

declare module './Light'
{
    export interface LightMap
    {
        DirectionalLight: DirectionalLight;
    }
}

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
    readonly scutoff?: number;

    /**
     * 阴影视锥左边界（光源空间 x，对应 three.js 的 `shadow.camera.left`）。
     *
     * 六个 `shadowCamera*` 字段中任意一个被提供时进入**显式模式**：视点取光源的世界坐标
     * （与 three.js 的 `shadow.camera.position.copy(light.position)` 一致），
     * 未提供的边界仍按场景包围盒自动计算。全部缺省时保持原有"按包围盒自动算"的行为。
     */
    readonly shadowCameraLeft?: number;

    /** 阴影视锥右边界（光源空间 x），语义见 {@link DirectionalLight.shadowCameraLeft} */
    readonly shadowCameraRight?: number;

    /** 阴影视锥上边界（光源空间 y），语义见 {@link DirectionalLight.shadowCameraLeft} */
    readonly shadowCameraTop?: number;

    /** 阴影视锥下边界（光源空间 y），语义见 {@link DirectionalLight.shadowCameraLeft} */
    readonly shadowCameraBottom?: number;

    /** 阴影相机近平面（沿光方向到光源的距离），语义见 {@link DirectionalLight.shadowCameraLeft} */
    readonly shadowCameraNear?: number;

    /** 阴影相机远平面（沿光方向到光源的距离），语义见 {@link DirectionalLight.shadowCameraLeft} */
    readonly shadowCameraFar?: number;

    /** 阴影贴图尺寸（宽 × 高，像素，对应 three.js 的 `shadow.mapSize`）。缺省 1024×1024 */
    readonly shadowMapSize?: Vector2Like;
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
 * 继承 LightLogic，额外提供：
 * - shadowDepthTexture：方向光阴影深度纹理（depth24plus，depth-only Pass 写入 + 主 Pass 采样）
 * - updateShadowByCamera：根据场景包围盒算出阴影 viewProjection 矩阵（直接拼矩阵，不再经过 Camera/lens）
 * - debugShadowTexture：返回 shadowDepthTexture 供 debug 平面材质使用
 */
export interface DirectionalLightLogic extends LightLogic
{
    /** 方向光阴影深度纹理，懒创建（默认尺寸 1024×1024 depth32float） */
    readonly shadowDepthTexture: Texture;

    /**
     * 根据场景投射阴影物体的包围盒，算出阴影 viewProjection 矩阵。
     */
    updateShadowByCamera(scene: Scene, viewCamera: Camera, models: Renderable[]): void;
}

/**
 * 工厂函数：DirectionalLightLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 灯光数据（raw）
 */
export function directionalLightLogic(data: DirectionalLight): DirectionalLightLogic
{
    const { members } = createLightLogicBase(data);

    /** 方向光阴影深度纹理（depth32float，懒创建） */
    let shadowDepthTexture: Texture | null = null;
    /** shadowDepthTexture 对应的尺寸 key：尺寸变化时重建纹理 */
    let shadowDepthTextureKey = '';
    /** shadowMapSize 的稳定缓存（同尺寸复用同一对象，避免每帧产生新引用） */
    let shadowMapSizeCache: Vector2 | null = null;

    /**
     * 阴影贴图尺寸：数据侧 `shadowMapSize` 优先，缺省 1024×1024。
     *
     * 经响应式代理读，尺寸变化时依赖它的 computed（阴影 Pass / uniform 组装）自动失效。
     */
    const getShadowMapSize = (): Vector2 =>
    {
        const size = reactive(data).shadowMapSize;
        const x = size?.x ?? 1024;
        const y = size?.y ?? 1024;
        if (!shadowMapSizeCache || shadowMapSizeCache.x !== x || shadowMapSizeCache.y !== y)
        {
            shadowMapSizeCache = { x, y } as Vector2;
        }

        return shadowMapSizeCache;
    };

    const logic: DirectionalLightLogic = {
        // ---- Light / Behaviour / Component 基类成员（显式委托基座 members）----
        /** 关联的组件数据（raw） */
        get component() { return members.component; },
        /** 所属 Object3D */
        get entity() { return members.entity; },
        /** 是否可见且启用 */
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        /** 初始化：注入所属 Object3D（幂等） */
        init(object3D) { members.init(object3D); },
        /** 渲染前回调（默认空） */
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        /** 每帧更新（默认空，子类覆盖） */
        update(interval) { members.update(interval); },
        /** 是否加载完成 */
        get isLoaded() { return members.isLoaded; },
        /** 释放 */
        dispose() { members.dispose(); },
        /** 阴影 view-projection 矩阵 */
        get shadowViewProjection() { return members.shadowViewProjection; },
        /** 阴影相机近平面 */
        get shadowNear() { return members.shadowNear; },
        /** 阴影相机远平面 */
        get shadowFar() { return members.shadowFar; },
        /** 更新阴影参数（供子类的 updateShadowXxx 方法调用） */
        updateShadowParams(viewProjection, near, far) { members.updateShadowParams(viewProjection, near, far); },
        /** 光源世界坐标（由 object3D 的 worldPosition 派生） */
        get position() { return members.position; },
        /** 光源方向（object3D 的 local2world Z 轴取反） */
        get direction() { return members.direction; },
        /** 阴影相机近平面（供 shader uniform） */
        get shadowCameraNear() { return members.shadowCameraNear; },
        /** 阴影相机远平面（供 shader uniform） */
        get shadowCameraFar() { return members.shadowCameraFar; },
        /** 阴影图尺寸（默认 1024×1024；数据侧 `shadowMapSize` 可覆盖） */
        get shadowMapSize() { return getShadowMapSize(); },
        /** 阴影采样纹理（DirectionalLight 用 shadowDepthTexture） */
        get shadowMap() { return members.shadowMap; },

        // ---- DirectionalLight 自身成员 ----
        /** 方向光阴影深度纹理，懒创建（默认 1024×1024 depth32float；尺寸随 `shadowMapSize` 变化重建） */
        get shadowDepthTexture(): Texture
        {
            const size = getShadowMapSize();
            const key = `${size.x}x${size.y}`;
            if (!shadowDepthTexture || key !== shadowDepthTextureKey)
            {
                shadowDepthTextureKey = key;
                // 直接用 webgpu 的 Texture 接口构造纯数据对象（无 __type__ 要求），
                // 与 PointLight 的 depth cubemap 同范式。
                shadowDepthTexture = {
                    descriptor: {
                        label: 'DirectionalLightShadowDepth',
                        size: [size.x, size.y, 1],
                        format: 'depth32float',
                    },
                } as Texture;
            }

            return shadowDepthTexture;
        },
        /** 调试阴影图用的纹理：返回 shadowDepthTexture */
        get debugShadowTexture(): Texture | null
        {
            return logic.shadowDepthTexture;
        },
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
        updateShadowByCamera(scene, viewCamera, models)
        {
            void scene;
            void viewCamera;
            // 1. 计算所有相关物体（投射 + 接收阴影）的世界包围盒
            // 阶段 C-e：`Box3` 的 class 已删除，兜底值显式标注为 `Box3`（否则字面量的 `__type__` 会被推断成 string）
            const fallbackBounds: Box3 = { __type__: 'Box3', min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };
            const worldBounds: Box3 = models.reduce((pre: Box3, i) =>
            {
                const box = getLogic(getLogic(i).entity).boundingBox.worldBounds;
                if (!pre)
                {
                    const first: Box3 = { __type__: 'Box3', ...box3Clone(box) };

                    return first;
                }
                box3Union(pre, box, pre);

                return pre;
            }, null) || fallbackBounds;

            // 2. 视点位置
            //    显式配置阴影视锥时用光源的世界坐标（对齐 three.js 的
            //    `shadow.camera.position.copy(light.position)`）；
            //    否则沿光源反方向退到包围盒外足够远处（原有默认行为）。
            const center = box3GetCenter(worldBounds, { x: 0, y: 0, z: 0 });
            const lightDir = members.direction; // 光源方向（世界空间单位向量）
            const r_data = reactive(data);
            const hasExplicitFrustum = r_data.shadowCameraLeft !== undefined
                || r_data.shadowCameraRight !== undefined
                || r_data.shadowCameraTop !== undefined
                || r_data.shadowCameraBottom !== undefined
                || r_data.shadowCameraNear !== undefined
                || r_data.shadowCameraFar !== undefined;
            const lightPosition = { x: center.x, y: center.y, z: center.z };
            // 视点看向的目标：显式模式**沿光源方向**（对齐 three.js 的
            // `shadow.camera.lookAt(light.target)`——three 的 target 默认在原点，
            // 与 light.position 一起决定阴影相机的朝向）；自动模式仍看向包围盒中心。
            const lightTarget = { x: center.x, y: center.y, z: center.z };

            if (hasExplicitFrustum)
            {
                const p = members.position;
                const dirNorm = vec3Normalize(vec3FromValues(lightDir.x, lightDir.y, lightDir.z));

                lightPosition.x = p.x;
                lightPosition.y = p.y;
                lightPosition.z = p.z;
                lightTarget.x = p.x + dirNorm[0];
                lightTarget.y = p.y + dirNorm[1];
                lightTarget.z = p.z + dirNorm[2];
            }
            else
            {
                // 包围盒尺寸，用于决定相机后退距离与正交视锥大小
                const maxVec = { x: worldBounds.max.x, y: worldBounds.max.y, z: worldBounds.max.z };
                const minVec = { x: worldBounds.min.x, y: worldBounds.min.y, z: worldBounds.min.z };
                const sizeVec = mathVec3Sub(maxVec, minVec);
                const radius = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
                const distance = radius * 2 + 5; // 后退距离，确保整个场景在视锥内
                const backOff = { x: lightDir.x, y: lightDir.y, z: lightDir.z };

                vec3ScaleNumber(backOff, -distance, backOff);
                vec3Add(lightPosition, backOff, lightPosition);
            }

            // 3. wgpu-matrix 风格 view/projection 矩阵
            const upVector = Math.abs(lightDir.y) > 0.99
                ? vec3FromValues(1, 0, 0)
                : vec3FromValues(0, 1, 0);

            const lightViewMatrix = mat4LookAt(
                vec3FromValues(lightPosition.x, lightPosition.y, lightPosition.z),
                vec3FromValues(lightTarget.x, lightTarget.y, lightTarget.z),
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
            // 加 margin 确保边缘不被裁剪（以下为按包围盒自动计算的值）
            const MARGIN = 1;
            let left = minX - MARGIN;
            let right = maxX + MARGIN;
            let bottom = minY - MARGIN;
            let top = maxY + MARGIN;
            // near/far 用光源空间 z 范围。wgpu-matrix lookAt：z 轴 = normalize(eye-target)，
            // 相机看 -Z，物体在 -Z 方向故光源空间 z 为负。near = 距最近物体距离 (|maxZ|)，
            // far = 距最远物体距离 (|minZ|)。
            let near = Math.max(0.1, -maxZ);
            let far = Math.max(near + 1, -minZ + MARGIN);

            // 数据侧显式配置逐项覆盖自动值（对齐 three.js 的 shadow.camera.*）
            if (r_data.shadowCameraLeft !== undefined) left = r_data.shadowCameraLeft;
            if (r_data.shadowCameraRight !== undefined) right = r_data.shadowCameraRight;
            if (r_data.shadowCameraBottom !== undefined) bottom = r_data.shadowCameraBottom;
            if (r_data.shadowCameraTop !== undefined) top = r_data.shadowCameraTop;
            if (r_data.shadowCameraNear !== undefined) near = r_data.shadowCameraNear;
            if (r_data.shadowCameraFar !== undefined) far = r_data.shadowCameraFar;

            const lightProjectionMatrix = mat4Ortho(left, right, bottom, top, near, far);
            const lightViewProjMatrix = mat4Multiply(lightProjectionMatrix, lightViewMatrix);

            // 写入 shadowViewProjection（转为 feng3d Matrix4x4，列主序 Float32Array 兼容）
            // 阶段 C-e：`Matrix4x4` 的 class 已删除，改成纯数据字面量（先铺 16 个 0 再逐位写入）
            const m: Matrix4x4 = { __type__: 'Matrix4x4', elements: new Array<number>(16).fill(0) };
            for (let i = 0; i < 16; i++) m.elements[i] = lightViewProjMatrix[i];
            members.updateShadowParams(m, near, far);
        },
    };

    return logic;
}

// 注册到 logic 分发表
registerLogic('DirectionalLight', directionalLightLogic);

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
