import { describe, expect, it } from 'vitest';
import { manifest } from '../src/client';
import { ROTATE_API_VERSION, ROTATE_TYPE } from '../src/shared';

/**
 * 样板插件的 **AI 工具**（#281 路径 A 的可执行示例）。
 *
 * 这里守的是"样板真的演示了那条路"：`bridgeMethods`（方法存在）与 `aiTools`（AI 眼里长什么样）
 * **两样都贡献**，且 `aiTool.method` 确实指向自己贡献的方法——少任何一半，
 * "装上插件 AI 就多一个工具"都不成立（一致性门禁在 MCP 侧另有一道）。
 */
describe('样板插件的 AI 工具（#281 路径 A）', () =>
{
    const bridgeMethods = manifest.contributes.bridgeMethods ?? [];
    const aiTools = manifest.contributes.aiTools ?? [];

    it('同时贡献 bridgeMethod 与 aiTool，且 aiTool 指向它', () =>
    {
        expect(aiTools.map((tool) => tool.name)).toEqual(['rotate_info']);
        expect(aiTools[0].method).toBe('rotate.info');
        expect(bridgeMethods.map((method) => method.name)).toContain(aiTools[0].method);

        // 描述与 schema 是"AI 用不用得起来"的全部依据（MCP 一致性门禁也查这两条）
        expect(aiTools[0].description.length).toBeGreaterThan(10);
        expect(aiTools[0].inputSchema).toMatchObject({ type: 'object' });
    });

    it('handler 是纯函数（不碰编辑器 API），返回 __type__ 与 apiVersion', async () =>
    {
        const result = await Promise.resolve(bridgeMethods[0].handler({}));

        expect(result).toEqual({ type: ROTATE_TYPE, apiVersion: ROTATE_API_VERSION });
    });

    it('**方法自带** AI 元数据（#281 路径 B），且与 `aiTools` 里那份一致', () =>
    {
        // 路径 A 是"另写一份工具声明"，路径 B 是"方法自带"——两处内容必须一致，
        // 否则路径 B 一旦在 MCP 侧生效，AI 看到的说明会与清单里写的**不是同一份**。
        const method = bridgeMethods.find((entry) => entry.name === 'rotate.info');

        expect(method?.description).toBe(aiTools[0].description);
        expect(method?.inputSchema).toEqual(aiTools[0].inputSchema);
    });
});
