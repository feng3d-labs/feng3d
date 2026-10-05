import { beforeEach, describe, expect, it } from 'vitest';
import { getAiToolContributions, getContributionTable, registerPlugins, resetPlugins } from '../src/plugins/registry';
import { EDITOR_PLUGIN_API_VERSION, setPluginEnabled } from '../src/plugins';
import type { AiToolContribution, EditorPluginManifest } from '../src/plugins';

/**
 * AI 工具贡献点（#281 路径 A）。
 *
 * 守的是"**插件能自带 AI 工具**"这条契约的**编辑侧一半**：
 * 贡献进表（带来源与层）、跟着启用状态走、同层重名被拒、层叠加上层赢且留痕。
 *
 * 消费侧（MCP 的 `tools/list` 现算合并）不在这里——它由 `scripts/editor-mcp-check.mjs`
 * 与真 server 守（离线自检 + 真启 server 取 `tools/list`）。
 */

/** 造一个最小 aiTool */
function aiTool(name: string, method: string): AiToolContribution
{
    return {
        name,
        method,
        description: `${name} 的说明：足够长，MCP 一致性门禁要求描述不小于 10 个字`,
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    };
}

/** 造一份只贡献 aiTools 的最小清单 */
function manifest(id: string, aiTools: readonly AiToolContribution[]): EditorPluginManifest
{
    return { id, name: `插件 ${id}`, apiVersion: EDITOR_PLUGIN_API_VERSION, contributes: { aiTools } };
}

beforeEach(() =>
{
    resetPlugins();
});

describe('AI 工具贡献点（#281 路径 A）', () =>
{
    it('贡献的 aiTool 进贡献表，并带来源插件与层', () =>
    {
        registerPlugins([manifest('p1', [aiTool('rotate_spin', 'rotate.spin')])]);

        const table = getContributionTable();

        expect(table.aiTools.map((tool) => [tool.name, tool.method, tool.source, tool.layer]))
            .toEqual([['rotate_spin', 'rotate.spin', 'p1', 'plugin']]);
        // 插件条目上也要能看到"它贡献了几个 AI 工具"（设置面板/排查要用）
        expect(table.plugins[0].aiTools).toBe(1);
        expect(getAiToolContributions().length).toBe(1);

        // **完整定义必须传到消费侧**：MCP 侧直接拿它当工具定义。
        // 只传名字的话，AI 看到的是"没有说明、参数未知的工具"——
        // 这个断链是端到端脚本 `editor-mcp-plugin-tools.mjs` 抓到的，不是离线门禁
        expect(table.aiTools[0].description).toContain('说明');
        expect(table.aiTools[0].inputSchema).toMatchObject({ type: 'object' });
    });

    it('禁用插件后它的 aiTool 从表里消失（与其它贡献点同一条纪律）', () =>
    {
        registerPlugins([manifest('p1', [aiTool('rotate_spin', 'rotate.spin')])]);
        setPluginEnabled('p1', false);

        expect(getContributionTable().aiTools).toEqual([]);
    });

    it('同层重名的 aiTool 被拒绝（不是静默顶掉）', () =>
    {
        registerPlugins([manifest('p1', [aiTool('dup_tool', 'a.b')])]);

        expect(() => registerPlugins([manifest('p2', [aiTool('dup_tool', 'c.d')])]))
            .toThrow(/同层冲突/);
    });

    it('层叠加：上层赢，且覆盖留痕（与面板同一条规则）', () =>
    {
        registerPlugins([manifest('p-builtin', [aiTool('same_tool', 'a.b')])], 'builtin');
        registerPlugins([manifest('p-user', [aiTool('same_tool', 'c.d')])], 'user');

        const tools = getContributionTable().aiTools;

        expect(tools.length).toBe(1);
        expect(tools[0].source).toBe('p-user');
        expect(tools[0].overriddenBy).toEqual(['p-builtin']);
        // 上层赢的是**整条**贡献（方法名也跟着换）——不能一半上层、一半下层
        expect(tools[0].method).toBe('c.d');
    });
});
