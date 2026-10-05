import { MATHF_DEG2RAD } from '@feng3d/math';
import { Light, LightLogic, createLightLogicBase } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic, computed, reactive } from "@feng3d/reactivity";
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
 * SpotLight 逻辑处理接口。
 *
 * 继承 LightLogic，额外：
 * - shadowMap：聚光灯阴影图（webgpu Texture，rgba8unorm，格式不变）
 * - shadowViewProjection：computed，依赖 world2local / angle / range，自动失效重算
 *   （无需 ShadowRenderer 主动调 updateShadowVP）
 * - coneCos / penumbraCos：聚光锥角派生（光照计算用）
 */
export interface SpotLightLogic extends LightLogic
{
    /** 聚光锥角余弦（光照计算用） */
    readonly coneCos: number;
    /** 半影锥角余弦（光照计算用） */
    readonly penumbraCos: number;
    /** 聚光灯阴影图（懒创建，1024×1024 rgba8unorm） */
    readonly shadowMap: Texture;
}

/**
 * 工厂函数：SpotLightLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 灯光数据（raw）
 */
export function spotLightLogic(data: SpotLight): SpotLightLogic
{
    const { members } = createLightLogicBase(data);

    /** 聚光灯阴影图（rgba8unorm，懒创建） */
    let shadowMap: Texture | null = null;

    // VP = perspective(angle) × view(world2local)
    // 依赖全是响应式：world2local（Computed）、angle/range（响应式字段）。
    // 任一变化自动失效，ShadowRenderer 读 .shadowViewProjection 时按需重算。
    const shadowViewProjection = computed<Matrix4x4>(() =>
    {
        const r_light = reactive(data);
        const angle = r_light.angle;
        const range = r_light.range;
        // light 是组件，必然挂在 Object3D 上（entity 非空）；strictNullChecks 下显式断言
        const viewMatrix = getLogic(members.entity!).world2local;
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

    const logic: SpotLightLogic = {
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
        /** 每帧更新（默认空） */
        update(interval) { members.update(interval); },
        /** 是否加载完成 */
        get isLoaded() { return members.isLoaded; },
        /** 释放 */
        dispose() { members.dispose(); },
        /** 阴影相机近平面 */
        get shadowNear() { return members.shadowNear; },
        /** 阴影相机远平面 */
        get shadowFar() { return members.shadowFar; },
        /** 更新阴影参数 */
        updateShadowParams(viewProjection, near, far) { members.updateShadowParams(viewProjection, near, far); },
        /** 光源世界坐标（由 object3D 的 worldPosition 派生） */
        get position() { return members.position; },
        /** 光源方向（object3D 的 local2world Z 轴取反） */
        get direction() { return members.direction; },
        /** 阴影相机近平面（供 shader uniform） */
        get shadowCameraNear() { return members.shadowCameraNear; },
        /** 阴影相机远平面（供 shader uniform） */
        get shadowCameraFar() { return members.shadowCameraFar; },
        /** 阴影图尺寸（默认 1024×1024） */
        get shadowMapSize() { return members.shadowMapSize; },

        // ---- SpotLight 自身成员 ----
        /** 聚光锥角余弦（光照计算用） */
        get coneCos(): number
        {
            return Math.cos((members.component as SpotLight).angle * 0.5 * MATHF_DEG2RAD);
        },
        /** 半影锥角余弦（光照计算用） */
        get penumbraCos(): number
        {
            return Math.cos((members.component as SpotLight).angle * 0.5 * MATHF_DEG2RAD * (1 - (members.component as SpotLight).penumbra));
        },
        /** 聚光灯阴影图（懒创建，1024×1024 rgba8unorm） */
        get shadowMap(): Texture
        {
            if (!shadowMap)
            {
                shadowMap = {
                    descriptor: {
                        label: 'SpotLightShadowMap',
                        size: [1024, 1024],
                        format: 'rgba8unorm',
                    },
                } as Texture;
            }

            return shadowMap;
        },
        /** 调试阴影图：聚光灯用 shadowMap */
        get debugShadowTexture(): Texture | null
        {
            return logic.shadowMap;
        },
        /** 覆盖基类：返回 computed 求值结果（依赖 world2local/angle/range，自动失效） */
        get shadowViewProjection(): Matrix4x4
        {
            return shadowViewProjection.value;
        },
    };

    // 阴影近/远平面（常量，构造时一次性设置）
    members.updateShadowParams({ __type__: 'Matrix4x4', ...mat4Identity() }, 0.1, data.range);

    return logic;
}
// 注册到 logic 分发表
registerLogic('SpotLight', spotLightLogic);
