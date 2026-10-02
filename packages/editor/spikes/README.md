# 编辑器前置验证脚本（spikes）

> 状态：**可执行的证据**。本目录放**能被人自己跑一遍**的验证脚本，用来支撑
> `docs/ARCHITECTURE.md` / `docs/PLUGINS.md` / `docs/NODE_HOST.md` 里的结论。

## 为什么单独一个目录（而不是 `tmp/`）

本仓 `tmp/` 在 `.gitignore` 里（`.gitignore:73`），放那里的脚本**别人复核不了**。
这已经造成过一次悬案：`docs/PLUGINS.md` 的「阶段性验证记录」引用 `tmp/cordis-spike/entry.mjs`
与一次 27.2 KB 的打包实测，而**该文件在仓库里根本不存在**——文档写着一个查不到出处的结论。

规矩由此定为：**凡是文档要引用的实测数据，脚本必须入库**。
一次性、不可复现的探针仍然可以放 `tmp/`（那里还有别的东西），但**不要写进文档当依据**。

## 脚本清单

| 脚本 | 回答什么 | 对应 issue 的验收 |
|---|---|---|
| `cordis-dispose.mjs` | cordis 的 `inject` 等待与 `fiber.dispose()` 撤销：卸载后**定时器与监听真的不再触发**吗 | #276 验收 ①「装/卸纯服务插件：撤销后监听与定时器确实不再触发」 |
| `cordis-bundle.mjs` | cordis 打成**浏览器产物**要多大、带不带 `node:` 依赖（Web 半也是 cordis 插件的前提） | #276 任务「Web 端同样是 cordis 插件」（照搬 DSH dual-half） |
| `cordis-runtime-surface.mjs` | cordis 各包的**运行时归属**：哪些能进浏览器、哪些是 Node-only | 决定"浏览器端装载必须自建"这条**与选型无关**的工程量（见决策稿 §2.4） |
| `cordis-service.mjs` | cordis **服务**与**子 fiber 卸载级联**：插件卸载后它的注册、监听、定时器是否一起消失；顺带钉住三条硬约束（Service 不能用 `#` 私有字段、`register` 显式收调用方 `ctx`、插件访问服务要 `inject` 声明） | #276 阶段 2：插槽注册表换成 cordis 服务后的机制基础 |

## 怎么跑

前三个**不往仓库装依赖**，从本机已有位置探测；第四个（`cordis-service.mjs`）**直接用
`packages/editor` 的依赖**（阶段 2 起 `@deepseek-ai/cordis` 已是它的正式依赖）：

```bash
node packages/editor/spikes/cordis-dispose.mjs
node packages/editor/spikes/cordis-bundle.mjs
node packages/editor/spikes/cordis-runtime-surface.mjs
node packages/editor/spikes/cordis-service.mjs
```

探测顺序：

| 依赖 | 顺序 |
|---|---|
| cordis（`@deepseek-ai/cordis`，DSH 分叉稳定线 4.0.4） | `CORDIS_ENTRY` → `$DSH_HOME/profiles/node_modules/` → `~/.dsh/profiles/node_modules/` |
| cordis 相关包目录（只 `cordis-runtime-surface.mjs` 需要） | `CORDIS_PACKAGES_DIR` → `$DSH_HOME/profiles/node_modules/@deepseek-ai/` |
| esbuild（只 `cordis-bundle.mjs` 需要） | `ESBUILD_ENTRY` → 仓库 `node_modules/` → DSH profile |

缺少时脚本会**说清要什么**并以退出码 2 结束；断言失败退出码 1，全部通过退出码 0。

## 与测试 / CI 的关系

它们是**探针**，不是产品的单元测试：断言的是**依赖库的语义**（cordis 的撤销、打包结果），
因此**故意不放进 `test/`**、也不计入覆盖率——依赖升级时应当**主动重跑**（而不是让 CI 每天
替你跑一遍别人的库）。结论与实测输出记在 `docs/PLUGIN_TRIPLE_HALF.md`（#276 的前置决策稿）。

## 结论会过期，重跑时机

- 换 cordis 线（上游 `cordiverse/cordis` RC ↔ `@deepseek-ai/cordis`）或升级版本时；
- 编辑器改用别的打包器 / 改 `external` 策略时；
- `docs/ARCHITECTURE.md` §6.6 的装载机制（入口图 / 模块表）变化时。
