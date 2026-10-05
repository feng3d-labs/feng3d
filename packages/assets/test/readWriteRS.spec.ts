// ⚠️ 必须**先**加载 feng3d：assets 与 feng3d 之间存在循环依赖
// （FileAsset → feng3d → assets/index → ArrayBufferAsset → FileAsset），让入口从 feng3d
// 这一侧进入，避免 FileAsset 在自身初始化过程中被反向 import 成 undefined。
// 这是本包其它 spec（assetTypeClass / objectAssetReadFile）的同一约定。
import 'feng3d';
import { describe, expect, it, vi } from 'vitest';

import { ReadRS } from '../src/rs/ReadRS';
import { ReadWriteRS } from '../src/rs/ReadWriteRS';
import type { FileAsset } from '../src/FileAsset';
import type { FolderAsset } from '../src/FolderAsset';
import type { ReadWriteFS } from '@feng3d/filesystem';
import { Object3DAsset } from '../src/assets/Object3DAsset';

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

    describe('★ moveAsset 的完整流程（#686 阶段 B2）', () =>
    {
        /**
         * 这一条补的是上面那句注释留下的空白：「没有同名时会继续走真正的移动逻辑
         * （需要完整资源系统与更多 mock）」—— 本用例就把那些 mock 补齐了，
         * 于是能验证**位置真的变了**、以及 `.meta` 跟着走、id 不变。
         *
         * 移动的三件事（`FileAsset` 侧）：`delete()` 删旧主文件 + 旧 `.meta`；
         * `assetPath` 改掉（`metaPath` 是从它派生的）；`write()` 在新位置写主文件 + 新 `.meta`。
         */
        it('移动后 assetPath 是**新位置**，`.meta` 跟着走，id 不变', async () =>
        {
            const oldPath = 'Assets/A.gameobject.json';
            const newFolderPath = 'Assets/Sub';

            const files: Record<string, unknown> = {};
            const fs = {
                writeObject: async (p: string, o: unknown) => { files[p] = o; },
                readObject: async (p: string) => files[p],
                deleteFile: async (p: string) => { delete files[p]; },
            };

            const rs = new ReadWriteRS(asFs(fs));

            // 只把「资源系统」那部分换成替身；`moveAsset` 真正做事的
            // `deleteAsset` / `writeAsset`（→ `asset.delete()` / `asset.write()`）走**真的**
            (rs as unknown as Record<string, unknown>).readAsset = async () => undefined;
            (rs as unknown as Record<string, unknown>).addAsset = () => undefined;
            (rs as unknown as Record<string, unknown>).laterSave = () => undefined;
            // `_idMap` 是 `ReadRS` 的实例字段，正常情况下由 `addAsset` 建；这里恒为空对象
            (rs as unknown as Record<string, unknown>)._idMap = {};
            // `FileAsset.delete()` 走的是**全局单例** `ReadRS.rs`（不是 `this.rs`），
            // 所以实例上的替身拦不住它 —— 得把这个单例也指过来
            (ReadRS as unknown as { rs: unknown }).rs = rs;

            const target = { childrenAssets: [], fileName: 'Sub', assetPath: newFolderPath, parentAsset: null };
            const oldParent = { childrenAssets: [], fileName: 'Assets', assetPath: 'Assets', parentAsset: null };

            // `parentAsset` 是从 `assetPath` 的目录名查出来的，所以这里要能查到「旧父」
            (rs as unknown as Record<string, unknown>).getAssetByPath = (p: string) =>
                (p === newFolderPath ? target : (p === 'Assets' ? oldParent : undefined));

            const asset = new Object3DAsset();

            asset.rs = rs;
            asset.assetPath = oldPath;
            asset.assetId = 'the-id';
            asset.meta = { guid: 'the-id', mtimeMs: 1, birthtimeMs: 1, assetType: 'gameobject' } as never;
            asset.data = {};

            // `deleteAssetById` 是「按 id 查出资源再删」，所以索引里得有它
            // （正常运行时由 `addAsset` 建；这里直接摆好，免得把 `FolderAsset` 那一套也拖进来）
            ((rs as unknown as Record<string, unknown>)._idMap as Record<string, unknown>)['the-id'] = asset;

            await rs.moveAsset(asAsset(asset), asFolder(target));

            // ① **位置真的变了**（这一条是缺口的正面证据）
            expect(asset.assetPath).toBe(`${newFolderPath}/A.gameobject.json`);

            // ② 旧位置的 `.meta` 没了
            expect(files[`${oldPath}.meta`]).toBeUndefined();

            // ③ 新位置的 `.meta` 在，且 **guid 不变**（id 稳定 = 引用不断）
            expect((files[`${newFolderPath}/A.gameobject.json.meta`] as { guid: string }).guid).toBe('the-id');

            // ④ id 本身不变
            expect(asset.assetId).toBe('the-id');
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
