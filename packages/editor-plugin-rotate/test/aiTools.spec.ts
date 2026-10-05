import { describe, expect, it } from 'vitest';
import { manifest } from '../src/client';
import { ROTATE_API_VERSION, ROTATE_TYPE } from '../src/shared';

/**
 * 样板插件的 **AI 工具**（#281 **路径 B** 的可执行示例）。
 *
 * 这里守的是"样板真的演示了那条路"：**给桥接方法写上 `description` / `inputSchema`，
 * 它就成了 AI 工具** —— MCP 的 `listTools` 读它就是工具定义（名字 = 方法名把 `.` 换 `_`）。
 *
 * **不再有 `aiTools`**（路径 A 那份声明已删除）：留着它是"同一个方法写两遍"的漂移隐患 ——
 * 路径 A 当年正是断在"贡献表只把 `name` 传下去"这一步，而"方法自带"没有这个中间环节。
 */
describe('样板插件的 AI 工具（#281 路径 B）', () =>
{
    const bridgeMethods = manifest.contributes.bridgeMethods ?? [];
    const aiTools = manifest.contributes.aiTools ?? [];

    it('不再另写 `aiTools`：唯一的 AI 工具来源是方法自带元数据', () =>
    {
        expect(aiTools).toEqual([]);
        expect(bridgeMethods.map((method) => method.name)).toContain('rotate.info');

        // 描述与 schema 是"AI 用不用得起来"的全部依据（MCP 一致性门禁也查这两条）
        const method = bridgeMethods.find((entry) => entry.name === 'rotate.info');

        expect(method?.description?.length ?? 0).toBeGreaterThan(10);
        expect(method?.inputSchema).toMatchObject({ type: 'object' });
    });

    it('handler 是纯函数（不碰编辑器 API），返回 __type__ 与 apiVersion', async () =>
    {
        const result = await Promise.resolve(bridgeMethods[0].handler({}));

        expect(result).toEqual({ type: ROTATE_TYPE, apiVersion: ROTATE_API_VERSION });
    });

    it('工具名由方法名推出（`rotate.info` → `rotate_info`），与 MCP 侧规则一致', () =>
    {
        // MCP 的 `listTools` 用的就是这条规则；这里把它**写死**成断言，
        // 于是"方法改名却忘了工具名会跟着变"会在样板包这一层就红，而不是等到端到端脚本。
        const toolName = bridgeMethods[0].name.replace(/\./g, '_');

        expect(toolName).toBe('rotate_info');
    });
});
