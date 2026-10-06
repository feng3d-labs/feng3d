/**
 * 标准雾效果（原 `standardFogMainWGSL` 的 TSL 版）。
 *
 * 与其它"pars/整段着色器"不同，这是一个**body 片段**：它引用调用方的局部变量
 * （`finalColor`）与 varying（`worldPosition`），所以做成一个**接收 TSL 表达式的普通 TS 函数**——
 * 在 shader body 内调用它时，TSL 的语句收集器会把 `if_` / `let_` 等挂到当前 body 上。
 *
 * **回写约定**：`finalColor` 传进来的是 `var_` 声明的可变变量，本函数用 `assign` 就地修改它。
 *
 * 由 `StandardMaterial` 与 terrain 的 `TerrainMaterial` 共用（两边的 uniforms 结构同名同型）。
 *
 * 支持的雾模式（与手写一致）：
 * - 1：指数雾 `1 - exp(-density * dist)`
 * - 2：指数平方雾 `1 - exp(-density² * dist²)`
 * - 其它：线性雾 `clamp((dist - min) / (max - min), 0, 1)`
 */
import { Float, clamp, exp, float, if_, let_, mat4, max, mix, var_, vec3, vec4 } from '@feng3d/tsl';

/** vec3 / vec4 的实例类型（TSL 只导出构造函数） */
type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;

/** 雾片段所需的上下文（都由调用方的着色器提供） */
export interface StandardFogContext
{
    /** 材质 uniform：需含 u_fogMode / u_fogDensity / u_fogMinDistance / u_fogMaxDistance / u_fogColor */
    material: {
        u_fogMode: Float;
        u_fogDensity: Float;
        u_fogMinDistance: Float;
        u_fogMaxDistance: Float;
        u_fogColor: Vec4Value;
    };
    /** 相机 uniform：u_viewMatrix（雾深度用视图空间 z，与 three 的 vFogDepth 同口径） */
    camera: { u_viewMatrix: ReturnType<typeof mat4> };
    /** 片元世界坐标（varying） */
    worldPosition: Vec3Value;
    /** 累积颜色（`var_` 可变变量，本函数就地修改） */
    finalColor: Vec4Value;
}

/**
 * 按 `u_fogMode` 把雾色混合进 `finalColor`（与手写片段逐行对应）。
 *
 * @param ctx 上下文（材质/相机 uniform、世界坐标、可变颜色）
 */
export function applyStandardFog(ctx: StandardFogContext): void
{
    const material = ctx.material;
    const finalColor = ctx.finalColor;

    if_(material.u_fogMode.greaterThan(0.0), () =>
    {
        // three.js 的 `vFogDepth = -mvPosition.z`：沿相机前向的**视图空间深度**，
        // 不是到相机位置的欧氏距离——地面这类大平面上两者差异明显。
        const viewPosition = let_('viewPosition', ctx.camera.u_viewMatrix.multiply(vec4(ctx.worldPosition, 1.0)));
        const dist = let_('dist', viewPosition.z.multiply(-1.0));
        const fogFactor = var_('fogFactor', float);

        if_(material.u_fogMode.equals(1.0), () =>
        {
            // 1 - exp(-density * dist)
            fogFactor.assign(float(1.0).subtract(exp(material.u_fogDensity.multiply(dist).multiply(-1.0))));
        }).else(() =>
        {
            if_(material.u_fogMode.equals(2.0), () =>
            {
                // 1 - exp(-density² * dist²)
                fogFactor.assign(float(1.0).subtract(exp(
                    material.u_fogDensity.multiply(material.u_fogDensity).multiply(dist).multiply(dist).multiply(-1.0),
                )));
            }).else(() =>
            {
                // three.js: fogFactor = smoothstep( fogNear, fogFar, vFogDepth )
                const range = let_('range', max(material.u_fogMaxDistance.subtract(material.u_fogMinDistance), 0.0001));
                const t = let_('fogT', clamp(dist.subtract(material.u_fogMinDistance).divide(range), 0.0, 1.0));
                fogFactor.assign(t.multiply(t).multiply(float(3.0).subtract(t.multiply(2.0))));
            });
        });

        finalColor.assign(vec4(mix(finalColor.xyz, material.u_fogColor.xyz, fogFactor), finalColor.a));
    });
}
