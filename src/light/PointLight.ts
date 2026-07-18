import { Light, createLight } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic, Computed, computed, reactive } from "@feng3d/reactivity";
import { Matrix4x4, Vector2, Vector3 } from '@feng3d/math';
import type { Texture } from '@feng3d/webgpu';
import type { Texture2D } from '../textures/Texture2D';
import type { Object3D } from '../core/Object3D';
import { LightLogic } from './Light';

import './PointLight';

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
    readonly lightType: any;
    readonly range: number;
}

/**
 * 创建 PointLight 实例。
 */
export function createPointLight(): PointLight
{
    return {
        ...createLight(), __type__: 'PointLight',
        lightType: LightType.Point,
        range: 10,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PointLight: PointLightLogic;
    }
}

/**
 * PointLight 逻辑处理类。
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
    private _shadowDepthTexture: Texture | null = null;
    /** 6 面 cubemap VP computed（依赖 worldPosition/range） */
    private readonly _shadowViewProjectionsComputed: Computed<readonly Matrix4x4[]>;

    constructor(light: PointLight)
    {
        super(light);
        const self = this;
        // 6 面 cubemap VP：每面 perspective(90°) × lookAt(cubeDir, cubeUp).invert()
        // 依赖全是响应式：worldPosition（Computed）、range（响应式字段）。
        // 任一变化自动失效，ShadowRenderer 读 .shadowViewProjections 时按需重算。
        this._shadowViewProjectionsComputed = computed<readonly Matrix4x4[]>(() =>
        {
            const range = reactive(light).range;
            const pos = self.position as Vector3;
            // 6 面公用 perspective projection（90° FOV，aspect=1）
            const projection = new Matrix4x4();
            projection.setPerspectiveFromFOV(90, 1, 0.1, range);
            self._shadowNear = 0.1;
            self._shadowFar = range;

            const vps: Matrix4x4[] = [];
            for (let face = 0; face < 6; face++)
            {
                const viewMatrix = new Matrix4x4();
                viewMatrix.setPosition(pos);
                viewMatrix.lookAt(pos.addTo(cubeDirections[face]), cubeUps[face]);
                viewMatrix.invert();
                vps.push(new Matrix4x4().copy(projection).append(viewMatrix));
            }

            return vps;
        });
    }

    /** 阴影图单面尺寸（depth cubemap 每面 1024×1024） */
    get shadowMapSize(): Vector2
    {
        return new Vector2(1024, 1024);
    }

    /** 点光源阴影深度 cubemap（懒创建，depth24plus 2d-array 6 layer） */
    get shadowDepthTexture(): Texture
    {
        if (!this._shadowDepthTexture)
        {
            // 用 plain object 满足 Texture 接口（Texture2D.descriptor.size 类型是 [number, number]，
            // 不支持 depthOrArrayLayers，故直接构造 Texture 对象）
            this._shadowDepthTexture = {
                descriptor: {
                    label: 'PointLightShadowDepth',
                    size: [1024, 1024, 6],
                    dimension: '2d',
                    format: 'depth24plus',
                },
            } as Texture;
        }

        return this._shadowDepthTexture;
    }

    /**
     * 调试阴影图：点光源 depth cubemap 当前不支持直接 debug（DebugShadowMapMaterial 声明 texture_depth_2d，
     * cubemap 需采单 face 的 2D view，暂未实现）。返回 null 跳过 debug。
     */
    get debugShadowTexture(): Texture2D | null
    {
        return null;
    }

    /** 6 面 cubemap VP 矩阵（computed 求值，ShadowRenderer 逐面读取） */
    get shadowViewProjections(): readonly Matrix4x4[]
    {
        return this._shadowViewProjectionsComputed.value;
    }
}
// 注册到 componentLogic 分发表
registerLogic('PointLight', PointLightLogic);

/** cubemap 6 面的 target 方向（+X, -X, +Z, -Z, +Y, -Y） */
const cubeDirections = [
    new Vector3(1, 0, 0), new Vector3(-1, 0, 0), new Vector3(0, 0, 1),
    new Vector3(0, 0, -1), new Vector3(0, 1, 0), new Vector3(0, -1, 0)
];
/** cubemap 6 面的 up 方向（+Y/-Y 面用 ±Z，其余用 +Y） */
const cubeUps = [
    new Vector3(0, 1, 0), new Vector3(0, 1, 0), new Vector3(0, 1, 0),
    new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(0, 0, -1)
];
