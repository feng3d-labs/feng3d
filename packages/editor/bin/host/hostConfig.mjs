import { existsSync, readFileSync } from 'node:fs';
import { Service } from '@deepseek-ai/cordis';
import * as jsonc from 'jsonc-parser';

/**
 * 宿主**配置服务**（#272 P2 的另一半）。
 *
 * ## 层叠加：内置 → 项目 → 用户
 *
 * 这是编辑器插件清单早就有的层序（`内置 < 插件 < 用户`），宿主侧照搬同一套：**后面的层赢**。
 * 每一层都是"一层纯数据"，`HostConfig` 负责按顺序深合并——于是"默认值在代码里、项目改它自己那份、
 * 用户在命令行再盖一层"这件事只有一处实现。
 *
 * ## 深合并的规则（写清楚，免得各处猜）
 *
 * | 情况 | 行为 |
 * |---|---|
 * | 两边都是普通对象 | **递归合并**（子键按同一规则） |
 * | 其它（标量 / 数组 / 类型不同） | **整块替换**（数组不做逐项合并——"我给的数组就是我要的"） |
 *
 * ## 为什么用 JSONC
 *
 * 配置文件是给人写的：允许注释与尾逗号，读者才能写"这行为什么这么配"。
 * 解析用仓库已有的 `jsonc-parser`（编辑器本来就依赖它）。
 *
 * ## 坏配置不拖垮宿主
 *
 * 一层读坏了只丢那一层（并记进 `problems`）——与"坏插件配置只丢那一条"同一纪律：
 * 配置写错是常事，不该让编辑器起不来。
 */
export class HostConfig extends Service
{
    /** 已叠加的层（从低到高优先级；诊断用） */
    layers = [];

    /** 被丢掉的层与原因 */
    problems = [];

    /** 合并后的配置（只读快照） */
    values = {};

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ defaults?: object, files?: string[], overrides?: object }} [config] 初始层
     */
    constructor(ctx, config = {})
    {
        super(ctx, 'hostConfig');

        if (config.defaults !== undefined) this.use('内置默认', config.defaults);

        for (const file of config.files ?? []) this.useFile(file);

        // **空覆盖层不叠**：否则层序里会凭空出现"命令行覆盖"，
        // 看日志的人会以为用户给了参数（实际什么都没给）
        if (config.overrides !== undefined && Object.keys(config.overrides).length > 0)
        {
            this.use('命令行覆盖', config.overrides);
        }
    }

    /**
     * 叠加一层（纯数据）。
     *
     * @param {string} name 层名（诊断用：`内置默认` / `项目配置` / `命令行覆盖`…）
     * @param {object} layer 该层的数据
     * @returns {object} 合并后的配置
     */
    use(name, layer)
    {
        if (!isPlainObject(layer)) throw new Error(`配置层 ${name} 不是对象`);

        this.layers.push(name);
        this.values = mergeObjects(this.values, layer);

        return this.values;
    }

    /**
     * 读一个配置文件（JSONC）并叠加成一层。
     *
     * 文件不存在是**正常状态**（不记问题）；解析失败只丢这一层并记进 `problems`。
     *
     * @param {string} path 文件路径
     * @param {string} [name] 层名（缺省用文件名）
     * @returns {boolean} 是否成功叠加
     */
    useFile(path, name)
    {
        if (!existsSync(path)) return false;

        let layer;

        try
        {
            // Windows 上很常见：记事本 / PowerShell 存的 UTF-8 会带 BOM，而 JSONC 解析器不认它
            //（手动验证时就是这么撞上的：文件看着没问题，报 `InvalidSymbol（偏移 0）`）
            layer = parseJsonc(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
        }
        catch (error)
        {
            this.problems.push(`配置层读不了（${path}）：${error.message}`);

            return false;
        }

        this.use(name ?? path, layer);

        return true;
    }

    /**
     * 读一个配置项（支持点路径）。
     *
     * @param {string} key 键（如 `bridge.port`）
     * @param {unknown} [fallback] 取不到时的缺省值
     * @returns {unknown} 值
     */
    get(key, fallback)
    {
        const value = key.split('.').reduce((current, part) =>
            (isPlainObject(current) ? current[part] : undefined), this.values);

        return value === undefined ? fallback : value;
    }
}

/**
 * 判断是不是"普通对象"（数组与 null 都不算）。
 *
 * @param {unknown} value 值
 * @returns {boolean} 是否普通对象
 */
function isPlainObject(value)
{
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 深合并两个对象（规则见类注释）。
 *
 * @param {object} base 底层
 * @param {object} patch 上层（赢）
 * @returns {object} 合并结果（新对象，不改入参）
 */
function mergeObjects(base, patch)
{
    if (!isPlainObject(base) || !isPlainObject(patch)) return patch;

    const merged = { ...base };

    for (const [key, value] of Object.entries(patch)) merged[key] = mergeObjects(base[key], value);

    return merged;
}

/**
 * 解析 JSONC（允许注释与尾逗号）。
 *
 * 用 `jsonc-parser` 的 `parse`：它对错误**不抛**，而是把错误收集起来——
 * 这里显式转成抛错，让调用方（`useFile`）走统一的"丢这一层"路径。
 *
 * @param {string} text 文本
 * @returns {object} 解析结果
 */
function parseJsonc(text)
{
    const { parse, printParseErrorCode } = jsonc;
    const errors = [];
    const value = parse(text, errors, { allowTrailingComma: true, disallowComments: false });

    if (errors.length > 0)
    {
        const first = errors[0];

        throw new Error(`${printParseErrorCode(first.error)}（偏移 ${first.offset}）`);
    }

    return value;
}
