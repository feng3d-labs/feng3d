import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 门禁脚本的「退出码」回归（issue #652 · 做法 4）。
 *
 * test/ 下此前没有「临时仓库 + spawnSync 断言退出码」的用例：判据层的纯函数单测
 * （test/r2ModuleScope.spec.ts）与脚本内的合成样例自检都**不经过 process.exit**，
 * 于是「判据命中 → 真的 exit 1」这条接线只能靠人读代码。
 *
 * 本文件在 mkdtempSync 造的临时仓库里铺最小环境，用真实子进程跑完整脚本，断言：
 *   - 违规源码 → 退出码 1（判据命中后确实 exit）；
 *   - 干净源码 → 退出码 0（不误报）；
 *   - `--strict` 与默认模式的差异（默认只报告、退出码 0）——正是 CI 用的那条分支。
 *
 * 判据一旦被改坏（漏报），「违规 → 退出码 1」会先变红：这就是做法 4 想要的破坏性哨兵。
 *
 * 临时仓库要铺的启动前置（与判据无关）：
 *   - `ENTRY_FILES` 里的 3 个应用入口必须存在（R2 两条脚本的 `missingEntryFiles` 反向校验）；
 *   - `check-module-side-effects.mjs` 的名单一致性断言要读两份**对侧名单文件**
 *     （规则层 `CACHE_CONSTRUCTORS` 与编辑器侧 `MUTABLE_MODULE_CACHE`），原样复制以保持名单同步；
 *   - 脚本各读一份存量基线，写空基线即可（本批测的是「基线外新增」这条判据）。
 */

const REPO = process.cwd();

/** R2 两条脚本的入口反向校验：scripts/r2-module-scope.mjs 的 ENTRY_FILES 全都要存在 */
const ENTRY_STUBS = [
    'packages/reactivity/examples/index.ts',
    'packages/webgpu/examples/index.ts',
    'packages/editor/src/vue-app/main.ts',
];

/**
 * check-module-side-effects.mjs 名单一致性断言要读的两份对侧文件。
 *
 * 原样复制（而不是在测试里再写一份名单）是刻意的：测试不能变成「第四份名单」——
 * 真实仓库改了名单，这里跟着变，否则 #652 做法 5 想防的名单漂移会从后门回来。
 */
const CACHE_LIST_PEERS = [
    'packages/eslint-plugin-feng3d/src/rules/no-module-side-effect.ts',
    'scripts/check-editor-module-effects.mjs',
];

/** 各脚本自带的存量基线（空 = 没有任何登记在册的存量） */
const BASELINES: Record<string, string> = {
    'scripts/toplevel-new-baseline.json': '{\n    "entries": []\n}\n',
    'scripts/math-no-class-baseline.json': '{\n    "entries": {}\n}\n',
};

/**
 * 在临时仓库根下写一个文件（自动建父目录）。
 *
 * @param root 临时仓库根
 * @param rel 相对仓库根路径
 * @param content 文件内容
 */
function writeFile(root: string, rel: string, content: string)
{
    const full = join(root, rel);

    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, 'utf8');
}

/**
 * 造一个最小临时仓库，跑指定门禁脚本，返回 spawnSync 结果。
 *
 * @param script scripts/ 下的脚本名
 * @param options.files 额外铺的源码文件（相对仓库根 → 内容）
 * @param options.args 传给脚本的参数
 * @param options.peers 是否复制名单一致性判据要读的对侧文件
 * @returns spawnSync 结果
 */
function runGate(script: string, options: { files?: Record<string, string>; args?: string[]; peers?: boolean } = {})
{
    const root = mkdtempSync(join(tmpdir(), 'feng3d-gate-exit-'));

    try
    {
        for (const rel of ENTRY_STUBS) writeFile(root, rel, '');

        for (const [rel, content] of Object.entries({ ...BASELINES, ...(options.files ?? {}) })) writeFile(root, rel, content);

        if (options.peers)
        {
            for (const rel of CACHE_LIST_PEERS)
            {
                const dest = join(root, rel);

                mkdirSync(dirname(dest), { recursive: true });
                cpSync(join(REPO, rel), dest);
            }
        }

        return spawnSync(process.execPath, [join(REPO, 'scripts', script), ...(options.args ?? [])], {
            cwd: root,
            encoding: 'utf8',
        });
    }
    finally
    {
        rmSync(root, { recursive: true, force: true });
    }
}

describe('check-module-side-effects.mjs 的退出码（R2 缓存容器）', () =>
{
    it('模块级缓存 new Map() → --strict 退出码 1 且报「基线外的违规」', () =>
    {
        const result = runGate('check-module-side-effects.mjs', {
            files: { 'packages/probe.ts': 'export const cache = new Map<string, number>();\n' },
            args: ['--strict'],
            peers: true,
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('模块级副作用');
        expect(result.stderr).toContain('Map');
    }, 30000);

    it('同样的违规在默认模式只报告、退出码 0（--strict 才是 CI 判据）', () =>
    {
        const result = runGate('check-module-side-effects.mjs', {
            files: { 'packages/probe.ts': 'export const cache = new Map<string, number>();\n' },
            peers: true,
        });

        expect(result.status).toBe(0);
        expect(result.stderr).toContain('模块级副作用');
    }, 30000);

    it('函数体内的 new Map() → --strict 退出码 0（不误报）', () =>
    {
        const result = runGate('check-module-side-effects.mjs', {
            files: { 'packages/probe.ts': 'export function make()\n{\n    return new Map<string, number>();\n}\n' },
            args: ['--strict'],
            peers: true,
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('模块级副作用检查通过');
    }, 30000);
});

describe('check-toplevel-new.mjs 的退出码（R2 其余模块级 new 的存量冻结）', () =>
{
    it('模块级 new Wrapper() → 退出码 1 且报「新增了模块级 new」', () =>
    {
        const result = runGate('check-toplevel-new.mjs', {
            files: { 'packages/probe.ts': 'export const w = new Wrapper();\n' },
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('新增了模块级');
    }, 30000);

    it('函数体内的 new Wrapper() → 退出码 0（不误报）', () =>
    {
        const result = runGate('check-toplevel-new.mjs', {
            files: { 'packages/probe.ts': 'export function make() { return new Wrapper(); }\n' },
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('存量未增长');
    }, 30000);
});

describe('check-math-no-class.mjs 的退出码（math 去 class）', () =>
{
    it('新增 export class Vector3 → 退出码 1 且报「新增了目标类型的 export class」', () =>
    {
        const result = runGate('check-math-no-class.mjs', {
            files: { 'packages/math/src/probe.ts': 'export class Vector3 {}\n' },
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('新增了目标类型的');
    }, 30000);

    it('没有 export class → 退出码 0（不误报）', () =>
    {
        const result = runGate('check-math-no-class.mjs', {
            files: { 'packages/math/src/probe.ts': 'export const identity = 1;\n' },
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('无新增 class');
    }, 30000);
});
