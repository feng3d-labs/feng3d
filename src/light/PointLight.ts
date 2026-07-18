import { Light, createLight } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
import { Matrix4x4, Vector2, Vector3 } from '@feng3d/math';
import type { Object3D } from '../core/Object3D';
import type { Texture2D } from '../textures/Texture2D';
import { RenderTargetTexture2D } from '../textures/RenderTargetTexture2D';
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
 * - shadowMap：cubemap 阴影图（RenderTargetTexture2D，rgba8unorm + packDepthToRGBA，格式不变）
 * - shadowViewProjections：6 面 cubemap VP 矩阵（直接拼矩阵，不再经过 shadowCamera/lens）
 * - updateShadowCubemapVP：由光源 position + cubeDirections/cubeUps 算 6 面 view × perspective projection
 * - effect 监听 range 变化时标记 VP 失效（ShadowRenderer 每帧重算）
 */
export class PointLightLogic extends LightLogic
{
    /** cubemap 阴影图（rgba8unorm，与原 frameBufferObject.texture 等价） */
    private _shadowMap: RenderTargetTexture2D | null = null;
    /** 6 面 cubemap view-projection 矩阵 */
    private _shadowViewProjections: Matrix4x4[] = [];
    private _pointInited = false;

    constructor(light: PointLight)
    {
        super(light);
    }

    /** cubemap 单面有效尺寸（atlas 布局 1/4 × 1/2，保留原语义） */
    get shadowMapSize(): Vector2
    {
        return new Vector2(1024 * 1 / 4, 1024 * 1 / 2);
    }

    /** cubemap 阴影图（懒创建，1024×1024 rgba8unorm） */
    get shadowMap(): RenderTargetTexture2D
    {
        if (!this._shadowMap)
        {
            this._shadowMap = new RenderTargetTexture2D();
            this._shadowMap.descriptor = {
                label: 'PointLightShadowMap',
                size: [1024, 1024],
                format: 'rgba8unorm' as const,
            };
        }

        return this._shadowMap;
    }

    /** 调试阴影图：点光源用 cubemap 阴影图 */
    get debugShadowTexture(): Texture2D | null
    {
        return this.shadowMap;
    }

    /** 6 面 cubemap VP 矩阵（ShadowRenderer 逐面读取） */
    get shadowViewProjections(): readonly Matrix4x4[]
    {
        return this._shadowViewProjections;
    }

    init(object3D?: Object3D): void
    {
        if (this._pointInited) return;
        this._pointInited = true;
        super.init(object3D);

        // effect 监听 range 变化时无需立即重算——ShadowRenderer 每帧调 updateShadowCubemapVP，
        // range 已在算法内读取，自动反映最新值。此处保留 effect 仅用于触发响应式依赖追踪，
        // 确保 range 变化时依赖 shadowMap 的 computed 失效（如 debug 材质）。
        effect(() =>
        {
            void reactive(this.component as PointLight).range;
        });
    }

    /**
     * 计算点光源 cubemap 6 面的 view-projection 矩阵。
     *
     * 每面：view = lookAt(lightPos, lightPos + cubeDir, cubeUp).invert()；
     * projection = setPerspectiveFromFOV(90, 1, 0.1, range)。结果写入 _shadowViewProjections。
     */
    updateShadowCubemapVP(): void
    {
        const light = this.component as PointLight;
        const range = light.range;
        const pos = this.position as Vector3;

        // perspective projection（90° FOV，aspect=1）——6 面公用
        const projection = new Matrix4x4();
        projection.setPerspectiveFromFOV(90, 1, 0.1, range);

        if (this._shadowViewProjections.length === 0)
        {
            for (let i = 0; i < 6; i++) this._shadowViewProjections.push(new Matrix4x4());
        }

        for (let face = 0; face < 6; face++)
        {
            // view 矩阵：camera→world 的逆（world→camera）
            const viewMatrix = new Matrix4x4();
            viewMatrix.setPosition(pos);
            viewMatrix.lookAt(pos.addTo(cubeDirections[face]), cubeUps[face]);
            viewMatrix.invert();

            // VP = projection × view
            this._shadowViewProjections[face].copy(projection).append(viewMatrix);
        }

        this._shadowNear = 0.1;
        this._shadowFar = range;
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
