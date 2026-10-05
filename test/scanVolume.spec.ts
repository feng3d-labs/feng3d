import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SCAN_VOLUME_FAILURE_PREFIX, describeScanVolume } from '../scripts/scan-volume.mjs';

/**
 * 「扫描量自证」判据层的回归测试（issue #652 · 做法 3）。
 *
 * 背景：scripts/check-*.mjs 大多是「遍历 → 收集命中 → 集合为空即通过」。
 * 一旦扫描根被改名 / 移走，或判据在空集合上短路，脚本会**静默全绿**——
 * 而「在真仓库上跑一遍 exit 0」恰好无法发现这件事（判据漏了，真仓库当然也是 exit 0）。
 *
 * 本文件按 test/r2ModuleScope.spec.ts 的取向写：判据层直接 import 纯函数断言每个分支，
 * 退出码用子进程断言，再用**合成 cwd**（一个空的 packages/ 目录）跑真实脚本，
 * 证明「扫到 0 个 → 退出码非 0」这条真的接上了，而不是只存在于注释里。
 */

const REPO = process.cwd();

/** 已接上扫描量自证的门禁脚本（口径见 scripts/scan-volume.mjs 的文件头） */
const GUARDED_SCRIPTS = [
    'check-layer-direction.mjs',
    'check-module-side-effects.mjs',
    'check-toplevel-new.mjs',
    'check-imperative-construction.mjs',
    'check-math-no-class.mjs',
    'check-readonly-array-fields.mjs',
];

const SCAN_VOLUME_URL = pathToFileURL(join(REPO, 'scripts', 'scan-volume.mjs')).href;

describe('扫描量自证判据（describeScanVolume）', () =>
{
    it('扫到 0 个（默认 min=1）判为异常，文案说清扫到了什么', () =>
    {
        const { ok, message } = describeScanVolume({ label: '测试扫描', count: 0 });

        expect(ok).toBe(false);
        expect(message).toContain(SCAN_VOLUME_FAILURE_PREFIX);
        expect(message).toContain('测试扫描');
        expect(message).toContain('只扫到 0 个');
    });

    it('扫到正数即达标，message 为空串', () =>
    {
        expect(describeScanVolume({ label: '测试扫描', count: 1 })).toEqual({ ok: true, message: '' });
        expect(describeScanVolume({ label: '测试扫描', count: 500 })).toEqual({ ok: true, message: '' });
    });

    it('min 可覆盖：count >= min 达标、count < min 异常', () =>
    {
        expect(describeScanVolume({ label: 'x', count: 2, min: 3 }).ok).toBe(false);
        expect(describeScanVolume({ label: 'x', count: 3, min: 3 }).ok).toBe(true);
    });

    it('detail 原样进失败文案（用于打印扫描根 / 扫描范围）', () =>
    {
        const { message } = describeScanVolume({ label: 'x', count: 0, detail: '扫描根：packages/' });

        expect(message).toContain('扫描根：packages/');
    });

    it('读数非法（NaN / 负数 / 非整数）一律判为异常', () =>
    {
        for (const bad of [Number.NaN, -1, 1.5])
        {
            const { ok, message } = describeScanVolume({ label: 'x', count: bad });

            expect(ok).toBe(false);
            expect(message).toContain('读数非法');
        }
    });

    it('label 缺失不抛错，用占位符', () =>
    {
        const { ok, message } = describeScanVolume({ count: 0 });

        expect(ok).toBe(false);
        expect(message).toContain('未命名扫描');
    });
});

describe('扫描量自证的退出码（子进程驱动 assertScanVolume）', () =>
{
    /** 在子进程里直接调 assertScanVolume——避开「在 vitest 进程里 process.exit」的问题 */
    function runAssertDriver(count: number)
    {
        const driver = [
            'import { assertScanVolume } from ' + JSON.stringify(SCAN_VOLUME_URL) + ';',
            'assertScanVolume({ label: "driver", count: ' + count + ', min: 1 });',
        ].join('\n');

        return spawnSync(process.execPath, ['--input-type=module', '--eval', driver], { encoding: 'utf8' });
    }

    it('扫到 0 个 → 退出码非 0，stderr 打印「扫描量自证失败」', () =>
    {
        const result = runAssertDriver(0);

        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain(SCAN_VOLUME_FAILURE_PREFIX);
    });

    it('扫到 1 个 → 退出码 0（不误报）', () =>
    {
        const result = runAssertDriver(1);

        expect(result.status).toBe(0);
    });
});

describe('真实门禁脚本：合成 cwd 下扫到 0 个必须退出非 0', () =>
{
    /** 在临时目录造一个**空的 packages/** 再跑脚本（脚本用 process.cwd() 当仓库根） */
    function runScriptOverEmptyPackages(script: string)
    {
        const dir = mkdtempSync(join(tmpdir(), 'feng3d-scan-volume-'));

        mkdirSync(join(dir, 'packages'), { recursive: true });

        try
        {
            return spawnSync(process.execPath, [join(REPO, 'scripts', script)], { cwd: dir, encoding: 'utf8' });
        }
        finally
        {
            rmSync(dir, { recursive: true, force: true });
        }
    }

    // 这三个脚本在扫描量断言之前只需要 packages/ 目录存在（不读基线 / schema 产物），
    // 因此可以用空目录干净地驱动。R2 两条与 imperative-construction 在断言之前要先读
    // 基线 / 入口清单 / schema 产物，合成环境得铺更多东西——本批用下面的接线断言守它们。
    for (const script of ['check-layer-direction.mjs', 'check-math-no-class.mjs', 'check-readonly-array-fields.mjs'])
    {
        it(script + '：空 packages/ → 退出码非 0 且报扫描量自证失败', () =>
        {
            const result = runScriptOverEmptyPackages(script);

            expect(result.status).not.toBe(0);
            expect(result.stderr).toContain(SCAN_VOLUME_FAILURE_PREFIX);
        });
    }
});

describe('接线自证：改动的脚本必须真的接上扫描量断言', () =>
{
    for (const script of GUARDED_SCRIPTS)
    {
        it(script + '：import 并调用 assertScanVolume', () =>
        {
            const source = readFileSync(join(REPO, 'scripts', script), 'utf8');

            expect(source).toContain("from './scan-volume.mjs'");
            expect(source).toContain('assertScanVolume(');
        });
    }
});
