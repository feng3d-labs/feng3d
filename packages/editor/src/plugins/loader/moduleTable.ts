/**
 * **模块表**：把"包名 → client 半模块"这件事收成可替换的一层（#276 阶段 4）。
 *
 * ## 为什么要单独一层
 *
 * 运行时装载的本质是"编辑器在**构建图之外**拿一个模块"。默认实现就是动态 `import()`，
 * 但这一层必须能替换，原因有三：
 *
 * 1. **测试**：装载器的用例要能喂"假的 client 半"，不必真的写一个包到磁盘上；
 * 2. **将来换模块格式**（决策稿 §3.5 的 M1 → M2）：M2 是"自建工厂表 + 冻结基座表"，
 *    那时这一层改成查表即可，装载器与清单侧一行不用动；
 * 3. **宿主分发**（#272）：宿主可以决定"这个包从哪个 URL 取"。
 *
 * ## 默认实现的两个细节
 *
 * - `/* @vite-ignore *\/`：告诉打包器**不要**静态分析这个说明符——它本来就可能是运行时才知道的
 *   （这也是"插件包不在构建图里"的技术含义）；
 * - 失败不抛到调用方：装载器要把它变成"装载失败是数据"（见 `types.ts` 的 `PluginLoadOutcome`）。
 */

/** 模块表的形状：给一个说明符，拿一个模块 */
export type ClientHalfImporter = (specifier: string) => Promise<unknown>;

/**
 * 默认导入器：动态 `import()`。
 *
 * `@vite-ignore` 是必需的：说明符可能来自宿主给的入口图，构建期无法枚举。
 */
const defaultImporter: ClientHalfImporter = (specifier) => import(/* @vite-ignore */ specifier);

/** 当前导入器（lazy：模块顶层不建对象、不执行装载，对齐 R2） */
let currentImporter: ClientHalfImporter | null = null;

/**
 * 取当前导入器。
 *
 * @returns 导入器（默认是动态 `import()`）
 */
export function getClientHalfImporter(): ClientHalfImporter
{
    return currentImporter ?? defaultImporter;
}

/**
 * 替换导入器（测试、以及将来 M2 模块格式 / 宿主分发用）。
 *
 * @param importer 新的导入器
 */
export function setClientHalfImporter(importer: ClientHalfImporter): void
{
    currentImporter = importer;
}

/** 复位导入器（**只给单元测试**：模块级状态，用例之间要能互相隔离） */
export function resetClientHalfImporter(): void
{
    currentImporter = null;
}
