import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logic } from 'feng3d';
import {
    DEFAULT_PATCH_URL,
    EDITOR_PLUGIN_API_VERSION,
    USER_PATCH_PLUGIN_ID,
    getContributionTable,
    getPanelContributions,
    getPanelContributionsAt,
    getPatchState,
    getPluginStatus,
    getSceneOverlays,
    installBuiltinPlugins,
    loadUserPatch,
    resetPlugins,
    resetUserPatch,
    resolvePatchUrl,
    setPluginEnabled,
    validatePatch,
} from '../src/plugins';

/**
 * 用户 patch 层（issue #171）。
 *
 * 三条被测的性质：
 *
 * 1. **局部覆盖**：只写要改的字段，其余继承下层（用户不必抄一遍完整清单）；
 * 2. **坏 patch 不生效也不留痕**：校验失败时一个字段都不改，原因进 `getPatchState()`——
 *    用户手写的本地文件写错一个字符就白屏是没法接受的；
 * 3. **层序**：patch 在最上层，但**设置面板里的显式开关压过它**（最近一次用户操作赢）。
 */

const PARTICLE = '@feng3d/editor-plugin-particle';

/** 把 fetch 换成固定响应（不传 contentType 时默认 application/json） */
function stubFetch(handler: (url: string) => { status?: number; body?: string; contentType?: string } | Error): void
{
    vi.stubGlobal('fetch', async (url: string) =>
    {
        const result = handler(String(url));
        if (result instanceof Error) throw result;

        const status = result.status ?? 200;
        const contentType = result.contentType ?? 'application/json';

        return {
            ok: status >= 200 && status < 300,
            status,
            headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null) },
            text: async () => result.body ?? '',
        };
    });
}

/** 一份合法的 patch：挪面板 + 改标签 + 关插件 + 改名 */
function validPatch(): string
{
    return JSON.stringify({
        apiVersion: `^${EDITOR_PLUGIN_API_VERSION}`,
        name: '我的本地覆盖',
        plugins: {
            [PARTICLE]: { enabled: false, name: '粒子（我关了）' },
        },
        contributes: {
            panels: [{ id: 'hierarchy', placement: 'project', labelKey: 'panels.myHierarchy' }],
        },
    });
}

beforeEach(() =>
{
    resetPlugins();
    resetUserPatch();
    localStorage.clear();
    installBuiltinPlugins();
});

afterEach(() =>
{
    vi.unstubAllGlobals();
});

describe('patch 地址', () =>
{
    it('默认读编辑器根目录的 editor.patch.json', () =>
    {
        expect(resolvePatchUrl()).toEqual({ url: DEFAULT_PATCH_URL, source: 'file' });
    });

    it('显式传入优先（?patch= 走同一条路）', () =>
    {
        expect(resolvePatchUrl('/my.json')).toEqual({ url: '/my.json', source: 'url' });
    });
});

describe('结构校验：错误要能照着改', () =>
{
    it('合法 patch 没有问题', () =>
    {
        expect(validatePatch(JSON.parse(validPatch()))).toEqual([]);
    });

    it('顶层不是对象', () =>
    {
        expect(validatePatch('nope')).toEqual(['patch 的顶层必须是一个 JSON 对象']);
    });

    it('缺 apiVersion → 指出当前版本', () =>
    {
        const problems = validatePatch({ contributes: {} });

        expect(problems.length).toBe(1);
        expect(problems[0]).toContain('没有声明');
        expect(problems[0]).toContain(EDITOR_PLUGIN_API_VERSION);
    });

    it('apiVersion 不兼容 → 要什么、现在是什么都在', () =>
    {
        const problems = validatePatch({ apiVersion: '^9.0.0' });

        expect(problems.join()).toContain('^9.0.0');
        expect(problems.join()).toContain(EDITOR_PLUGIN_API_VERSION);
    });

    it('面板项缺 id / placement 非法 / 写了 view → 逐条指出', () =>
    {
        const problems = validatePatch({
            apiVersion: `^${EDITOR_PLUGIN_API_VERSION}`,
            contributes: {
                panels: [
                    { placement: 'main' },
                    { id: 'hierarchy', placement: '左边' },
                    { id: 'scene', view: 'x' },
                ],
            },
        });

        expect(problems.some((problem) => problem.includes('id 必须是非空字符串'))).toBe(true);
        expect(problems.some((problem) => problem.includes('placement 只能是'))).toBe(true);
        expect(problems.some((problem) => problem.includes('view 不能出现在 patch 里'))).toBe(true);
    });

    it('plugins 的类型写错也会被指出', () =>
    {
        const problems = validatePatch({
            apiVersion: `^${EDITOR_PLUGIN_API_VERSION}`,
            plugins: { p1: { enabled: 'yes' } },
        });

        expect(problems.join()).toContain('enabled 必须是 true / false');
    });
});

describe('加载与应用', () =>
{
    it('没有 patch 文件（404）是正常状态，不算错误', async () =>
    {
        stubFetch(() => ({ status: 404 }));

        const state = await loadUserPatch();

        expect(state).toMatchObject({ source: 'none', applied: false });
        expect(state.error).toBeUndefined();
        expect(getPatchState().applied).toBe(false);
    });

    it('dev server 的 SPA 回退（200 + text/html）也算"没有 patch"，不报成 JSON 写坏', async () =>
    {
        // 实测踩过：Vite 对不存在的路径回退到 index.html，于是这里会拿到一整页 HTML。
        // 若把它当"写坏了"，用户明明没写 patch 却看到一条 JSON 解析错误——比不报还糟
        stubFetch(() => ({ status: 200, contentType: 'text/html', body: '<!DOCTYPE html><html></html>' }));

        const state = await loadUserPatch();

        expect(state).toMatchObject({ source: 'none', applied: false });
        expect(state.error).toBeUndefined();
    });

    it('合法 patch：局部覆盖面板 + 关插件 + 改名，都真的生效', async () =>
    {
        stubFetch(() => ({ body: validPatch() }));

        const state = await loadUserPatch();

        expect(state).toMatchObject({ applied: true, source: 'file' });
        expect(state.overriddenContributions).toEqual(['panel:hierarchy']);
        expect(state.overriddenPlugins).toEqual([PARTICLE]);

        // 面板挪到 project、标签换成 patch 里写的；**其余字段继承下层**（视图还在）
        const moved = getPanelContributionsAt('project').find((panel) => panel.id === 'hierarchy')!;
        expect(moved.labelKey).toBe('panels.myHierarchy');
        expect(getPanelContributionsAt('hierarchy')).toEqual([]);
        expect(typeof moved.view).toBe('function');
        expect(moved.source).toBe(USER_PATCH_PLUGIN_ID);
        expect(moved.layer).toBe('user');
        expect(moved.overriddenBy).toEqual(['@feng3d/editor-plugin-core-panels']);

        // 插件级：关掉了粒子（浮层没了），名字也换了
        expect(getSceneOverlays()).toEqual([]);
        expect(getPluginStatus(PARTICLE)?.enabled).toBe(false);
        expect(getPluginStatus(PARTICLE)?.patchEnabled).toBe(false);
        expect(getPluginStatus(PARTICLE)?.name).toBe('粒子（我关了）');
        expect(getPluginStatus(PARTICLE)?.manifestName).toBe('粒子效果');

        // 贡献表把 patch 层如实 dump 出来
        const table = getContributionTable();
        expect(table.userPatch).toMatchObject({ source: 'file', applied: true });
        expect(table.plugins.find((plugin) => plugin.id === USER_PATCH_PLUGIN_ID)?.layer).toBe('user');
    });

    it('patch 关掉的插件，其 Logic 真的被注销（不是只在界面上消失）', async () =>
    {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { /* 静音"未注册"提示 */ });
        stubFetch(() => ({
            body: JSON.stringify({
                apiVersion: `^${EDITOR_PLUGIN_API_VERSION}`,
                plugins: { '@feng3d/editor-plugin-mrs-tool': { enabled: false } },
            }),
        }));

        expect(logic({ __type__: 'MRSTool' } as never)).not.toBeNull();
        await loadUserPatch();
        expect(logic({ __type__: 'MRSTool' } as never)).toBeNull();

        spy.mockRestore();
    });

    it('坏 JSON → 不生效，原因进状态', async () =>
    {
        stubFetch(() => ({ body: '{ 这不是 json' }));

        const state = await loadUserPatch();

        expect(state.applied).toBe(false);
        expect(state.error).toContain('不是合法 JSON');
    });

    it('读取失败（500）→ 不生效，原因里带状态码', async () =>
    {
        stubFetch(() => ({ status: 500 }));

        const state = await loadUserPatch();

        expect(state.applied).toBe(false);
        expect(state.error).toContain('HTTP 500');
    });

    it('引用不存在的面板 → 一句说清，且**一个字段都不改**（事务性）', async () =>
    {
        stubFetch(() => ({
            body: JSON.stringify({
                apiVersion: `^${EDITOR_PLUGIN_API_VERSION}`,
                plugins: { [PARTICLE]: { enabled: false } },
                contributes: { panels: [{ id: '不存在的面板', placement: 'project' }] },
            }),
        }));

        const before = getPanelContributions().map((panel) => `${panel.id}:${panel.placement}`);
        const state = await loadUserPatch();

        expect(state.applied).toBe(false);
        expect(state.error).toContain('在下层不存在');
        // 面板没动，插件也没被关掉（否则用户看到的是"一半生效"）
        expect(getPanelContributions().map((panel) => `${panel.id}:${panel.placement}`)).toEqual(before);
        expect(getPluginStatus(PARTICLE)?.enabled).toBe(true);
    });

    it('引用不存在的插件 → 报错并列出可用插件', async () =>
    {
        stubFetch(() => ({
            body: JSON.stringify({ apiVersion: `^${EDITOR_PLUGIN_API_VERSION}`, plugins: { '不存在': { enabled: false } } }),
        }));

        const state = await loadUserPatch();

        expect(state.applied).toBe(false);
        expect(state.error).toContain('不存在的插件');
        expect(state.error).toContain(PARTICLE);
    });
});

describe('层序：设置面板的显式开关压过 patch', () =>
{
    it('patch 说关、用户刚在面板里打开 → 以面板为准', async () =>
    {
        stubFetch(() => ({ body: validPatch() }));
        await loadUserPatch();
        expect(getPluginStatus(PARTICLE)?.enabled).toBe(false);

        setPluginEnabled(PARTICLE, true);

        const status = getPluginStatus(PARTICLE)!;
        expect(status.enabled).toBe(true);
        expect(status.userSwitch).toBe(true);
        // patch 的设定仍在（只是被压住了），这样用户清掉开关后能回到 patch 的意图
        expect(status.patchEnabled).toBe(false);
    });
});
