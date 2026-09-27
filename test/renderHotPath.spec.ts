import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * 渲染热路径的**实现形态**守卫（issue #100：零 GC 抖动）。
 *
 * 为什么这条用例在仓库根 `test/` 而不是 `packages/feng3d/src/...` 里：
 * 它要读源码（`node:fs`），而 `packages/feng3d/tsconfig.json` 没有引入 Node 类型
 * （`tsc` 会报 `TS2591: Cannot find name 'node:fs'`）。根 `test/` 不在任何子包 tsconfig
 * 的 include 内，正好适合放这种「扫仓库源码」的检查。
 *
 * 为什么不用 spy：装配期间反应式系统与材质逻辑自身也会调用 `Array.prototype.concat`
 * （实测 8 次），全局 spy 无法区分来源，会退化成「永远失败或永远通过」的假门禁。
 */
describe('渲染热路径实现形态（issue #100）', () =>
{
    const sourceOf = (relativePath: string) =>
        readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

    it('ForwardRenderer 组装 renderObjects 时不再拼接临时数组', () =>
    {
        // `unblenditems.concat(blenditems)` 每次重算都会多分配一个长度 N 的数组；
        // 改回这种写法时本用例立刻失败（改为两次遍历即可）。
        const source = sourceOf('../packages/feng3d/src/render/renderer/ForwardRenderer.ts');

        expect(source).not.toContain('.concat(');
        expect(source).toContain('unblenditems');
        expect(source).toContain('blenditems');
    });
});
