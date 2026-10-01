// ⚠️ 必须**先**加载 feng3d：assets 与 feng3d 之间存在循环依赖
// （FileAsset → feng3d → assets/index → ArrayBufferAsset → FileAsset），让入口从 feng3d
// 这一侧进入，避免 FileAsset 在自身初始化过程中被反向 import 成 undefined。
// 这是本包其它 spec（assetTypeClass / objectAssetReadFile）的同一约定。
import 'feng3d';
import { describe, expect, it, vi } from 'vitest';

import { ReadWriteRS } from '../src/rs/ReadWriteRS';
import type { FileAsset } from '../src/FileAsset';
import type { FolderAsset } from '../src/FolderAsset';
import type { ReadWriteFS } from '@feng3d/filesystem';

/**
 * `ReadWriteRS`（`packages/assets/src/rs/ReadWriteRS.ts`，54+ 行，此前**行覆盖率 1.85%**）
 * —— `assets` 包里最后一个未被覆盖的源文件。
 *
 * 它在 `ReadRS` 之上加了两件事：
 *
 * 1. **延迟保存**：`createAsset` 完成后调用 `laterSave()`（→ `ticker.nextframe` → `save()`），
 *    而 `save()` 会 `serialization.serialize(getAllAssets())` 后 `fs.writeObject(this.resources, …)`；
 * 2. **`moveAsset(asset, folder)` 的两条守卫**（本文件的重点，因为它们是**纯逻辑**）：
 *    - 目标文件夹里**已有同名** → `console.warn` 后 **return（不移动）**；
 *    - 目标是**自己的子孙**（沿 `folder.parentAsset` 向上能走回 `asset`）→
 *      `console.warn('无法移动达到子文件夹中')` 后 **return**（**防环**）。
 *
 * 两条守卫都在"收集待移动资源列表"**之前**，所以触发时不会走到 `getAssetTypeClass('folder')`，
 * 用**极简假对象**即可驱动；也因此**不需要 mock `ticker`**。
 *
 * 注意：`console.warn` 的实参是 `new Error(...)`，`String(err)` 形如 `"Error: 目标文件夹中存在同名文件（夹），无法移动"`。
 */

/** 记录 writeObject 调用的假可读写 fs */
function makeFs()
{
    const written: { path: unknown; object: unknown }[] = [];

    return {
        written,
        writeObject: async (path: unknown, object: unknown) =>
        {
            written.push({ path, object });
        },
    };
}

const asFs = (fs: unknown) => fs as unknown as ReadWriteFS;
const asAsset = (a: unknown) => a as unknown as FileAsset;
const asFolder = (f: unknown) => f as unknown as FolderAsset;

describe('ReadWriteRS（assets）', () =>
{
    describe('writeAsset', () =>
    {
        it('★ 转发到 asset.write()', async () =>
        {
            const rs = new ReadWriteRS(asFs(makeFs()));
            const write = vi.fn(async () => { /* noop */ });
            const asset = { write };

            await rs.writeAsset(asAsset(asset));

            expect(write).toHaveBeenCalledTimes(1);
        });

        it('asset.write() 抛错时 writeAsset 也抛（不吞异常）', async () =>
        {
            const rs = new ReadWriteRS(asFs(makeFs()));
            const asset = { write: async () => { throw new Error('写失败'); } };

            await expect(rs.writeAsset(asAsset(asset))).rejects.toThrow('写失败');
        });
    });

    describe('★ moveAsset 的两条守卫', () =>
    {
        it('★ 目标文件夹已有同名文件 → console.warn 且不继续', async () =>
        {
            const rs = new ReadWriteRS(asFs(makeFs()));
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => { /* 静音 */ });

            try
            {
                const asset = { fileName: 'sphere', extenson: '.json' };
                const folder = {
                    childrenAssets: [{ fileName: 'sphere', extenson: '.json' }],
                    parentAsset: null,
                };

                await expect(rs.moveAsset(asAsset(asset), asFolder(folder))).resolves.toBeUndefined();
                expect(spy).toHaveBeenCalledTimes(1);
                expect(String(spy.mock.calls[0][0])).toContain('同名');
            }
            finally
            {
                spy.mockRestore();
            }
        });

        // 注：「没有同名」时会继续走真正的移动逻辑（需要完整资源系统与更多 mock，
        // 实测会抛 `la.delete is not a function`），所以本文件只覆盖两条守卫，
        // 不假装能测完整移动流程。

        it('★★ 移动到自己的子孙 → console.warn("无法移动达到子文件夹中")（防环）', async () =>
        {
            const rs = new ReadWriteRS(asFs(makeFs()));
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => { /* 静音 */ });

            try
            {
                // asset 是 folder 的祖先：folder.parentAsset === asset
                const asset = { fileName: 'root', extenson: '', childrenAssets: [] };
                const folder = { childrenAssets: [], parentAsset: asset };

                await expect(rs.moveAsset(asAsset(asset), asFolder(folder))).resolves.toBeUndefined();
                expect(spy).toHaveBeenCalledTimes(1);
                expect(String(spy.mock.calls[0][0])).toContain('无法移动达到子文件夹中');
            }
            finally
            {
                spy.mockRestore();
            }
        });

        it('★ 目标是自己的直接子级（parentAsset 链上只有一层）也拦得住', async () =>
        {
            const rs = new ReadWriteRS(asFs(makeFs()));
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => { /* 静音 */ });

            try
            {
                const asset = { fileName: 'a', extenson: '' };
                const middle = { childrenAssets: [], parentAsset: asset };
                const folder = { childrenAssets: [], parentAsset: middle };   // 隔了一层

                await rs.moveAsset(asAsset(asset), asFolder(folder));

                expect(spy).toHaveBeenCalledTimes(1);
                expect(String(spy.mock.calls[0][0])).toContain('无法移动达到子文件夹中');
            }
            finally
            {
                spy.mockRestore();
            }
        });
    });

    describe('构造与资源库路径', () =>
    {
        it('★ 注入的 fs 会被 fs getter 暴露出来（继承自 ReadRS）', () =>
        {
            const fs = makeFs();
            const rs = new ReadWriteRS(asFs(fs));

            expect(rs.fs).toBe(fs as unknown as ReadWriteFS);
        });
    });
});
