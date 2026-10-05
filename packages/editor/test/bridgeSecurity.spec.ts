import { describe, expect, it } from 'vitest';
import {
    checkBridgeRequest,
    checkBridgeToken,
    createBridgeToken,
    hostnameOfHost,
    isLoopbackHostname,
    isPageSideRoute,
} from '../bridge/security.mjs';
import { BRIDGE_PROTOCOL_VERSION, checkBridgeProtocolVersion } from '../bridge/protocol.mjs';

/**
 * 桥接来源校验（#273 P2 / D9 通信安全）。
 *
 * ## 为什么以负例为主
 *
 * "正常请求能过"这条判据单独存在时，**把整个校验删掉也照样绿**。
 * 而安全的回归恰恰长这样：某天有人觉得"这个校验太麻烦"，顺手放宽——没有任何东西会因此变红。
 *
 * 三条攻击面各有用例：跨源网页（`Origin`）、DNS rebinding（`Host`）、
 * 以及"别把同源请求误伤"（浏览器对同源 GET **不发** `Origin`）。
 */
describe('桥接来源校验', () =>
{
    const localPort = 3000;

    /** 跑一次校验 */
    const check = (headers: Record<string, unknown>) => checkBridgeRequest({ headers, localPort });

    it('本机 Host + 无 Origin（同源 GET）→ 放行', () =>
    {
        // 浏览器对**同源 GET** 不发 Origin——而页面自己就是用 `GET /pending` 拉任务的。
        // 这条要是拒了，编辑器自己的通道就断了
        expect(check({ host: '127.0.0.1:3000' })).toEqual({ ok: true });
        expect(check({ host: 'localhost:3000' })).toEqual({ ok: true });
        expect(check({ host: '[::1]:3000' })).toEqual({ ok: true });
    });

    it('本机 Origin → 放行（三种本机写法都认）', () =>
    {
        expect(check({ host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' })).toEqual({ ok: true });
        expect(check({ host: 'localhost:3000', origin: 'http://localhost:3000' })).toEqual({ ok: true });
        expect(check({ host: '[::1]:3000', origin: 'http://[::1]:3000' })).toEqual({ ok: true });
    });

    it('**跨源 Origin 被拒**（恶意网页这一路）', () =>
    {
        const verdict = check({ host: '127.0.0.1:3000', origin: 'http://evil.example' });

        expect(verdict.ok).toBe(false);
        expect(verdict.reason).toContain('Origin 非本机');
    });

    it('`Origin: null` 被拒（sandbox iframe / file:// 伪装）', () =>
    {
        // `Origin: null` 是真实存在的取值（sandbox iframe、被重定向的跨源请求）——
        // 它必须与"没有 Origin"区分开，否则就是给攻击者留了一个免费入口
        expect(check({ host: '127.0.0.1:3000', origin: 'null' }).ok).toBe(false);
        expect(check({ host: '127.0.0.1:3000', origin: 'file://' }).ok).toBe(false);
    });

    it('**Host 非本机被拒**（DNS rebinding：攻击者域名解析到 127.0.0.1）', () =>
    {
        const verdict = check({ host: 'evil.example:3000' });

        expect(verdict.ok).toBe(false);
        expect(verdict.reason).toContain('DNS rebinding');
    });

    it('端口不符被拒（Host 与 Origin 都查）', () =>
    {
        expect(check({ host: '127.0.0.1:9999' }).ok).toBe(false);
        expect(check({ host: '127.0.0.1:3000', origin: 'http://127.0.0.1:9999' }).ok).toBe(false);
    });

    it('缺 Host 被拒；`0.0.0.0` **不**当作本机', () =>
    {
        expect(check({}).ok).toBe(false);
        // `0.0.0.0` 是"监听全部网卡"的写法，不是访问用的主机名——放进白名单等于白送
        expect(check({ host: '0.0.0.0:3000' }).ok).toBe(false);
        expect(isLoopbackHostname('0.0.0.0')).toBe(false);
    });

    it('主机名解析兼容三种写法（含 IPv6）', () =>
    {
        expect(hostnameOfHost('127.0.0.1:3000')).toEqual({ name: '127.0.0.1', port: 3000 });
        expect(hostnameOfHost('localhost')).toEqual({ name: 'localhost', port: null });
        expect(hostnameOfHost('[::1]:3000')).toEqual({ name: '::1', port: 3000 });
        // `127.0.0.0/8` 整段都是回环，不只是 .1
        expect(isLoopbackHostname('127.0.0.5')).toBe(true);
    });
});

describe('一次性 token（#273 P2 / D9 第二步）', () =>
{
    const token = 'abc123';

    it('缺 / 错 / 对三种情况；WS 的查询串也认（握手不能自定义头）', () =>
    {
        // 服务端没启用 token（单测 / 降级路径）：放行，由调用方决定要不要告警
        expect(checkBridgeToken({ token: '' })).toEqual({ ok: true });

        expect(checkBridgeToken({ headers: {}, token }).ok).toBe(false);
        expect(checkBridgeToken({ headers: { 'x-editor-bridge-token': 'abc124' }, token }).ok).toBe(false);
        // 长度不同也得走"判否"而不是抛错（`timingSafeEqual` 要求等长）
        expect(checkBridgeToken({ headers: { 'x-editor-bridge-token': 'abc12' }, token }).ok).toBe(false);
        expect(checkBridgeToken({ headers: { 'x-editor-bridge-token': token }, token })).toEqual({ ok: true });
        expect(checkBridgeToken({ search: `?token=${token}`, token })).toEqual({ ok: true });
    });

    it('页面侧端点清单：**只有领任务与交结果**要 token', () =>
    {
        const prefix = '/__editor-bridge';

        // 本地工具（CLI / MCP / 15 个 e2e 脚本）走的是这三条——要求 token 会让它们全部要改，
        // 而浏览器里的攻击者本来就到不了它们（跨源被 Origin 挡、响应被 CORS 挡住读不到）
        expect(isPageSideRoute('POST', `${prefix}/call`, prefix)).toBe(false);
        expect(isPageSideRoute('GET', `${prefix}/ping`, prefix)).toBe(false);
        expect(isPageSideRoute('GET', `${prefix}/result`, prefix)).toBe(false);

        // 页面侧
        expect(isPageSideRoute('GET', `${prefix}/pending`, prefix)).toBe(true);
        expect(isPageSideRoute('POST', `${prefix}/result`, prefix)).toBe(true);

        // **方法也算判据**：`GET /result` 是调用方取结果（不要 token），`POST` 才是页面交结果
        expect(isPageSideRoute('POST', `${prefix}/pending`, prefix)).toBe(false);
    });

    it('生成的 token 足够长、URL 安全、每次不同', () =>
    {
        const first = createBridgeToken();

        expect(first.length).toBeGreaterThanOrEqual(30);
        // URL 安全字符集：它要放进 WS 握手的查询串
        expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(createBridgeToken()).not.toBe(first);
    });
});

describe('桥接协议版本（#273 P2 / D9 最后一条）', () =>
{
    it('**没声明**与**不匹配**都拒，匹配放行——且 reason 说清两边各是什么', () =>
    {
        expect(checkBridgeProtocolVersion(undefined).ok).toBe(false);
        expect(checkBridgeProtocolVersion('').ok).toBe(false);
        expect(checkBridgeProtocolVersion(123).ok).toBe(false);

        const mismatch = checkBridgeProtocolVersion('0.0.1-old', '1.0.0');

        expect(mismatch.ok).toBe(false);
        // 沿用 `apiVersion.ts` 的风格：说清"要什么、现在是什么"，而不是只回一个失败
        expect(mismatch.reason).toContain('0.0.1-old');
        expect(mismatch.reason).toContain('1.0.0');

        // 页面与服务端共用同一个常量，所以"正常"这条永远成立
        expect(checkBridgeProtocolVersion(BRIDGE_PROTOCOL_VERSION)).toEqual({ ok: true });
        expect(checkBridgeProtocolVersion('1.0.0', '1.0.0')).toEqual({ ok: true });
    });
});
