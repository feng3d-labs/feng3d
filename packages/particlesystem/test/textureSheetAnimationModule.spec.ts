import { animationCurveGetKey, animationCurveNumKeys } from '@feng3d/math';

import { describe, expect, it } from 'vitest';

import { particleTextureSheetAnimationModuleDefault } from '../src/modules/ParticleTextureSheetAnimationModule';

/**
 * `ParticleTextureSheetAnimationModule` 的构造回归（issue #402）。
 *
 * 它的字段初始化里有
 * `frameOverTime = serialization.setValue(minMaxCurveDefault(), { mode, curveMin: { keys: [...] } })`。
 * `setValue` 构造的 param 只有 `{ handlers, serialization }`（既没有 `refs` 也没有 `seen`），而
 * `propertyHandler` 在"需要实例化嵌套类对象"时会把这个 param 递归交给 `serialization.deserialize`；
 * 后者入口直接读 `param.seen.has(...)` ⇒ **构造即抛**
 * `TypeError: Cannot read properties of undefined (reading 'has')`。
 *
 * 修复方式：给 `setValue` 的 param 打 `fromSetValue` 标记，递归处只对这种 param 传 `undefined`
 * （让 `deserialize` 按根调用自建完整 param）；其它调用方（资源系统）行为不变 ——
 * `assets` / `editor` 里"缺 `__class__` 的纯数据必须失败"那两个缺口记录用例仍在盯着它。
 *
 * 这也是 `allModulesInvariants.spec.ts` 当初把它排除在模块清单外的原因（issue #392 的表）。
 */
describe('ParticleTextureSheetAnimationModule（#402 回归）', () =>
{
    it('构造不抛异常', () =>
    {
        expect(() => particleTextureSheetAnimationModuleDefault()).not.toThrow();
    });

    it('嵌套的 curveMin 是纯数据 AnimationCurve，关键帧内容正确', () =>
    {
        const module = particleTextureSheetAnimationModuleDefault();
        const curve = module.frameOverTime.curveMin;

        // 曲线族纯数据化后不再有 class 可 instanceof：按判别字段与形状断言
        expect(curve.__type__).toBe('AnimationCurve');
        expect(animationCurveNumKeys(curve)).toBeGreaterThan(0);

        const first = animationCurveGetKey(curve, 0);

        expect(first).toBeDefined();
        expect(Number.isFinite(first.time)).toBe(true);
        expect(Number.isFinite(first.value)).toBe(true);
    });
});
