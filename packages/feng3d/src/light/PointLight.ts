import { validateFieldTypes } from '../core/Validate';
import { Light } from './Light';
import { LightLogic } from './Light';
import { LightType } from './LightType';
import { registerLogic, Computed, computed, reactive } from "@feng3d/reactivity";
import { mat4Append, mat4Copy, mat4Identity, mat4Invert, mat4LookAt, mat4SetPerspectiveFromFOV, mat4SetPosition, Matrix4x4, vec3Add, Vector2, Vector3 } from '@feng3d/math';
import type { Texture } from '@feng3d/webgpu';


declare module '../component/Component'
{
    export interface ComponentMap
    {
        PointLight: PointLight;
    }
}

/**
 * PointLight（纯数据接口）。
 */
export interface PointLight extends Light
{
    readonly __type__: 'PointLight';
    readonly lightType: LightType.Point;
    readonly range: number;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PointLight: PointLightLogic;
    }
}

/**
 * PointLight 逻辑类。
 *
 * 继承 LightLogic，额外：
 * - shadowDepthTexture：depth cubemap（depth24plus，6 layer 的 2D-array）
 *   每层对应 cubemap 一面，ShadowRenderer 用 6 个 depth-only Pass 分别写入
 * - shadowViewProjections：computed，6 面 VP（依赖 worldPosition/range，自动失效重算）
 *   无需 ShadowRenderer 主动调 updateShadowCubemapVP
 */
export class PointLightLogic extends LightLogic
{
    /**
     * 点光源阴影深度 cubemap（depth24plus，6 layer）。
     *
     * 采样端若以后接入主 Pass，用 cube view（`dimension:'cube'`）做 `texture_depth_cube` 比较采样。
     * 渲染端必须用 per-face 的 2D view（`baseArrayLayer=face`）——WebGPU 不允许 cube view 作 attachment。
     */
    #shadowDepthTexture: Texture | null = null;

    /** 6 面 cubemap VP computed（依赖 worldPosition/range） */
    readonly #shadowViewProjectionsComputed: Computed<readonly Matrix4x4[]>;

    protected constructor(data: PointLight)
    {
        validateFieldTypes(data, { range: 'number' }, 'PointLight');
        super(data);
        // 6 面 cubemap VP：每面 perspective(90°) × lookAt(cubeDir, cubeUp).invert()
        // 依赖全是响应式：worldPosition（Computed）、range（响应式字段）。
        // 任一变化自动失效，ShadowRenderer 读 .shadowViewProjections 时按需重算。
        this.#shadowViewProjectionsComputed = computed<readonly Matrix4x4[]>(() =>
        {
            const range = reactive(data).range;
            const pos = this.position as Vector3;
            // 6 面公用 perspective projection（90° FOV，aspect=1）
            // 阶段 C-e：`Matrix4x4` 的 class 已删除，全部改成「纯数据字面量 + 纯函数」
            const projection: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4SetPerspectiveFromFOV(90, 1, 0.1, range) };

            const vps: Matrix4x4[] = [];
            for (let face = 0; face < 6; face++)
            {
                const viewMatrix: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Identity() };
                mat4SetPosition(viewMatrix, pos, viewMatrix);
                mat4LookAt(viewMatrix, vec3Add(pos, cubeDirections[face]), cubeUps[face], viewMatrix);
                mat4Invert(viewMatrix, viewMatrix);
                // 列向量约定：clip = P × V × p；而 `append(lhs)` 是**左乘**（this = lhs × this，
                // 与 `CameraLogic` 里 `world2local.append(projectionMatrix)` 同一用法），
                // 所以 this 必须是 view、lhs 必须是 projection。
                // 写反会得到 V × P：6 面 VP 全部错位，阴影视锥一个对象都剔不出来（阴影图恒空，issue #232）。
                const vp: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(viewMatrix) };
                mat4Append(vp, projection, vp);
                vps.push(vp);
            }

            return vps;
        });

        // 阴影近/远平面（常量，构造时一次性设置）
        this.updateShadowParams({ __type__: 'Matrix4x4', ...mat4Identity() }, 0.1, data.range);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: PointLight): PointLightLogic
    {
        return new PointLightLogic(data);
    }

    /** 阴影图单面尺寸（depth cubemap 每面 1024×1024） */
    override get shadowMapSize(): Vector2
    {
        return { __type__: 'Vector2', x: 1024, y: 1024 };
    }

    /** 点光源阴影深度 cubemap（懒创建，depth24plus 2d-array 6 layer） */
    get shadowDepthTexture(): Texture
    {
        if (!this.#shadowDepthTexture)
        {
            // 用 plain object 满足 Texture 接口（descriptor.size 支持 depthOrArrayLayers）
            this.#shadowDepthTexture = {
                descriptor: {
                    label: 'PointLightShadowDepth',
                    size: [1024, 1024, 6],
                    dimension: '2d',
                    format: 'depth24plus',
                },
            } as Texture;
        }

        return this.#shadowDepthTexture;
    }

    /**
     * 调试阴影图：点光源 depth cubemap 当前不支持直接 debug（DebugShadowMapMaterial 声明 texture_depth_2d，
     * cubemap 需采单 face 的 2D view，暂未实现）。返回 null 跳过 debug。
     */
    override get debugShadowTexture(): Texture | null
    {
        return null;
    }

    /** 6 面 cubemap VP 矩阵（computed 求值，ShadowRenderer 逐面读取） */
    get shadowViewProjections(): readonly Matrix4x4[]
    {
        return this.#shadowViewProjectionsComputed.value;
    }
}
// 注册到 logic 分发表
registerLogic('PointLight', PointLightLogic.create);

/** cubemap 6 面的 target 方向（+X, -X, +Z, -Z, +Y, -Y） */
const cubeDirections = [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 }
];
/** cubemap 6 面的 up 方向（+Y/-Y 面用 ±Z，其余用 +Y） */
const cubeUps = [
    { x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 },
    { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
];
