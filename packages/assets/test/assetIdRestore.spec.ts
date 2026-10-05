// 先加载 feng3d 让循环依赖的入口从 feng3d 这一侧进入（与 ObjectAsset 的 spec 同一理由）
import 'feng3d';
import { describe, expect, it } from 'vitest';
import { Object3DAsset } from '../src/assets/Object3DAsset';
import { AssetData } from '../src/AssetData';
import type { AssetMeta } from '../src/AssetMeta';
import type { ReadWriteRS } from '../src/rs/ReadWriteRS';

/**
 * `assetId` 的**恢复**（#686 阶段 B1）。
 *
 * ## 这条用例在守什么
 *
 * `assetId` **不是**每次打开时新生成的：序列化里写的 `assetId`（`AssetData` 的
 * `assetPropertySign`）就是 `.meta.guid`，两边必须对上。而在此之前 `readMeta()`
 * **只设 `this.meta`、从不设 `assetId`** —— 于是打开已有项目时每个资源的 id 都是
 * `undefined`，以 id 为键的索引跟着塌掉。
 *
 * **这个错很难被发现**：新建一个资源之后当场一切正常（id 是刚生成的），
 * 只有**重开项目**才暴露。所以用例必须**换一个新实例**、且**不预先设 id**。
 *
 * ## 判据的形状
 *
 * **不用「`assetId` 非空」** —— 重新生成一个 uuid 也能让它非空，而引用照样是断的。
 * 用的是**同一性**：`写入时的 id === 重新读取后的 id`。
 */
class MemoryAssetStorage
{
    /** 写出的文件内容，按路径存放（读与写共用一份，模拟落盘再读回） */
    readonly written: Record<string, unknown> = {};

    /** 内存文件系统 */
    readonly fs = {
        writeObject: async (path: string, object: unknown) => { this.written[path] = object; },
        readObject: async (path: string) => this.written[path],
    };
}

/** 造一个**只设了 rs 与路径、没设 assetId** 的资源（模拟「重开项目」时刚扫描到的状态） */
function createBareAsset(storage: MemoryAssetStorage, assetPath: string)
{
    const asset = new Object3DAsset();

    asset.rs = storage as unknown as ReadWriteRS;
    asset.assetPath = assetPath;

    return asset;
}

/** 走一遍 `readMeta`（protected，测试里直取；正是 B1 改动的那个方法） */
async function readMetaOf(asset: Object3DAsset)
{
    await (asset as unknown as { readMeta: () => Promise<void> }).readMeta();
}

describe('引用是 id 而不是路径（#686 阶段 B4）', () =>
{
    /**
     * 这一组守的是 **#686 阶段 B4** 那条验收：**把引用的文件名改掉，引用不能断**。
     *
     * 查下来它**不需要实现**：`AssetData.serialize` 写出来的只有 `{ __class__, assetId }`
     * —— **引用里根本没有路径**（`AssetData.ts:120/131`），反序列化按 id 查
     * （`:143` → `:154` → `idAssetMap`）。所以改名 / 移动天然不影响引用，
     * **只要 id 本身稳定**（那是 B1 的事）。
     *
     * 正因为「不需要实现」，这条更值得**用判据钉住**：哪天有人在序列化里顺手加上路径
     * （看起来是"更方便调试"），引用就会重新变得脆弱 —— 而那时**不会有别的测试报警**。
     */
    it('**改了 assetPath 之后**，序列化结果逐字节不变、按 id 仍解得开', () =>
    {
        const data = { __type__: 'Object3D', name: '被引用的家伙' };
        const asset = new Object3DAsset();

        asset.assetId = 'the-stable-id';
        asset.data = data;

        // 登记（反序列化时就是靠它按 id 查回来）
        AssetData.addAssetData('the-stable-id', data);

        const before = AssetData.serialize(asset);

        // **序列化里没有路径** —— 这是「改名不断引用」的全部根据
        expect(before.assetId).toBe('the-stable-id');
        expect((before as { assetPath?: string }).assetPath).toBeUndefined();

        // 重命名 + 移动：只动 assetPath
        asset.assetPath = 'Assets/Renamed/Whatever.gameobject.json';

        const after = AssetData.serialize(asset);

        // 逐字节等价（不是"看起来差不多"）
        expect(JSON.stringify(after)).toBe(JSON.stringify(before));

        // 而且按 id 解得开
        expect(AssetData.deserialize(after)).toBe(data);
    });
});

describe('assetId 从 .meta 恢复（#686 阶段 B1）', () =>
{
    it('**同一性**：写下去的 guid，重新读取后就是 assetId（不是重新生成的）', async () =>
    {
        const storage = new MemoryAssetStorage();
        const path = 'Assets/A.gameobject.json';

        storage.written[`${path}.meta`] = {
            guid: 'the-id-from-disk',
            mtimeMs: 1,
            birthtimeMs: 1,
            assetType: 'gameobject',
        } as unknown as AssetMeta;

        // 新实例、**不设 assetId** —— 这才等价于"重开项目"
        const asset = createBareAsset(storage, path);

        await readMetaOf(asset);

        expect(asset.assetId).toBe('the-id-from-disk');
    });

    it('老资源没有 guid 时：当场生成并**补写**，且**再读一次还是同一个 id**', async () =>
    {
        const storage = new MemoryAssetStorage();
        const path = 'Assets/Old.gameobject.json';
        const metaPath = `${path}.meta`;

        // 老资源的 meta：没有 guid（类型上 guid 必需，但运行期的老文件可能就是这样）
        storage.written[metaPath] = {
            mtimeMs: 1,
            birthtimeMs: 1,
            assetType: 'gameobject',
        } as unknown as AssetMeta;

        const first = createBareAsset(storage, path);

        await readMetaOf(first);

        expect(typeof first.assetId).toBe('string');
        expect(first.assetId.length).toBeGreaterThan(0);

        // **补写**了：`.meta` 里现在有 guid
        expect((storage.written[metaPath] as { guid?: string }).guid).toBe(first.assetId);

        // 再读一次（又一个新实例）→ **同一个 id** —— 这一条才证明"补写真的生效"，
        // 否则每次打开都会生成一个新的 uuid，引用还是断的
        const second = createBareAsset(storage, path);

        await readMetaOf(second);

        expect(second.assetId).toBe(first.assetId);
    });
});
