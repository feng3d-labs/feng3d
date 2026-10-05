# 显式 asset id：现状核查与落地设计（#686 阶段 A）

> **本文是设计稿**（阶段 A），不含代码改动。它的作用是让阶段 B/C 可以"**按图纸施工**"。
>
> 编写时点：2026-10-05。核查方式：读源码（行号都写出来了），**不是**照抄旧文档。

---

## 0. 一句话结论（与预期相反）

**`ARCHITECTURE.md` §11-4 把这件事写成"引入显式 asset id"——但核查发现：id 早就是 uuid、
`.meta` 通道也早就写它了。真正缺的不是"引入"，而是"读取时把它恢复回来"。**

| 环节 | 现状 | 结论 |
|---|---|---|
| id 的表示 | `ReadRS.ts:106` `const assetId = mathUtilNewUuid()` | ✅ **已是 uuid**，不需要重新选型 |
| id 落盘 | `ReadRS.ts:113` `asset.meta = { guid: assetId, … }` → `FileAsset.ts:292` 写 `${assetPath}.meta` | ✅ **通道已有** |
| 预览通道 | `FileAsset.ts:314` `` return `previews/${this.assetId}.png` `` | ✅ **已按 id 命名** |
| 序列化引用 | `AssetData.ts:120` `assetPropertySign = 'assetId'`；`:131` `obj.assetId = asset.assetId`；`:143` `getLoadedAssetData(object.assetId)` | ✅ **写的就是 id，不是路径** |
| **读取恢复** | `FileAsset.ts` 的 `readMeta()` | ✅ **已修（阶段 B1，2026-10-05）**：现在从 `meta.guid` 恢复，缺 `guid` 时生成并补写 |

**全仓 `assetId` 只有两处被赋值**（`grep 'assetId\s*=[^=]'`）：

1. `packages/assets/src/rs/ReadRS.ts:112` —— **新建**资源时；
2. 测试里手写（`packages/assets/test/objectAssetReadFile.spec.ts:53` `asset.assetId = 'asset-1'`）。

**第 2 条本身就是侧证**：测试**必须手动设** id —— 说明读取路径确实不会给。

---

## 1. 这个缺口意味着什么

`FileAsset.assetId` 是**普通字段**（`FileAsset.ts:52` `assetId: string;`），不是从 `meta.guid` 取的 getter。
于是打开一个**已有**项目时：

- 每个资源的 `assetId` 是 `undefined`；
- 而 `ReadRS.ts:305` 用 `this._idMap[asset.assetId] = asset` 建索引 → 索引键成了 `'undefined'`；
- 场景/材质里序列化下来的 `assetId`（uuid）**在这一侧对不上任何东西** → `AssetData.getLoadedAssetData()` 拿不到数据。

**换句话说**：id 机制在"新建"那条路上是活的，在"打开已有项目"那条路上是**断的**。
这比"还没有 id"更隐蔽 —— 因为**新建之后当场一切正常**，只有重开项目才暴露。

> 这也解释了为什么 §11-4 的措辞会写成"引入"：从使用者的体感看，id 确实"没生效"。

---

## 2. 要定的事（三件，各有推荐）

### 2.1 id 的表示 —— **建议：维持 uuid，不再选型**

理由：`mathUtilNewUuid()` 已在用、`.meta` 的 `guid` 已经在写、`previews/{assetId}.png` 已经按它命名。
换成人可读的短 id 或路径派生哈希，**收益（好看）小于代价（既有资源的 id 全变）**。

**已知取舍**：uuid 不人可读。若将来需要人可读的稳定标识，应做成**额外的 `alias` 字段**，
而不是改 `guid` —— 那是一个**加法**，不影响已有引用。

### 2.2 id 存在哪 —— **建议：`.meta` 是唯一权威，内存索引由它建**

现状是"路径 → id"的内存映射（`EditorAsset._assetPathMap`）由**目录扫描**建立，
而 `.meta` 里那份 `guid` **没人读**（见 §0）。建议：

- **`.meta.guid` 是持久层权威**：扫描到一个资源时，先读 `.meta`，用它的 `guid` 当 `assetId`；
- **内存里的 `_idMap` / `_pathMap` 都从它派生**（一个是 id→资源，一个是路径→资源）；
- **没有 `.meta` 的资源**（老项目 / 手动拷进来的文件）：**当场生成 uuid 并补写 `.meta`**
  —— 这就是"迁移"最自然的形式：**不需要一次性搬库**，谁被打开谁补。

### 2.3 重命名 / 移动的权威 —— **建议：id 不变，路径只是"当前位置"**

因为序列化写的是 id（§0 第 4 行），只要 §2.2 落实，**重命名与移动天然安全**：
文件名字变了，`.meta` 跟着走（`metaPath` 是从 `assetPath` 算的，`FileAsset.ts:275`），`guid` 不变。

**要补的一条**：`.meta` 必须**跟着文件一起移动/重命名**。现在 `FileAsset.delete()` 会删 `.meta`（`:300`），
但**移动**那条路要确认它同步搬了 `.meta` —— 否则 id 就丢了。**这是阶段 B 的第一条判据**。

---

## 3. 建议的阶段划分（每阶段可独立验收）

| 阶段 | 改什么 | 验收（**可机器判**） |
|---|---|---|
| ~~**B1**~~ ✅ **已完成（2026-10-05）** | 读取时恢复 id：`readMeta()` 用 `meta.guid` 设 `assetId`，缺 `guid` 时生成并**补写** | ✅ `packages/assets/test/assetIdRestore.spec.ts` 两条：**同一性**（写下去的就是读回来的）+ 老资源补写后**再读还是同一个 id**。**并做过翻转验证**：把实现改成返回错值时两条都变红 |
| ~~**B2**~~ ✅ **已完成（2026-10-05）** | 移动时 `.meta` 跟着走 | ✅ `packages/assets/test/readWriteRS.spec.ts` 的「完整移动流程」用例：**位置真的变了** / 旧 `.meta` 没了 / 新 `.meta` 在且 **guid 不变** / **id 不变**。**查下来机制本来就对**（`metaPath` 从 `assetPath` 派生，`delete()` 删旧、`write()` 写新）——**真正坏的是新路径本身算错了**：`moveAsset` 用尚未修改的 `parentAsset` 算，等于「删掉再写回原处」。判据**先红后绿**，红的原文记在同批 PR 里 |
| ~~**B3**~~ ✅ **核心已随 B1 落地（2026-10-05）** | 老资源补 `.meta` | B1 的 `readMeta()` 在 `guid` 缺失时就**当场生成并补写**，判据「**再读一次还是同一个 id**」正是这一条的验收。**仍待做**的是「一整个目录首次打开」的集成用例（现在验的是单个资源） |
| ~~**B4**~~ ✅ **已完成（2026-10-05）** | 引用与路径解耦（原写「发布时按 id 重写引用」） | ✅ **查下来不需要实现**：`AssetData.serialize` 写出的只有 `{ __class__, assetId }`（`:120/131`），**引用里根本没有路径**；反序列化按 id 查（`:143` → `:154` → `idAssetMap`）。所以改名 / 移动**天然**不影响引用，**只要 id 本身稳定**（那是 B1 的事）。判据见 `packages/assets/test/assetIdRestore.spec.ts` 的「引用是 id 而不是路径」：改掉 `assetPath` 之后序列化结果**逐字节不变** + 按 id 仍解得开。**并做过翻转验证**：往序列化里加一个 `assetPath` 时该用例变红（红在「逐字节等价」那条）|

**B1 是解锁点**：#274 的项目目录布局（`scenes/` / `scripts/` / `assets/`）与 #278 的混合体拆分
都等它 —— 因为在 id 会丢的前提下，**任何"把目录重新组织一遍"的动作都在冒丢引用的风险**。

---

## 4. 判据的形状（写下来给阶段 B 用）

**别用"`assetId` 非空"当判据** —— 重新生成一个 uuid 也能让它非空，而引用照样是断的。
要用**同一性**：

```
写入时的 id === 重新读取后的 id
```

这与本仓其它几处判据是同一种思路（`#273` 的"取消要看 Promise 何时 settle"、
"taskId 两次必须不同"）：**判据得盯着那个能证伪的差异**。

---

## 5. 与决策 5 的关系（需要更正的地方）

`ARCHITECTURE.md` §11-4 现在写的是"**已决策（2026-10-05）：引入显式 asset id**。代价是既有资源与序列化格式要迁移"。

按本文核查，**更准确的表述**是：

> 资源身份**本来就是 id**（uuid + `.meta.guid` + `previews/{assetId}.png` + 序列化写 `assetId`）；
> **缺的是"读取时恢复它"**（§0 表格最后一行）。所以"迁移"的量级**远小于**原判断 ——
> 不是重做序列化格式，而是**补上恢复 + 让 `.meta` 跟着文件走 + 给老资源补写**。

**这条更正建议由需求方确认**：如果确认，阶段 B 的工作量大约是一两批，而不是"大工程"。
