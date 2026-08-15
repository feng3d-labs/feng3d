/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { effect, type Effect } from '@feng3d/reactivity';
import type { GeometryLogic } from '../geometry/Geometry';


/** 测试辅助：经 beforeRender 读取渲染数据（接口已不暴露 vertices/indices/draw getter） */
function readRenderData(lg: { beforeRender(ro: never): void }): { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number>; draw: Record<string, unknown> }
{
    const ro = {} as never;
    lg.beforeRender(ro);

    return ro as unknown as { vertices: Record<string, { data: ArrayLike<number> }>; indices: ArrayLike<number>; draw: Record<string, unknown> };
}

/**
 * 精细化响应式控制测试辅助：用 effect 追踪某属性是否被（重新）计算。
 * 返回 [stop, count]——stop 停止追踪，count 为当前触发次数。
 */
export function trackAttr(g: GeometryLogic, name: string): [() => void, () => number]
{
    let count = 0;
    const e: Effect = effect(() =>
    {
        void readRenderData(g).vertices[name].data.length;
        count++;
    });

    return [() => e.stop(), () => count];
}

/**
 * 运行通用精细化响应式控制测试套件。
 *
 * 各几何体 spec 调用本函数，传入 makeLogic（创建 logic 实例 + 可修改参数的 reactive 代理）
 * 和 geometryParams（描述哪些参数影响坐标 / 影响顶点数 / 不影响 UV）。
 *
 * @param name 几何体名称（用于 describe 标题）
 * @param makeLogic 返回 [GeometryLogic, reactiveProxy]——proxy 可修改构造参数
 * @param sizeParam 影响**坐标值但不改变顶点数**的参数名（如 width/radius/height）
 * @param sizeNewValue sizeParam 的新值
 * @param segmentParam 影响**顶点数**的参数名（如 segmentsW/segmentsH）
 * @param allParams 该几何体所有构造参数名列表（用于逐个验证响应式触发）
 * @param defaults 创建实例时用的默认参数值（用于 makeLogic 内部）
 */
export function runReactiveTests(
    name: string,
    makeLogic: () => [GeometryLogic, Record<string, unknown>],
    sizeParam: string,
    sizeNewValue: number,
    segmentParam: string,
    allParams: string[] = [],
)
{
    describe(`${name} 精细化响应式控制`, () =>
    {
        it('初始读取 a_position 不触发 a_color/a_uv/a_normal/a_tangent', () =>
        {
            const [g] = makeLogic();

            const [stopColor, colorCount] = trackAttr(g, 'a_color');
            const [stopUv, uvCount] = trackAttr(g, 'a_uv');
            const [stopNormal, normalCount] = trackAttr(g, 'a_normal');
            const [stopTangent, tangentCount] = trackAttr(g, 'a_tangent');

            const baseColor = colorCount();
            const baseUv = uvCount();
            const baseNormal = normalCount();
            const baseTangent = tangentCount();

            // 单独读取 a_position
            expect(readRenderData(g).vertices.a_position.data.length).toBeGreaterThan(0);

            // 其他属性计数不应增加
            expect(colorCount()).toBe(baseColor);
            expect(uvCount()).toBe(baseUv);
            expect(normalCount()).toBe(baseNormal);
            expect(tangentCount()).toBe(baseTangent);

            stopColor(); stopUv(); stopNormal(); stopTangent();
        });

        it(`修改 ${sizeParam} 使坐标变化，a_uv 值不变（UV 与尺寸无关）`, () =>
        {
            const [g, proxy] = makeLogic();

            const uvBefore = Array.from(readRenderData(g).vertices.a_uv.data);

            (proxy as Record<string, unknown>)[sizeParam] = sizeNewValue;

            // 触发 position 重算
            expect(readRenderData(g).vertices.a_position.data.length).toBeGreaterThan(0);

            // UV 值不变
            const uvAfter = Array.from(readRenderData(g).vertices.a_uv.data);
            expect(uvAfter).toEqual(uvBefore);
        });

        it(`修改 ${segmentParam}（改变顶点数）使 a_color 失效重算`, () =>
        {
            const [g, proxy] = makeLogic();

            const [stopColor, colorCount] = trackAttr(g, 'a_color');
            const baseColor = colorCount();

            // 修改分段数 → 顶点数变化 → a_color 依赖 _positions.length → 失效
            const cur = (proxy as Record<string, number>)[segmentParam];
            (proxy as Record<string, number>)[segmentParam] = cur + 1;

            // 读 a_color 触发重算
            expect(readRenderData(g).vertices.a_color.data.length).toBeGreaterThan(0);

            // color effect 被触发（顶点数变化导致 a_color computed 失效）
            expect(colorCount()).toBeGreaterThan(baseColor);

            stopColor();
        });

        it(`修改 ${segmentParam} 后 a_position.data.length 正确变化`, () =>
        {
            const [g, proxy] = makeLogic();

            const lenBefore = readRenderData(g).vertices.a_position.data.length;
            expect(lenBefore).toBeGreaterThan(0);

            const cur = (proxy as Record<string, number>)[segmentParam];
            (proxy as Record<string, number>)[segmentParam] = cur + 1;

            const lenAfter = readRenderData(g).vertices.a_position.data.length;
            expect(lenAfter).not.toBe(lenBefore);
            expect(lenAfter).toBeGreaterThan(lenBefore);
        });

        it(`修改 ${sizeParam} 后 a_position.data.length 不变（顶点数不变）`, () =>
        {
            const [g, proxy] = makeLogic();

            const lenBefore = readRenderData(g).vertices.a_position.data.length;

            (proxy as Record<string, unknown>)[sizeParam] = sizeNewValue;

            const lenAfter = readRenderData(g).vertices.a_position.data.length;
            expect(lenAfter).toBe(lenBefore);
        });

        // 逐个验证每个构造参数的响应式：修改后 a_position 重算，坐标值发生变化
        for (const param of allParams)
        {
            it(`修改 ${param} 后 a_position 坐标正确变化`, () =>
            {
                const [g, proxy] = makeLogic();

                // 先读取完整的 position 数据
                const before = Array.from(readRenderData(g).vertices.a_position.data);

                // 修改参数（undefined 的布尔默认 true → 设为 false；undefined 的 number → 设为非默认值）
                const cur = (proxy as Record<string, unknown>)[param];
                const newVal = typeof cur === 'number'
                    ? cur + 10
                    : typeof cur === 'boolean'
                        ? !cur
                        : typeof cur === 'undefined'
                            ? (param === 'yUp' || param.endsWith('Closed')
                                ? false  // 布尔默认 true，改为 false
                                : param === 'tile6'
                                    ? true   // 布尔默认 false，改为 true
                                    : 10)    // number 默认非 10
                            : cur;
                (proxy as Record<string, unknown>)[param] = newVal;

                // 重新读取 position 数据，应反映参数变化
                const after = Array.from(readRenderData(g).vertices.a_position.data);

                // 至少有一个坐标值发生了变化
                let anyChanged = false;
                for (let i = 0; i < Math.min(before.length, after.length); i++)
                {
                    if (before[i] !== after[i]) { anyChanged = true; break; }
                }
                expect(anyChanged).toBe(true);
            });
        }
    });
}
