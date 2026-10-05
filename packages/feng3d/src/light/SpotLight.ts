import { MATHF_DEG2RAD } from '@feng3d/math';
import { Light } from './Light';
import { LightLogic } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic, Computed, computed, reactive } from "@feng3d/reactivity";
import { mat4Append, mat4Copy, mat4Identity, mat4SetPerspectiveFromFOV, Matrix4x4 } from '@feng3d/math';
import { Texture } from '@feng3d/webgpu';


declare module '../component/Component'
{
    export interface ComponentMap
    {
        SpotLight: SpotLight;
    }
}

/**
 * SpotLight（纯数据接口）。
 */
export interface SpotLight extends Light
{
    readonly __type__: 'SpotLight';
    readonly lightType: LightType.Spot;
    readonly range: number;
    readonly angle: number;
    readonly penumbra: number;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SpotLight: SpotLightLogic;
    }
}

/**
 * SpotLight 逻辑类。
 *
 * 继承 LightLogic，额外：
 * - shadowMap：聚光灯阴影图（webgpu Texture，rgba8unorm，格式不变）
 * - shadowViewProjection：computed，依赖 world2local / angle / range，自动失效重算
 *   （无需 ShadowRenderer 主动调 updateShadowVP）
 * - coneCos / penumbraCos：聚光锥角派生（光照计算用）
 */
export class SpotLightLogic extends LightLogic
{
    /** 聚光灯阴影图（rgba8unorm，懒创建） */
    #shadowMap: Texture | null = null;

    /** 阴影 VP computed（依赖 world2local/angle/range） */
    readonly #shadowViewProjectionComputed: Computed<Matrix4x4>;

    protected constructor(data: SpotLight)
    {
        super(data);
        // VP = perspective(angle) × view(world2local)
        // 依赖全是响应式：world2local（Computed）、angle/range（响应式字段）。
        // 任一变化自动失效，ShadowRenderer 读 .shadowViewProjection 时按需重算。
        this.#shadowViewProjectionComputed = computed<Matrix4x4>(() =>
        {
            const r_light = reactive(data);
            const angle = r_light.angle;
            const range = r_light.range;
            // light 是组件，必然挂在 Object3D 上（entity 非空）；strictNullChecks 下显式断言
            const viewMatrix = getLogic(this.entity!).world2local;
            // 阶段 C-e：`Matrix4x4` 的 class 已删除，改成「纯数据字面量 + 纯函数」
            const projection: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4SetPerspectiveFromFOV(angle, 1, 0.1, range) };

            // `append(lhs)` 是**左乘**（this = lhs × this，与 CameraLogic 用法一致），
            // 所以先 copy(view) 再 append(projection)，得到 P × V。
            // 反过来写会得到 V × P：VP 全部错位，阴影视锥剔不出任何对象（阴影图恒空，issue #232）。
            // 注意必须 copy——world2local 是对象自己缓存的矩阵，就地改会污染它的世界变换。
            const vp: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(viewMatrix) };

            mat4Append(vp, projection, vp);

            return vp;
        });

        // 阴影近/远平面（常量，构造时一次性设置）
        this.updateShadowParams({ __type__: 'Matrix4x4', ...mat4Identity() }, 0.1, data.range);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: SpotLight): SpotLightLogic
    {
        return new SpotLightLogic(data);
    }

    /** 聚光锥角余弦（光照计算用） */
    get coneCos(): number
    {
        return Math.cos((this._data as SpotLight).angle * 0.5 * MATHF_DEG2RAD);
    }

    /** 半影锥角余弦（光照计算用） */
    get penumbraCos(): number
    {
        return Math.cos((this._data as SpotLight).angle * 0.5 * MATHF_DEG2RAD * (1 - (this._data as SpotLight).penumbra));
    }

    /** 聚光灯阴影图（懒创建，1024×1024 rgba8unorm） */
    get shadowMap(): Texture
    {
        if (!this.#shadowMap)
        {
            this.#shadowMap = {
                descriptor: {
                    label: 'SpotLightShadowMap',
                    size: [1024, 1024],
                    format: 'rgba8unorm',
                },
            } as Texture;
        }

        return this.#shadowMap;
    }

    /** 调试阴影图：聚光灯用 shadowMap */
    get debugShadowTexture(): Texture | null
    {
        return this.shadowMap;
    }

    /** 覆盖基类：返回 computed 求值结果（依赖 world2local/angle/range，自动失效） */
    get shadowViewProjection(): Matrix4x4
    {
        return this.#shadowViewProjectionComputed.value;
    }
}
// 注册到 logic 分发表
registerLogic('SpotLight', SpotLightLogic.create);
