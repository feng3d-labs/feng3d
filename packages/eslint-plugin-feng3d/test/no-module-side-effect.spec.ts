import { describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import plugin from '../src/index.js';

/**
 * no-module-side-effect 规则（R2 零模块级副作用，issue #76）。
 *
 * 模块顶层出现 `new Map()` / 启动型调用 / `globalThis` 写入时，import 就会执行代码：
 * 缓存无法按需分配、副作用无法关闭、tree-shaking 判断不了模块能否整体消除。
 * 这里把「该报的报、不该报的不报」都钉住。
 */
const linter = new Linter();

const config = {
    plugins: { feng3d: plugin as never },
    rules: { 'feng3d/no-module-side-effect': 'error' },
} as never;

function verify(code: string)
{
    return linter.verify(code, config).filter(m => m.ruleId === 'feng3d/no-module-side-effect');
}

describe('eslint-plugin-feng3d/no-module-side-effect', () =>
{
    it('模块顶层 new Map() 报错', () =>
    {
        const messages = verify('const cache = new Map();');

        expect(messages).toHaveLength(1);
        expect(messages[0].messageId).toBe('moduleCache');
    });

    it('模块顶层 new WeakMap() / new Set() 报错', () =>
    {
        expect(verify('const a = new WeakMap();')).toHaveLength(1);
        expect(verify('const b = new Set();')).toHaveLength(1);
    });

    it('带字面量参数的 new Set([...]) 是只读常量集合，放行', () =>
    {
        expect(verify("const TYPES = new Set(['a', 'b']);")).toHaveLength(0);
    });

    it('模块顶层 new ChainMap() 报错（项目自有缓存容器）', () =>
    {
        const messages = verify('const m = new ChainMap();');

        expect(messages).toHaveLength(1);
        expect(messages[0].messageId).toBe('moduleCache');
    });

    it('ChainMap 的 lazy-init 形态、函数体与类实例字段放行', () =>
    {
        expect(verify('let m = null; function getM() { if (!m) m = new ChainMap(); return m; }')).toHaveLength(0);
        expect(verify('function f() { return new ChainMap(); }')).toHaveLength(0);
        expect(verify('class A { m = new ChainMap(); }')).toHaveLength(0);
    });

    it('函数体、类字段里的 new Map() 放行（lazy-init 形态因此合法）', () =>
    {
        expect(verify('function f() { const c = new Map(); return c; }')).toHaveLength(0);
        expect(verify('class A { m = new Map(); }')).toHaveLength(0);
        expect(verify('let cache = null; function getCache() { if (!cache) cache = new Map(); return cache; }')).toHaveLength(0);
    });

    it('模块顶层启动型调用报错（定时器 / rAF / ticker）', () =>
    {
        expect(verify('setTimeout(() => {}, 0);')[0]?.messageId).toBe('moduleStartup');
        expect(verify('requestAnimationFrame(() => {});')[0]?.messageId).toBe('moduleStartup');
        expect(verify('startTicker();')[0]?.messageId).toBe('moduleStartup');
        expect(verify('runTickerFuncs();')[0]?.messageId).toBe('moduleStartup');
    });

    it('函数体内的启动型调用放行', () =>
    {
        expect(verify('function start() { setTimeout(() => {}, 0); }')).toHaveLength(0);
    });

    it('模块顶层写 globalThis 报错，函数体内放行', () =>
    {
        expect(verify('globalThis.__inited = true;')[0]?.messageId).toBe('globalWrite');
        expect(verify('function init() { globalThis.__inited = true; }')).toHaveLength(0);
    });

    it('registerLogic 等存量顶层注册本轮不拦（待注册模型改造）', () =>
    {
        expect(verify("registerLogic('Foo', FooLogic.create);")).toHaveLength(0);
    });
});
